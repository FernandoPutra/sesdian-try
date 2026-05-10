// app/api/user/peminjaman/route.ts
// Place: /app/api/user/peminjaman/route.ts
// ------------------------------------------------------------
// Batch Loan Request
// - Single or multi-asset in one batch_code
// - Consumables: return_due_date = NULL
// - Assets with status 'under_repair' are rejected
// - Inserts loan_request + loan_items in a transaction
// ------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';

interface LoanItem {
  asset_id: number;
  quantity?: number;
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!;

  const {
    items,           // LoanItem[]
    purpose,
    borrow_date,
    return_due_date, // null/undefined for consumable-only batches
  }: {
    items: LoanItem[];
    purpose: string;
    borrow_date: string;
    return_due_date?: string | null;
  } = await req.json();

  if (!items?.length || !purpose || !borrow_date) {
    return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
  }

  const assetIds = items.map((i) => i.asset_id);

  // ── Fetch assets to validate ───────────────────────────────
  const [assets]: any = await db.query(
    `SELECT id, name, status, is_consumable, condition
     FROM assets
     WHERE id IN (${assetIds.map(() => '?').join(',')})`,
    assetIds,
  );

  const assetMap: Record<number, any> = {};
  for (const a of assets) assetMap[a.id] = a;

  // Validate each requested asset
  for (const item of items) {
    const asset = assetMap[item.asset_id];
    if (!asset) {
      return NextResponse.json(
        { error: `Aset ID ${item.asset_id} tidak ditemukan.` },
        { status: 404 },
      );
    }
    if (asset.status === 'under_repair') {
      return NextResponse.json(
        { error: `Aset "${asset.name}" sedang dalam perbaikan.` },
        { status: 422 },
      );
    }
    if (asset.status !== 'available') {
      return NextResponse.json(
        { error: `Aset "${asset.name}" tidak tersedia (${asset.status}).` },
        { status: 422 },
      );
    }
  }

  // ── Determine return_due_date per batch ────────────────────
  // If ANY item is a fixed asset, return date is required
  const hasFixedAsset = assets.some((a: any) => !a.is_consumable);
  if (hasFixedAsset && !return_due_date) {
    return NextResponse.json(
      { error: 'Tanggal pengembalian wajib untuk aset tetap (non-konsumabel).' },
      { status: 400 },
    );
  }

  // ── Transaction ────────────────────────────────────────────
  const conn = await (db as any).getConnection();
  await conn.beginTransaction();

  try {
    const batchCode = `LOAN-${nanoid(10).toUpperCase()}`;

    const [result]: any = await conn.query(
      `INSERT INTO loan_requests
         (batch_code, user_id, purpose, borrow_date, return_due_date, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [batchCode, userId, purpose, borrow_date, return_due_date ?? null],
    );

    const loanRequestId: number = result.insertId;

    // Insert loan_items
    for (const item of items) {
      const asset = assetMap[item.asset_id];
      await conn.query(
        `INSERT INTO loan_items
           (loan_request_id, asset_id, quantity, condition_before)
         VALUES (?, ?, ?, ?)`,
        [loanRequestId, item.asset_id, item.quantity ?? 1, asset.condition],
      );
    }

    await conn.commit();

    await auditLog({
      actorId: Number(userId),
      action: 'LOAN_REQUESTED',
      entityType: 'loan_requests',
      entityId: loanRequestId,
      newValue: { batch_code: batchCode, item_count: items.length },
      req,
    });

    return NextResponse.json(
      { ok: true, loan_request_id: loanRequestId, batch_code: batchCode },
      { status: 201 },
    );
  } catch (err) {
    await conn.rollback();
    console.error('[PEMINJAMAN]', err);
    return NextResponse.json({ error: 'Gagal membuat permintaan.' }, { status: 500 });
  } finally {
    conn.release();
  }
}