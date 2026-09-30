import mysql from 'mysql2/promise';

/**
 * Database connection module.
 * 
 * Supports two providers via DB_PROVIDER env var:
 * - 'mysql' (default): Local MySQL/Laragon via mysql2
 * - 'supabase': Supabase PostgreSQL (requires @supabase/supabase-js)
 * 
 * For Laragon/MySQL:
 *   DB_HOST=localhost
 *   DB_USER=root
 *   DB_PASSWORD=
 *   DB_NAME=lido_lake_resort
 *   DB_PORT=3306
 * 
 * For Supabase (future):
 *   DB_PROVIDER=supabase
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_ANON_KEY=your-anon-key
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 */

const DB_PROVIDER = process.env.DB_PROVIDER || 'mysql';

// ── MySQL Pool (Laragon) ──────────────────────────────────────
let pool: mysql.Pool;

if (DB_PROVIDER === 'mysql') {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lido_lake_resort',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

// ── Supabase Client (for future migration) ────────────────────
// Uncomment and install @supabase/supabase-js when ready to use:
//
// import { createClient } from '@supabase/supabase-js';
//
// const supabase = DB_PROVIDER === 'supabase'
//   ? createClient(
//       process.env.SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!
//     )
//   : null;
//
// export { supabase };

export default pool!;
