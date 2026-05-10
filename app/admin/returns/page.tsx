'use client';
// app/admin/returns/page.tsx
import { useEffect, useState } from 'react';

export default function AdminReturnsPage() {
  const [loans, setLoans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinModal, setCheckinModal] = useState<any>(null);
  const [items, setItems]   = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/loans?status=approved,borrowed,overdue');
    setLoans(await r.json());
    setLoading(false);
  }

  async function openCheckin(loan: any) {
    const r = await fetch(`/api/admin/loans/${loan.id}`);
    const data = await r.json();
    setItems(data.items.map((i: any) => ({ ...i, condition_after: i.condition_before, notes_return: '' })));
    setCheckinModal(data);
  }

  async function submitCheckin() {
    const r = await fetch('/api/admin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loan_request_id: checkinModal.id,
        items: items.map(i => ({ loan_item_id: i.id, condition_after: i.condition_after, notes_return: i.notes_return })),
      }),
    });
    if (r.ok) { setCheckinModal(null); load(); }
    else alert('Gagal melakukan check-in');
  }

  const statusClass: Record<string, string> = { approved:'badge-approved', borrowed:'badge-borrowed', overdue:'badge-rejected' };

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Proses Pengembalian</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Check-in aset yang dikembalikan</p>

      <div className="card fade-up fade-up-2">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Batch Code</th><th>Peminjam</th><th>Tgl Kembali</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Memuat...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Tidak ada data pengembalian</td></tr>
              ) : loans.map((l: any) => (
                <tr key={l.id}>
                  <td><span className="mono" style={{ fontSize:12 }}>{l.batch_code}</span></td>
                  <td style={{ color:'var(--text)' }}>{l.borrower_name}</td>
                  <td style={{ color: l.status==='overdue'?'var(--danger)':undefined }}>
                    {l.return_due_date ? new Date(l.return_due_date).toLocaleDateString('id-ID') : '—'}
                    {l.status === 'overdue' && <span style={{ marginLeft:6, fontSize:11 }}>⚠ TERLAMBAT</span>}
                  </td>
                  <td><span className={`badge ${statusClass[l.status]??''}`}>{l.status}</span></td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => openCheckin(l)}>Check-in</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-in modal */}
      {checkinModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:580, maxHeight:'85vh', overflowY:'auto', padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Check-in: {checkinModal.batch_code}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setCheckinModal(null)}>✕</button>
            </div>

            <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>
              Peminjam: <strong style={{ color:'var(--text)' }}>{checkinModal.borrower_name}</strong>
            </p>

            {items.map((item: any, i: number) => (
              <div key={item.id} style={{ border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, marginBottom:12 }}>
                <div style={{ fontWeight:600, color:'var(--text)', marginBottom:12 }}>{item.asset_name}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label className="form-label">Kondisi Sebelum</label>
                    <div style={{ fontSize:13, color:'var(--text2)', padding:'8px 0' }}>{item.condition_before}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kondisi Setelah *</label>
                    <select className="input" value={item.condition_after} onChange={e => setItems(it => it.map((x,j) => j===i?{...x,condition_after:e.target.value}:x))}>
                      <option value="baik">Baik</option>
                      <option value="rusak_ringan">Rusak Ringan</option>
                      <option value="rusak_berat">Rusak Berat</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan Pengembalian</label>
                  <input className="input" placeholder="Opsional..." value={item.notes_return} onChange={e => setItems(it => it.map((x,j) => j===i?{...x,notes_return:e.target.value}:x))} />
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-secondary" onClick={() => setCheckinModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={submitCheckin}>✓ Konfirmasi Check-in</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}