// app/admin/dashboard/page.tsx
import { db } from '@/lib/db';
import Link from 'next/link';

async function getStats() {
  const [[assets]]: any   = await db.query(`SELECT COUNT(*) as total, SUM(status='available') as available, SUM(status='borrowed') as borrowed, SUM(status='under_repair') as repair FROM assets`);
  const [[loans]]: any    = await db.query(`SELECT SUM(status='pending') as pending, SUM(status='overdue') as overdue FROM loan_requests`);
  const [[users]]: any    = await db.query(`SELECT SUM(status='pending') as pending_users FROM users WHERE role='user'`);
  const [recent]: any     = await db.query(`SELECT lr.id, lr.batch_code, lr.status, lr.created_at, u.name FROM loan_requests lr JOIN users u ON u.id=lr.user_id ORDER BY lr.created_at DESC LIMIT 8`);
  return { assets, loans, users, recent };
}

export default async function AdminDashboard() {
  const { assets, loans, users, recent } = await getStats();

  const statCards = [
    { label: 'Total Aset',    value: assets.total,     icon: '📦', color: 'var(--accent2)' },
    { label: 'Tersedia',      value: assets.available, icon: '✅', color: 'var(--accent)' },
    { label: 'Dipinjam',      value: assets.borrowed,  icon: '📤', color: 'var(--warn)' },
    { label: 'Dalam Perbaikan', value: assets.repair,  icon: '🔧', color: 'var(--danger)' },
    { label: 'Menunggu Persetujuan', value: loans.pending, icon: '⏳', color: 'var(--warn)' },
    { label: 'Terlambat',     value: loans.overdue,    icon: '🚨', color: 'var(--danger)' },
    { label: 'User Pending',  value: users.pending_users, icon: '👤', color: 'var(--accent2)' },
  ];

  const statusClass: Record<string, string> = {
    pending: 'badge-pending', approved: 'badge-approved', borrowed: 'badge-borrowed',
    returned: 'badge-returned', rejected: 'badge-rejected', overdue: 'badge-overdue',
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26 }}>Dashboard Admin</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Selamat datang di panel administrasi SESDIAN</p>
      </div>

      {/* Stat cards */}
      <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontFamily: 'DM Mono', fontWeight: 500, color: s.color }}>{s.value ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="fade-up fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Approve Peminjaman', href: '/admin/transactions', color: 'var(--accent)' },
          { label: 'Proses Pengembalian', href: '/admin/returns', color: 'var(--accent2)' },
          { label: 'Approve User Baru', href: '/admin/users', color: 'var(--warn)' },
          { label: 'Generate Laporan', href: '/admin/reports', color: 'var(--text2)' },
        ].map((a, i) => (
          <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', borderColor: 'transparent', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = a.color}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'transparent'}>
              <div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label} →</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="card fade-up fade-up-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15 }}>Transaksi Terbaru</h3>
          <Link href="/admin/transactions" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 12 }}>Lihat semua →</Link>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Batch Code</th><th>Peminjam</th><th>Status</th><th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r: any) => (
                <tr key={r.id}>
                  <td><span className="mono" style={{ color: 'var(--text)', fontSize: 12 }}>{r.batch_code}</span></td>
                  <td>{r.name}</td>
                  <td><span className={`badge ${statusClass[r.status] ?? ''}`}>{r.status}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}