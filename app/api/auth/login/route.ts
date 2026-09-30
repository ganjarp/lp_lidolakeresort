import pool from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Username dan password diperlukan' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    const admins = rows as Array<{ id: number; username: string; password: string }>;

    if (admins.length === 0) {
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const admin = admins[0];
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return Response.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const token = signToken({ id: admin.id, username: admin.username });

    return Response.json({ success: true, token, user: { id: admin.id, username: admin.username } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
