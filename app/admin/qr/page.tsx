'use client';
// app/admin/qr/page.tsx
// Generate & display QR code for each room (uses qrcode.react)
import { useEffect, useState, useRef } from 'react';

export default function AdminQRPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/rooms').then(r => r.json()).then(setRooms);
  }, []);

  function getUrl(token: string) {
    return typeof window !== 'undefined' ? `${window.location.origin}/public/ruangan/${token}` : '';
  }

  function printQr() { window.print(); }

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize: 24, marginBottom: 4 }}>QR Code Ruangan</h1>
      <p className="fade-up fade-up-1" style={{ color: 'var(--text2)', marginBottom: 24 }}>Scan QR untuk melihat aset di ruangan</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        {rooms.map((r: any, i: number) => (
          <div key={r.id} className={`card fade-up fade-up-${Math.min(i+1,5)}`}
            style={{ cursor: 'pointer', textAlign: 'center', border: selected?.id === r.id ? '1px solid var(--accent)' : undefined }}
            onClick={() => setSelected(r)}>
            {/* Simple QR placeholder using CSS grid pattern */}
            <div style={{
              width: 120, height: 120, margin: '0 auto 12px',
              background: '#fff', borderRadius: 8, padding: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=104x104&data=${encodeURIComponent(getUrl(r.qr_token))}`}
                alt={`QR ${r.name}`}
                style={{ width: 104, height: 104 }}
              />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>{r.code}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(getUrl(r.qr_token)); alert('URL disalin!'); }}>
                Copy URL
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getUrl(r.qr_token))}`}
                download={`QR-${r.code}.png`}
                onClick={e => e.stopPropagation()}
              >
                <button className="btn btn-primary btn-sm">Unduh</button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}