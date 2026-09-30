import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET all links (public - only active, admin - all)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    let isAdmin = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = verifyToken(token);
      if (user) isAdmin = true;
    }

    const query = isAdmin
      ? 'SELECT * FROM links ORDER BY sort_order ASC'
      : 'SELECT * FROM links WHERE is_active = 1 ORDER BY sort_order ASC';

    const [rows] = await pool.query(query);
    const links = rows as Array<Record<string, unknown>>;

    // Fetch images for each link
    for (const link of links) {
      const [images] = await pool.query(
        'SELECT * FROM link_images WHERE link_id = ? ORDER BY sort_order ASC',
        [link.id]
      );
      link.images = images;
    }

    return Response.json(links);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST create new link (admin only)
export async function POST(request: Request) {
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

    const { title, url, description, is_active, sort_order, type } = await request.json();

    if (!title) {
      return Response.json({ error: 'Title diperlukan' }, { status: 400 });
    }

    if (type !== 'gallery' && !url) {
      return Response.json({ error: 'URL diperlukan untuk link' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO links (type, title, url, description, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [type || 'link', title, url || '', description || '', is_active ?? 1, sort_order ?? 0]
    );

    const insertResult = result as { insertId: number };

    return Response.json({ success: true, id: insertResult.insertId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
