'use client';
// app/login/page.tsx
import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get('reason');

  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(reason ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(data.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.3,
      }} />

      <div className="fade-up" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            marginBottom: '16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px' }}>SESDIAN</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Sistem Digital Inventarisasi Aset Negara</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Masuk</h2>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>Gunakan NIP & password Anda</p>

          {error && (
            <div style={{
              background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--danger)', fontSize: '13px', marginBottom: '20px',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">NIP</label>
              <input className="input" type="text" placeholder="18 digit NIP"
                value={nip} onChange={e => setNip(e.target.value)} maxLength={18} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit"
              disabled={loading} style={{ width: '100%', padding: '11px' }}>
              {loading ? <span className="spin">⟳</span> : 'Masuk'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text2)', fontSize: '13px' }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}