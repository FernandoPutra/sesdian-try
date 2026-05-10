// middleware.ts
// Place: /middleware.ts  (Next.js App Router root)
// ------------------------------------------------------------
// SESDIAN Auth Middleware
// - RBAC: protects /admin/** and /user/**
// - 30-min inactivity auto-logout via signed JWT + lastActive claim
// - Public: /public/**, /login, /register, /api/auth/**
// ------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const TOKEN_COOKIE = 'sesdian_token';

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/api/admin/:path*',
    '/api/user/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('callbackUrl', pathname);

  // ── 1. No token → redirect ──────────────────────────────────
  if (!token) return redirectToLogin(req, loginUrl);

  // ── 2. Verify + decode ──────────────────────────────────────
  let payload: {
    sub: string;
    role: 'admin' | 'user';
    lastActive: number;
  };

  try {
    const { payload: raw } = await jwtVerify(token, SECRET);
    payload = raw as typeof payload;
  } catch {
    return redirectToLogin(req, loginUrl, true);
  }

  // ── 3. 30-min inactivity check ──────────────────────────────
  const now = Date.now();
  if (now - payload.lastActive > INACTIVITY_LIMIT_MS) {
    return redirectToLogin(req, loginUrl, true, 'Session expired due to inactivity.');
  }

  // ── 4. RBAC ─────────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminRoute && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/403', req.url));
  }

  // ── 5. Refresh lastActive (sliding window) ──────────────────
  const refreshed = await new SignJWT({
    sub: payload.sub,
    role: payload.role,
    lastActive: now,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(SECRET);

  const res = NextResponse.next();
  res.cookies.set(TOKEN_COOKIE, refreshed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8h hard cap
    path: '/',
  });

  // Forward user info to route handlers via header
  res.headers.set('x-user-id', payload.sub);
  res.headers.set('x-user-role', payload.role);

  return res;
}

// ── Helpers ────────────────────────────────────────────────────
function redirectToLogin(
  req: NextRequest,
  loginUrl: URL,
  clearCookie = false,
  reason?: string,
) {
  if (reason) loginUrl.searchParams.set('reason', reason);
  const res = NextResponse.redirect(loginUrl);
  if (clearCookie) {
    res.cookies.set(TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
  }
  return res;
}