// app/admin/layout.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { db } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // PERBAIKAN DI SINI: Tambahkan await sebelum cookies()
  const cookieStore = await cookies();
  const token = cookieStore.get('sesdian_token')?.value;

  if (!token) redirect('/login');

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as any).role !== 'admin') redirect('/user/dashboard');
    userId = payload.sub as string;
  } catch { 
    redirect('/login'); 
  }

  const [rows]: any = await db.query(`SELECT name FROM users WHERE id = ? LIMIT 1`, [userId]);
  const name = rows[0]?.name ?? 'Admin';

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="admin" userName={name} />
      <main style={{
        marginLeft: 230, flex: 1, minHeight: '100vh',
        background: 'var(--bg)', padding: '28px',
      }}>
        {children}
      </main>
      <style>{`@media(max-width:768px){main{margin-left:0;padding:16px;padding-top:56px;}}`}</style>
    </div>
  );
}