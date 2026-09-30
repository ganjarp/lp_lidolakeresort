import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET single link
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query('SELECT * FROM links WHERE id = ?', [id]);
    const links = rows as Array<Record<string, unknown>>;

    if (links.length === 0) {
      return Response.json({ error: 'Link tidak ditemukan' }, { status: 404 });
    }

    const link = links[0];
    const [images] = await pool.query(
      'SELECT * FROM link_images WHERE link_id = ? ORDER BY sort_order ASC',
      [id]
    );
    link.images = images;

    return Response.json(link);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// PUT update link (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { title, url, description, is_active, sort_order, type } = await request.json();

    await pool.query(
      'UPDATE links SET type = ?, title = ?, url = ?, description = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [type || 'link', title, url || '', description || '', is_active ?? 1, sort_order ?? 0, id]
    );

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE link (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Images will be cascade deleted
    await pool.query('DELETE FROM links WHERE id = ?', [id]);

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
