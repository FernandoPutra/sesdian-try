'use client';
// app/register/page.tsx
import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ nip:'', name:'', email:'', phone:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Password tidak cocok.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
  }

  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div className="card fade-up" style={{ maxWidth:400, width:'100%', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <h2 style={{ marginBottom:8 }}>Registrasi Berhasil</h2>
        <p style={{ color:'var(--text2)', marginBottom:24 }}>Akun Anda menunggu persetujuan Admin. Anda akan dihubungi melalui WhatsApp.</p>
        <Link href="/login"><button className="btn btn-primary" style={{ width:'100%' }}>Kembali ke Login</button></Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <h1 style={{ fontSize:22 }}>Daftar Akun SESDIAN</h1>
          <p style={{ color:'var(--text2)', fontSize:13 }}>Pendaftaran memerlukan persetujuan Admin</p>
        </div>
        <div className="card fade-up" style={{ padding:32 }}>
          {error && <div style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', borderRadius:'var(--radius)', padding:'10px 14px', color:'var(--danger)', fontSize:13, marginBottom:20 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">NIP (18 digit)</label>
              <input className="input" placeholder="198801012010011001" maxLength={18} pattern="\d{18}" value={form.nip} onChange={set('nip')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input className="input" placeholder="Nama sesuai SK" value={form.name} onChange={set('name')} required />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="email@instansi.go.id" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">No. WhatsApp</label>
                <input className="input" placeholder="628xxxxxxxxxx" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="input" type="password" placeholder="Min. 8 karakter" value={form.password} onChange={set('password')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Konfirmasi Password</label>
                <input className="input" type="password" placeholder="Ulangi password" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:11 }}>
              {loading ? <span className="spin">⟳</span> : 'Daftar Sekarang'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, color:'var(--text2)', fontSize:13 }}>
            Sudah punya akun? <Link href="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}