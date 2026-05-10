'use client';
// app/admin/reports/page.tsx
import { useState } from 'react';

export default function AdminReportsPage() {
  const [month, setMonth]   = useState(new Date().getMonth() + 1);
  const [year, setYear]     = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState('');

  async function generate() {
    setLoading(true); setMsg('');
    const r = await fetch('/api/admin/reports', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ month, year }),
    });
    const data = await r.json();
    setLoading(false);
    if (r.ok) {
      setMsg('Laporan berhasil dibuat!');
      window.open(data.file_url, '_blank');
    } else {
      setMsg(data.error ?? 'Gagal membuat laporan');
    }
  }

  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const years  = Array.from({ length:5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Laporan PDF Bulanan</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Generate laporan inventarisasi aset bulanan</p>

      <div className="card fade-up fade-up-2" style={{ maxWidth:420 }}>
        <div className="form-group">
          <label className="form-label">Bulan</label>
          <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tahun</label>
          <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {msg && <div style={{ marginBottom:12, color: msg.includes('berhasil')?'var(--accent)':'var(--danger)', fontSize:13 }}>{msg}</div>}
        <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ width:'100%' }}>
          {loading ? '⟳ Membuat laporan...' : '📄 Generate PDF'}
        </button>
      </div>
    </div>
  );
}