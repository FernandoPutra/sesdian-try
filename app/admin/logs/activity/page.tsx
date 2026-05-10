// app/admin/logs/activity/page.tsx
import { db } from '@/lib/db';

export default async function ActivityLogsPage() {
  const [logs]: any = await db.query(`
    SELECT al.*, u.name as actor_name
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.actor_id
    ORDER BY al.created_at DESC
    LIMIT 200
  `);

  const actionColor: Record<string, string> = {
    LOAN_REQUESTED:'badge-pending', LOAN_APPROVED:'badge-approved',
    LOAN_REJECTED:'badge-rejected', LOAN_CHECKIN:'badge-returned',
    ASSET_UPDATED:'badge-borrowed', USER_APPROVED:'badge-active',
    USER_SUSPENDED:'badge-suspended',
  };

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Log Aktivitas</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Audit trail semua perubahan sistem</p>

      <div className="card fade-up fade-up-2">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Entitas</th><th>ID</th><th>IP</th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace:'nowrap', fontSize:12 }}>{new Date(l.created_at).toLocaleString('id-ID')}</td>
                  <td>{l.actor_name ?? <span style={{ color:'var(--text3)' }}>SYSTEM</span>}</td>
                  <td><span className={`badge ${actionColor[l.action]??'badge-pending'}`}>{l.action}</span></td>
                  <td style={{ color:'var(--text2)' }}>{l.entity_type}</td>
                  <td><span className="mono" style={{ fontSize:11 }}>#{l.entity_id}</span></td>
                  <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{l.ip_address ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}