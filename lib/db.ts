import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  // Kita sesuaikan nama variabelnya dengan yang kamu masukkan di ENV Vercel
  host:               process.env.DATABASE_HOST, 
  port:               Number(process.env.DATABASE_PORT) || 4000,
  user:               process.env.DATABASE_USER,
  password:           process.env.DATABASE_PASSWORD,
  database:           process.env.DATABASE_NAME || 'sesdian',
  ssl: {
    minVersion: 'TLSv1.2',
    // KUNCINYA DI SINI: Kita hapus fs.readFileSync
    // Vercel & TiDB Cloud sudah bisa otomatis jabat tangan tanpa file fisik .pem
    rejectUnauthorized: true,
  },
  waitForConnections:  true,
  connectionLimit:     10,
  queueLimit:          0,
  timezone:            '+07:00',
});

export const db = pool;