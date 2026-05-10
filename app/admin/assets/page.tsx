'use client';
// app/admin/assets/page.tsx
import { useEffect, useState } from 'react';

const CONDITION_LABEL: Record<string, string> = { baik:'Baik', rusak_ringan:'Rusak Ringan', rusak_berat:'Rusak Berat' };
const STATUS_LABEL: Record<string, string>    = { available:'Tersedia', borrowed:'Dipinjam', under_repair:'Perbaikan', disposed:'Dihapus' };

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [rooms, setRooms]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({
    asset_code:'', name:'', category:'', brand:'', model:'', serial_number:'',
    room_id:'', is_consumable:0, condition:'baik', status:'available',
    purchase_date:'', purchase_price:'', notes:'',
  });

  useEffect(() => { loadAssets(); loadRooms(); }, []);

  async function loadAssets() {
    setLoading(true);
    const r = await fetch('/api/admin/assets');
    setAssets(await r.json());
    setLoading(false);
  }
  async function loadRooms() {
    const r = await fetch('/api/admin/rooms');
    setRooms(await r.json());
  }

  function openAdd() { setEditing(null); setForm({ asset_code:'', name:'', category:'', brand:'', model:'', serial_number:'', room_id:'', is_consumable:0, condition:'baik', status:'available', purchase_date:'', purchase_price:'', notes:'' }); setShowModal(true); }
  function openEdit(a: any) { setEditing(a); setForm({ ...a, room_id: a.room_id ?? '', purchase_price: a.purchase_price ?? '', notes: a.notes ?? '' }); setShowModal(true); }

  async function handleSave() {
    const url = editing ? `/api/admin/assets/${editing.id}` : '/api/admin/assets';
    const method = editing ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (r.ok) { setShowModal(false); loadAssets(); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus aset ini?')) return;
    await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' });
    loadAssets();
  }

  const f = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.asset_code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24 }} className="fade-up">Manajemen Aset</h1>
          <p style={{ color:'var(--text2)', fontSize:13 }} className="fade-up fade-up-1">Data Master Aset Negara</p>
        </div>
        <button className="btn btn-primary fade-up fade-up-1" onClick={openAdd}>+ Tambah Aset</button>
      </div>

      <div className="card fade-up fade-up-2">
        <div style={{ marginBottom:16 }}>
          <input className="input" placeholder="Cari nama atau kode aset..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:320 }} />
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Kode</th><th>Nama Aset</th><th>Ruangan</th><th>Kondisi</th><th>Status</th><th>Tipe</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Memuat...</td></tr>
              ) : f.map((a: any) => (
                <tr key={a.id}>
                  <td><span className="mono" style={{ fontSize:12, color:'var(--text)' }}>{a.asset_code}</span></td>
                  <td style={{ color:'var(--text)', fontWeight:500 }}>{a.name}</td>
                  <td>{a.room_name ?? '-'}</td>
                  <td><span className={`badge ${a.condition==='baik'?'badge-approved':a.condition==='rusak_ringan'?'badge-pending':'badge-rejected'}`}>{CONDITION_LABEL[a.condition]}</span></td>
                  <td><span className={`badge ${a.status==='available'?'badge-approved':a.status==='borrowed'?'badge-borrowed':a.status==='under_repair'?'badge-repair':'badge-suspended'}`}>{STATUS_LABEL[a.status]}</span></td>
                  <td><span className={`badge ${a.is_consumable?'badge-pending':'badge-active'}`}>{a.is_consumable?'Konsumabel':'Tetap'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)} style={{ marginRight:6 }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:28 }}>
            <h3 style={{ marginBottom:20 }}>{editing ? 'Edit Aset' : 'Tambah Aset'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['asset_code','Kode Aset'],['name','Nama Aset'],['category','Kategori'],['brand','Merek'],['model','Model'],['serial_number','Serial Number']].map(([k,l]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="input" value={form[k]} onChange={e => setForm((f: any) => ({...f,[k]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Ruangan</label>
                <select className="input" value={form.room_id} onChange={e => setForm((f: any) => ({...f,room_id:e.target.value}))}>
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Kondisi</label>
                <select className="input" value={form.condition} onChange={e => setForm((f: any) => ({...f,condition:e.target.value}))}>
                  <option value="baik">Baik</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm((f: any) => ({...f,status:e.target.value}))}>
                  <option value="available">Tersedia</option>
                  <option value="under_repair">Perbaikan</option>
                  <option value="disposed">Dihapus</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="input" value={form.is_consumable} onChange={e => setForm((f: any) => ({...f,is_consumable:Number(e.target.value)}))}>
                  <option value={0}>Aset Tetap (Wajib Kembali)</option>
                  <option value={1}>Konsumabel (Tidak Kembali)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tgl Pembelian</label>
                <input className="input" type="date" value={form.purchase_date} onChange={e => setForm((f: any) => ({...f,purchase_date:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Harga (Rp)</label>
                <input className="input" type="number" value={form.purchase_price} onChange={e => setForm((f: any) => ({...f,purchase_price:e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="input" rows={3} value={form.notes} onChange={e => setForm((f: any) => ({...f,notes:e.target.value}))} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}