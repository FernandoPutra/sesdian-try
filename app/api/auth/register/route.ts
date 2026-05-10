// app/api/auth/register/route.ts
// Place: /app/api/auth/register/route.ts
// ------------------------------------------------------------
// NIP unique validation: check DB before insert to prevent
// duplicate accounts (also enforced at DB level via UNIQUE KEY).
// ------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { nip, name, email, phone, password } = await req.json();

  // ── Basic validation ───────────────────────────────────────
  if (!nip || !name || !email || !password) {
    return NextResponse.json({ error: 'Field wajib tidak lengkap.' }, { status: 400 });
  }
  if (!/^\d{18}$/.test(nip)) {
    return NextResponse.json({ error: 'NIP harus 18 digit angka.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 });
  }

  // ── NIP duplicate check ────────────────────────────────────
  const [nipRows]: any = await db.query(
    `SELECT id FROM users WHERE nip = ? LIMIT 1`,
    [nip],
  );
  if (nipRows.length > 0) {
    return NextResponse.json({ error: 'NIP sudah terdaftar. Hubungi Admin.' }, { status: 409 });
  }

  // ── Email duplicate check ──────────────────────────────────
  const [emailRows]: any = await db.query(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  if (emailRows.length > 0) {
    return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
  }

  // ── Insert with status='pending' (Admin must approve) ──────
  const hashed = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO users (nip, name, email, phone, password, role, status)
     VALUES (?, ?, ?, ?, ?, 'user', 'pending')`,
    [nip, name, email, phone ?? null, hashed],
  );

  return NextResponse.json(
    { ok: true, message: 'Registrasi berhasil. Menunggu persetujuan Admin.' },
    { status: 201 },
  );
}