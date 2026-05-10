'use client';
// app/admin/rooms/page.tsx
import { useEffect, useState } from 'react';

export default function AdminRoomsPage() {
  const [rooms, setRooms]     = useState<any[]>([]);
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code:'', name:'', floor:'', building:'', pic_user_id:'' });

  useEffect(() => { load(); loadUsers(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/rooms');
    setRooms(await r.json());
    setLoading(false);
  }
  async function loadUsers() {
    const r = await fetch('/api/admin/users?status=active&role=user');
    const data = await r.json();
    setUsers(data.users ?? []);
  }

  function openAdd() { setEditing(null); setForm({ code:'', name:'', floor:'', building:'', pic_user_id:'' }); setShowModal(true); }
  function openEdit(r: any) { setEditing(r); setForm({ code:r.code, name:r.name, floor:r.floor??'', building:r.building??'', pic_user_id:r.pic_user_id??'' }); setShowModal(true); }

  async function handleSave() {
    const url = editing ? `/api/admin/rooms/${editing.id}` : '/api/admin/rooms';
    const method = editing ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (r.ok) { setShowModal(false); load(); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus ruangan ini?')) return;
    await fetch(`/api/admin/rooms/${id}`, { method:'DELETE' });
    load();
  }

  function copyQrUrl(token: string) {
    const url = `${window.location.origin}/public/ruangan/${token}`;
    navigator.clipboard.writeText(url);
    alert('URL disalin: ' + url);
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24 }} className="fade-up">Manajemen Ruangan</h1>
          <p style={{ color:'var(--text2)', fontSize:13 }} className="fade-up fade-up-1">Data Master Ruangan & PIC</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Ruangan</button>
      </div>

      <div className="card fade-up fade-up-2">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Kode</th><th>Nama Ruangan</th><th>Lantai</th><th>Gedung</th><th>PIC</th><th>QR URL</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>Memuat...</td></tr>
              ) : rooms.map((r: any) => (
                <tr key={r.id}>
                  <td><span className="mono" style={{ fontSize:12, color:'var(--text)' }}>{r.code}</span></td>
                  <td style={{ color:'var(--text)', fontWeight:500 }}>{r.name}</td>
                  <td>{r.floor ?? '-'}</td>
                  <td>{r.building ?? '-'}</td>
                  <td>{r.pic_name ?? '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyQrUrl(r.qr_token)}>📋 Copy URL</button>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)} style={{ marginRight:6 }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:440, padding:28 }}>
            <h3 style={{ marginBottom:20 }}>{editing ? 'Edit Ruangan' : 'Tambah Ruangan'}</h3>
            {[['code','Kode Ruangan'],['name','Nama Ruangan'],['floor','Lantai'],['building','Gedung']].map(([k,l]) => (
              <div key={k} className="form-group">
                <label className="form-label">{l}</label>
                <input className="input" value={(form as any)[k]} onChange={e => setForm((f:any) => ({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">PIC (Person in Charge)</label>
              <select className="input" value={form.pic_user_id} onChange={e => setForm(f => ({...f,pic_user_id:e.target.value}))}>
                <option value="">-- Pilih PIC --</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.nip}</option>)}
              </select>
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