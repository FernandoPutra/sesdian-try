'use client';
// components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface SidebarProps {
  role: 'admin' | 'user';
  userName: string;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',     icon: '⊞' },
  { label: 'Aset',         href: '/admin/assets',        icon: '📦' },
  { label: 'Ruangan',      href: '/admin/rooms',         icon: '🏢' },
  { label: 'QR Code',      href: '/admin/qr',            icon: '⬛' },
  { label: 'Persetujuan',  href: '/admin/transactions',  icon: '📋' },
  { label: 'Pengembalian', href: '/admin/returns',       icon: '↩️' },
  { label: 'Pengguna',     href: '/admin/users',         icon: '👥' },
  { label: 'Log WA',       href: '/admin/logs/wa',       icon: '💬' },
  { label: 'Aktivitas',    href: '/admin/logs/activity', icon: '🕐' },
  { label: 'Laporan PDF',  href: '/admin/reports',       icon: '📄' },
];

const USER_NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/user/dashboard',  icon: '⊞' },
  { label: 'Peminjaman',   href: '/user/peminjaman', icon: '📤' },
  { label: 'Tracking',     href: '/user/tracking',   icon: '🔍' },
];

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = role === 'admin' ? ADMIN_NAV : USER_NAV;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const sidebarContent = (
    <div style={{
      width: 230, height: '100vh', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 100,
      transform: open ? 'translateX(0)' : undefined,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏛</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>SESDIAN</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(0,212,160,0.1)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 13, color: 'var(--accent)',
            border: '1px solid var(--border)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%' }}>
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 10px', color: 'var(--text)', cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >☰</button>
      {sidebarContent}
      {/* Overlay mobile */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}