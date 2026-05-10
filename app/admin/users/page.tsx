'use client';
// app/admin/users/page.tsx
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'pending'|'all'>('pending');
  const [search, setSearch]   = useState('');

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const q = tab === 'pending' ? '?status=pending' : '';
    const r = await fetch(`/api/admin/users${q}`);
    const data = await r.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  async function approveUser(id: number) {
    await fetch('/api/admin/approve-user', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id:id, action:'approve' }) });
    load();
  }
  async function suspendUser(id: number) {
    await fetch('/api/admin/approve-user', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id:id, action:'suspend' }) });
    load();
  }

  const f = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.nip.includes(search));

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Manajemen Pengguna</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Persetujuan & kelola akun pengguna</p>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {(['pending','all'] as const).map(t => (
          <button key={t} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} onClick={() => setTab(t)}>
            {t==='pending'?'Menunggu Persetujuan':'Semua Pengguna'}
          </button>
        ))}
      </div>

      <div className="card fade-up fade-up-2">
        <div style={{ marginBottom:14 }}>
          <input className="input" placeholder="Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:300 }} />
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>NIP</th><th>Nama</th><th>Email</th><th>Telepon</th><th>Status</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Memuat...</td></tr>
              ) : f.map((u: any) => (
                <tr key={u.id}>
                  <td><span className="mono" style={{ fontSize:12 }}>{u.nip}</span></td>
                  <td style={{ color:'var(--text)', fontWeight:500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone ?? '—'}</td>
                  <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td>
                    {u.status === 'pending'   && <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)} style={{ marginRight:6 }}>✓ Setujui</button>}
                    {u.status === 'active'    && <button className="btn btn-danger btn-sm"  onClick={() => suspendUser(u.id)}>Tangguhkan</button>}
                    {u.status === 'suspended' && <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)}>Aktifkan</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}