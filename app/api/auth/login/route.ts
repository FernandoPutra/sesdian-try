// app/api/auth/login/route.ts
// Place: /app/api/auth/login/route.ts
// ------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; // your mysql2 pool wrapper

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const TOKEN_COOKIE = 'sesdian_token';

export async function POST(req: NextRequest) {
  const { nip, password } = await req.json();

  if (!nip || !password) {
    return NextResponse.json({ error: 'NIP dan password wajib diisi.' }, { status: 400 });
  }

  const [rows]: any = await db.query(
    `SELECT id, nip, name, role, status, password FROM users WHERE nip = ? LIMIT 1`,
    [nip],
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'NIP atau password salah.' }, { status: 401 });
  }
  if (user.status !== 'active') {
    return NextResponse.json({ error: 'Akun belum aktif atau ditangguhkan.' }, { status: 403 });
  }

  const token = await new SignJWT({
    sub: String(user.id),
    role: user.role,
    lastActive: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(SECRET);

  const res = NextResponse.json({ ok: true, role: user.role, name: user.name });
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  });
  return res;
}