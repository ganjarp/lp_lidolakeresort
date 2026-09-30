import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET profile (public)
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM profile WHERE id = 1');
    const profiles = rows as Array<Record<string, unknown>>;

    if (profiles.length === 0) {
      return Response.json({
        display_name: 'Lido Lake Resort',
        bio: 'Welcome to Lido Lake Resort',
        avatar_url: '/uploads/avatar.png',
      });
    }

    return Response.json(profiles[0]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// PUT update profile (admin only)
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { display_name, bio, avatar_url } = await request.json();

    await pool.query(
      'UPDATE profile SET display_name = ?, bio = ?, avatar_url = ? WHERE id = 1',
      [display_name, bio, avatar_url]
    );

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
