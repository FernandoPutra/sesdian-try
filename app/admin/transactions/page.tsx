'use client';
// app/admin/transactions/page.tsx
import { useEffect, useState } from 'react';

export default function AdminTransactionsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [tab, setTab] = useState<'pending'|'all'>('pending');

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const q = tab === 'pending' ? '?status=pending' : '';
    const r = await fetch(`/api/admin/loans${q}`);
    setLoans(await r.json());
    setLoading(false);
  }

  async function loadDetail(id: number) {
    const r = await fetch(`/api/admin/loans/${id}`);
    setDetail(await r.json());
  }

  async function approve(id: number) {
    await fetch(`/api/admin/approve-loan`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ loan_request_id: id, action: 'approve' }) });
    load(); setDetail(null);
  }

  async function reject(id: number) {
    if (!rejectReason.trim()) { alert('Isi alasan penolakan'); return; }
    await fetch(`/api/admin/approve-loan`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ loan_request_id: id, action: 'reject', reason: rejectReason }) });
    setRejectReason(''); load(); setDetail(null);
  }

  const statusClass: Record<string, string> = {
    pending:'badge-pending', approved:'badge-approved', borrowed:'badge-borrowed',
    returned:'badge-returned', rejected:'badge-rejected', overdue:'badge-overdue',
  };

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Persetujuan Peminjaman</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Kelola permintaan peminjaman aset</p>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {(['pending','all'] as const).map(t => (
          <button key={t} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'pending' ? 'Menunggu Persetujuan' : 'Semua Transaksi'}
          </button>
        ))}
      </div>

      <div className="card fade-up fade-up-2">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Batch Code</th><th>Peminjam</th><th>Tujuan</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Memuat...</td></tr>
              ) : loans.map((l: any) => (
                <tr key={l.id}>
                  <td><span className="mono" style={{ fontSize:12 }}>{l.batch_code}</span></td>
                  <td style={{ color:'var(--text)' }}>{l.borrower_name}</td>
                  <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.purpose}</td>
                  <td>{new Date(l.borrow_date).toLocaleDateString('id-ID')}</td>
                  <td>{l.return_due_date ? new Date(l.return_due_date).toLocaleDateString('id-ID') : '—'}</td>
                  <td><span className={`badge ${statusClass[l.status]??''}`}>{l.status}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => loadDetail(l.id)}>Detail</button>
                    {l.status === 'pending' && <>
                      <button className="btn btn-primary btn-sm" style={{ margin:'0 4px' }} onClick={() => approve(l.id)}>✓ Setujui</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setDetail(l); setRejectReason(''); }}>✗ Tolak</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Detail Peminjaman</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[['Batch Code',detail.batch_code],['Peminjam',detail.borrower_name],['NIP',detail.borrower_nip],['Telepon',detail.borrower_phone],['Tujuan',detail.purpose],['Status',detail.status]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:13, color:'var(--text)' }}>{v ?? '—'}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Item Dipinjam</div>
              {detail.items?.map((item: any, i: number) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, color:'var(--text)' }}>{item.asset_name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{item.asset_code}</div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>x{item.quantity}</div>
                </div>
              ))}
            </div>

            {detail.status === 'pending' && (
              <>
                <div className="form-group">
                  <label className="form-label">Alasan Penolakan (jika ditolak)</label>
                  <textarea className="input" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Isi alasan penolakan..." />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => approve(detail.id)}>✓ Setujui</button>
                  <button className="btn btn-danger" style={{ flex:1 }} onClick={() => reject(detail.id)}>✗ Tolak</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}