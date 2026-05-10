// app/user/dashboard/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import Link from 'next/link';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export default async function UserDashboard() {
  // PERBAIKAN: Tambahkan await di sini
  const cookieStore = await cookies();
  const token = cookieStore.get('sesdian_token')?.value;

  // Proteksi jika token tidak ada (agar tidak error .value)
  if (!token) return null; 

  const { payload } = await jwtVerify(token, SECRET);
  const userId = payload.sub;

  const [[stats]]: any = await db.query(`
    SELECT
      SUM(status='pending')  as pending,
      SUM(status='approved') as approved,
      SUM(status='borrowed') as borrowed,
      SUM(status='returned') as returned,
      SUM(status='overdue')  as overdue
    FROM loan_requests WHERE user_id = ?
  `, [userId]);

  const [recent]: any = await db.query(`
    SELECT id, batch_code, status, borrow_date, return_due_date, purpose
    FROM loan_requests
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 5
  `, [userId]);

  const statusClass: Record<string, string> = {
    pending:'badge-pending', approved:'badge-approved', borrowed:'badge-borrowed',
    returned:'badge-returned', rejected:'badge-rejected', overdue:'badge-overdue',
  };

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Dashboard</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Ringkasan aktivitas peminjaman Anda</p>

      <div className="fade-up fade-up-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:28 }}>
        {[
          ['Menunggu', stats.pending ?? 0, 'badge-pending'],
          ['Disetujui', stats.approved ?? 0, 'badge-approved'],
          ['Dipinjam', stats.borrowed ?? 0, 'badge-borrowed'],
          ['Dikembalikan', stats.returned ?? 0, 'badge-returned'],
          ['Terlambat', stats.overdue ?? 0, 'badge-rejected'],
        ].map(([label, val, cls]) => (
          <div key={String(label)} className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontFamily:'DM Mono', fontWeight:500, marginBottom:4 }}>{val}</div>
            <span className={`badge ${cls}`}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }} className="fade-up fade-up-3">
        <Link href="/user/peminjaman" style={{ textDecoration:'none' }}>
          <div className="card" style={{ cursor:'pointer', borderColor:'var(--accent)', textAlign:'center', padding:28 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📤</div>
            <div style={{ fontWeight:700, color:'var(--accent)', fontSize:15 }}>Buat Peminjaman</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>Single atau batch aset</div>
          </div>
        </Link>
        <Link href="/user/tracking" style={{ textDecoration:'none' }}>
          <div className="card" style={{ cursor:'pointer', textAlign:'center', padding:28 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
            <div style={{ fontWeight:700, color:'var(--text)', fontSize:15 }}>Tracking Status</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>Pantau status peminjaman</div>
          </div>
        </Link>
      </div>

      <div className="card fade-up fade-up-4">
        <h3 style={{ fontSize:15, marginBottom:16 }}>Riwayat Terbaru</h3>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Batch</th><th>Tujuan</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((r: any) => (
                <tr key={r.id}>
                  <td><span className="mono" style={{ fontSize:12 }}>{r.batch_code}</span></td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.purpose}</td>
                  <td>{new Date(r.borrow_date).toLocaleDateString('id-ID')}</td>
                  <td>{r.return_due_date ? new Date(r.return_due_date).toLocaleDateString('id-ID') : '—'}</td>
                  <td><span className={`badge ${statusClass[r.status]??''}`}>{r.status}</span></td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding:24 }}>Belum ada riwayat peminjaman</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}