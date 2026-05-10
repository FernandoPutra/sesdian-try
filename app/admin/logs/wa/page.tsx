// app/admin/logs/wa/page.tsx
import { db } from '@/lib/db';

export default async function WALogsPage() {
  const [logs]: any = await db.query(`
    SELECT nl.*, u.name as recipient_name, lr.batch_code
    FROM notification_logs nl
    LEFT JOIN users u ON u.id = nl.recipient_user_id
    LEFT JOIN loan_requests lr ON lr.id = nl.loan_request_id
    ORDER BY nl.created_at DESC
    LIMIT 200
  `);

  const statusColor: Record<string, string> = {
    sent:'badge-approved', delivered:'badge-active',
    failed:'badge-rejected', pending:'badge-pending',
  };
  const templateLabel: Record<string, string> = {
    approval:'Persetujuan', h1_reminder:'H-1 Reminder',
    overdue:'Terlambat', rejection:'Penolakan', checkin_confirm:'Konfirmasi Kembali',
  };

  return (
    <div>
      <h1 className="fade-up" style={{ fontSize:24, marginBottom:4 }}>Log WhatsApp</h1>
      <p className="fade-up fade-up-1" style={{ color:'var(--text2)', marginBottom:24 }}>Monitor status notifikasi WhatsApp</p>

      <div className="card fade-up fade-up-2">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Waktu</th><th>Penerima</th><th>No. HP</th><th>Batch</th><th>Tipe</th><th>Status</th><th>WA ID</th></tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace:'nowrap' }}>{new Date(l.created_at).toLocaleString('id-ID')}</td>
                  <td>{l.recipient_name ?? '—'}</td>
                  <td><span className="mono" style={{ fontSize:11 }}>{l.recipient_phone}</span></td>
                  <td><span className="mono" style={{ fontSize:11 }}>{l.batch_code ?? '—'}</span></td>
                  <td>{templateLabel[l.template_type] ?? l.template_type}</td>
                  <td><span className={`badge ${statusColor[l.status]??''}`}>{l.status}</span></td>
                  <td><span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{l.wa_message_id ?? '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}