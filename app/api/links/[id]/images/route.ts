import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST upload images for a link
export async function POST(
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

    // Verify link exists
    const [links] = await pool.query('SELECT id FROM links WHERE id = ?', [id]);
    if ((links as Array<Record<string, unknown>>).length === 0) {
      return Response.json({ error: 'Link tidak ditemukan' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const captions = formData.getAll('captions') as string[];

    if (files.length === 0) {
      return Response.json({ error: 'Tidak ada file yang diupload' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'links');
    await mkdir(uploadDir, { recursive: true });

    const uploadedImages: Array<{ id: number; image_url: string; caption: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);

      const imageUrl = `/uploads/links/${filename}`;
      const caption = captions[i] || '';

      // Get current max sort_order for this link
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM link_images WHERE link_id = ?',
        [id]
      );
      const nextOrder = ((maxOrder as Array<{ max_order: number }>)[0].max_order) + 1;

      const [result] = await pool.query(
        'INSERT INTO link_images (link_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)',
        [id, imageUrl, caption, nextOrder]
      );

      uploadedImages.push({
        id: (result as { insertId: number }).insertId,
        image_url: imageUrl,
        caption,
      });
    }

    return Response.json({ success: true, images: uploadedImages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET images for a link
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.query(
      'SELECT * FROM link_images WHERE link_id = ? ORDER BY sort_order ASC',
      [id]
    );

    return Response.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
