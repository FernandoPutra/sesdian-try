// app/api/admin/checkin/route.ts
// Place: /app/api/admin/checkin/route.ts
// ------------------------------------------------------------
// Admin Check-in (Return Processing)
// - Updates each loan_item.condition_after
// - Updates asset.condition & asset.status → 'available'
//   (or 'under_repair' if condition_after is 'rusak_berat')
// - Updates loan_request.status → 'returned'
// - Sends WA confirmation & logs to notification_logs
// - Full Audit Trail
// ------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { sendWhatsApp } from '@/lib/whatsapp';

interface CheckinItem {
  loan_item_id: number;
  condition_after: 'baik' | 'rusak_ringan' | 'rusak_berat';
  notes_return?: string;
}

export async function POST(req: NextRequest) {
  const adminId = req.headers.get('x-user-id')!;

  const {
    loan_request_id,
    items,
  }: { loan_request_id: number; items: CheckinItem[] } = await req.json();

  if (!loan_request_id || !items?.length) {
    return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
  }

  // ── Load loan request ──────────────────────────────────────
  const [loanRows]: any = await db.query(
    `SELECT lr.*, u.name AS borrower_name, u.phone AS borrower_phone
     FROM loan_requests lr
     JOIN users u ON u.id = lr.user_id
     WHERE lr.id = ? LIMIT 1`,
    [loan_request_id],
  );

  const loan = loanRows[0];
  if (!loan) {
    return NextResponse.json({ error: 'Peminjaman tidak ditemukan.' }, { status: 404 });
  }
  if (!['approved', 'borrowed', 'overdue'].includes(loan.status)) {
    return NextResponse.json(
      { error: `Status peminjaman tidak valid untuk check-in: ${loan.status}` },
      { status: 422 },
    );
  }

  // ── Load loan items ────────────────────────────────────────
  const itemIds = items.map((i) => i.loan_item_id);
  const [loanItems]: any = await db.query(
    `SELECT li.id, li.asset_id, a.name AS asset_name, a.is_consumable
     FROM loan_items li
     JOIN assets a ON a.id = li.asset_id
     WHERE li.id IN (${itemIds.map(() => '?').join(',')})
       AND li.loan_request_id = ?`,
    [...itemIds, loan_request_id],
  );

  if (loanItems.length !== items.length) {
    return NextResponse.json({ error: 'Beberapa item tidak valid.' }, { status: 422 });
  }

  const loanItemMap: Record<number, any> = {};
  for (const li of loanItems) loanItemMap[li.id] = li;

  // ── Transaction ────────────────────────────────────────────
  const conn = await (db as any).getConnection();
  await conn.beginTransaction();
  const now = new Date();

  try {
    for (const item of items) {
      const li = loanItemMap[item.loan_item_id];

      // Update loan_item
      await conn.query(
        `UPDATE loan_items
         SET condition_after = ?,
             notes_return     = ?,
             checked_in_by    = ?,
             checked_in_at    = ?
         WHERE id = ?`,
        [item.condition_after, item.notes_return ?? null, adminId, now, item.loan_item_id],
      );

      // Skip asset status update for consumables (no return expected)
      if (!li.is_consumable) {
        // If heavily damaged → put to repair queue; otherwise restore to available
        const newAssetStatus =
          item.condition_after === 'rusak_berat' ? 'under_repair' : 'available';

        await conn.query(
          `UPDATE assets
           SET condition = ?, status = ?, updated_at = ?
           WHERE id = ?`,
          [item.condition_after, newAssetStatus, now, li.asset_id],
        );
      }
    }

    // Mark loan as returned
    await conn.query(
      `UPDATE loan_requests SET status = 'returned', updated_at = ? WHERE id = ?`,
      [now, loan_request_id],
    );

    await conn.commit();

    // ── Audit ────────────────────────────────────────────────
    await auditLog({
      actorId: Number(adminId),
      action: 'LOAN_CHECKIN',
      entityType: 'loan_requests',
      entityId: loan_request_id,
      oldValue: { status: loan.status },
      newValue: { status: 'returned', items_checked: items.length },
      req,
    });

    // ── WhatsApp Notification ────────────────────────────────
    if (loan.borrower_phone) {
      const message =
        `✅ *SESDIAN - Konfirmasi Pengembalian*\n\n` +
        `Halo ${loan.borrower_name},\n` +
        `Pengembalian aset untuk peminjaman *${loan.batch_code}* telah dikonfirmasi oleh Admin.\n` +
        `Terima kasih! 🙏`;

      const waResult = await sendWhatsApp(loan.borrower_phone, message);

      // Log WA regardless of success/fail
      await db.query(
        `INSERT INTO notification_logs
           (loan_request_id, recipient_user_id, recipient_phone, template_type,
            message_body, wa_message_id, status, error_detail, sent_at)
         VALUES (?, ?, ?, 'checkin_confirm', ?, ?, ?, ?, ?)`,
        [
          loan_request_id,
          loan.user_id,
          loan.borrower_phone,
          message,
          waResult.messageId ?? null,
          waResult.success ? 'sent' : 'failed',
          waResult.error ?? null,
          waResult.success ? now : null,
        ],
      );
    }

    return NextResponse.json({ ok: true, message: 'Check-in berhasil.' });
  } catch (err) {
    await conn.rollback();
    console.error('[CHECKIN]', err);
    return NextResponse.json({ error: 'Gagal memproses check-in.' }, { status: 500 });
  } finally {
    conn.release();
  }
}