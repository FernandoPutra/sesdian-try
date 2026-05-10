// lib/db.ts
// Place: /lib/db.ts
// ------------------------------------------------------------
// mysql2 connection pool for TiDB Cloud (SSL required)
// ------------------------------------------------------------

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const pool = mysql.createPool({
  host:               process.env.TIDB_HOST,
  port:               Number(process.env.TIDB_PORT) || 4000,
  user:               process.env.TIDB_USER,
  password:           process.env.TIDB_PASSWORD,
  database:           process.env.TIDB_DATABASE_NAME || 'sesdian',
  ssl: {
    minVersion: 'TLSv1.2',
   
    // TiDB Cloud requires SSL. Download CA cert from TiDB Cloud console.
    ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'tidb-ca.pem')),
    rejectUnauthorized: true,
  },
  waitForConnections:  true,
  connectionLimit:     10,
  queueLimit:          0,
  timezone:            '+07:00',
});

export const db = pool;