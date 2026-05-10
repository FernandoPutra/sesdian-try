'use client';
// app/user/peminjaman/page.tsx
import { useEffect, useState } from 'react';

interface SelectedAsset { id: number; name: string; asset_code: string; quantity: number; }

export default function UserPeminjamanPage() {
  const [assets, setAssets]     = useState<any[]>([]);
  const [rooms, setRooms]       = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [search, setSearch]     = useState('');
  const [cart, setCart]         = useState<SelectedAsset[]>([]);
  const [form, setForm]         = useState({ purpose:'', borrow_date:'', return_due_date:'' });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<string|null>(null);
  const [error, setError]       = useState('');

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { if (selectedRoom) loadAssets(); }, [selectedRoom]);

  async function loadRooms() {
    const r = await fetch('/api/user/rooms');
    setRooms(await r.json());
  }
  async function loadAssets() {
    const r = await fetch(`/api/user/assets?room_id=${selectedRoom}`);
    setAssets(await r.json());
  }

  function addToCart(a: any) {
    if (cart.find(c => c.id === a.id)) return;
    setCart(c => [...c, { id: a.id, name: a.name, asset_code: a.asset_code, quantity: 1 }]);
  }
  function removeFromCart(id: number) { setCart(c => c.filter(x => x.id !== id)); }

  const hasFixed = assets.filter(a => cart.find(c => c.id === a.id)).some((a: any) => !a.is_consumable);

  async function submit() {
    if (!cart.length)        { setError('Pilih minimal 1 aset'); return; }
    if (!form.purpose)       { setError('Isi tujuan peminjaman'); return; }
    if (!form.borrow_date)   { setError('Isi tanggal pinjam'); return; }
    if (hasFixed && !form.return_due_date) { setError('Tanggal kembali wajib untuk aset tetap'); return; }

    setLoading(true); setError('');
    const r = await fetch('/api/user/peminjaman', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        items: cart.map(c => ({ asset_id: c.id, quantity: c.quantity })),
        purpose: form.purpose,
        borrow_date: form.borrow_date,
        return_due_date: form.return_due_date || null,
      }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error); return; }
    setSuccess(data.batch_code);
    setCart([]); setForm({ purpose:'', borrow_date:'', return_due_date:'' });
  }

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.asset_code.toLowerCase().includes(search.toLowerCase())
  );

  if (success) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="card fade-up" style={{ maxWidth:400, width:'100%', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <h2 style={{ marginBottom:8 }}>Permintaan Dikirim</h2>
        <p style={{ color:'var(--text2)', marginBottom:8 }}>Batch code:</p>
        <p className="mono" style={{ fontSize:18, color:'var(--accent)', marginBottom:20 }}>{success}</p>
        <p style={{ color:'var(--text2)', fontSize:13, marginBottom:24 }}>Menunggu persetujuan Admin. Notifikasi akan dikirim via WhatsApp.</p>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setSuccess(null)}>Pinjam Lagi</button>
          <a href="/user/tracking" style={{ flex:1, textDecoration:'none' }}><button className="btn btn-primary" style={{ width:'100%' }}>Tracking</button></a>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Buat Peminjaman</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Pilih aset yang ingin dipinjam</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
        {/* Left: asset picker */}
        <div>
          <div className="card fade-up fade-up-2" style={{ marginBottom:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="form-label">Filter Ruangan</label>
                <select className="input" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                  <option value="">-- Semua Ruangan --</option>
                  {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Cari Aset</label>
                <input className="input" placeholder="Nama atau kode aset..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {filtered.filter(a => a.status === 'available').map((a: any, i: number) => {
              const inCart = cart.find(c => c.id === a.id);
              return (
                <div key={a.id} className={`card fade-up fade-up-${Math.min(i+1,5)}`} style={{ cursor:'pointer', border: inCart?'1px solid var(--accent)':undefined }}
                  onClick={() => addToCart(a)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <span className={`badge ${a.is_consumable?'badge-pending':'badge-active'}`}>{a.is_consumable?'Konsumabel':'Tetap'}</span>
                    {inCart && <span style={{ color:'var(--accent)', fontSize:18 }}>✓</span>}
                  </div>
                  <div style={{ fontWeight:600, color:'var(--text)', fontSize:13, marginBottom:4 }}>{a.name}</div>
                  <div className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{a.asset_code}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:6 }}>📍 {a.room_name ?? '—'}</div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--text3)', padding:40 }}>
                Tidak ada aset tersedia
              </div>
            )}
          </div>
        </div>

        {/* Right: cart + form */}
        <div>
          <div className="card fade-up fade-up-2" style={{ position:'sticky', top:20 }}>
            <h3 style={{ fontSize:14, marginBottom:14 }}>🛒 Daftar Pinjam ({cart.length})</h3>

            {cart.length === 0 ? (
              <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Klik aset untuk menambahkan</div>
            ) : (
              <div style={{ marginBottom:16 }}>
                {cart.map(c => (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>{c.name}</div>
                      <div className="mono" style={{ fontSize:10, color:'var(--text3)' }}>{c.asset_code}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min={1} max={99} value={c.quantity}
                        onChange={e => setCart(cart => cart.map(x => x.id===c.id?{...x,quantity:Number(e.target.value)}:x))}
                        style={{ width:44, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', textAlign:'center', padding:'3px 6px', fontSize:12 }} />
                      <button style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:14 }} onClick={() => removeFromCart(c.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tujuan Peminjaman *</label>
              <textarea className="input" rows={3} placeholder="Jelaskan tujuan peminjaman..." value={form.purpose} onChange={e => setForm(f => ({...f,purpose:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Pinjam *</label>
              <input className="input" type="date" value={form.borrow_date} onChange={e => setForm(f => ({...f,borrow_date:e.target.value}))} />
            </div>
            {(hasFixed || cart.length > 0) && (
              <div className="form-group">
                <label className="form-label">Tanggal Kembali {hasFixed ? '*' : '(Opsional)'}</label>
                <input className="input" type="date" value={form.return_due_date} onChange={e => setForm(f => ({...f,return_due_date:e.target.value}))} />
              </div>
            )}

            {error && <div className="form-error" style={{ marginBottom:10 }}>{error}</div>}

            <button className="btn btn-primary" onClick={submit} disabled={loading || cart.length === 0} style={{ width:'100%' }}>
              {loading ? '⟳ Mengirim...' : '📤 Kirim Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}