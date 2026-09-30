import { supabase } from '@/lib/db';
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
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single();

    if (linkError || !link) {
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

    // Get current max sort_order
    const { data: currentImages } = await supabase
      .from('link_images')
      .select('sort_order')
      .eq('link_id', id)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    let nextOrder = currentImages && currentImages.length > 0 ? (currentImages[0].sort_order || 0) + 1 : 1;

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

      const { data: inserted, error: insertError } = await supabase
        .from('link_images')
        .insert([{
          link_id: id,
          image_url: imageUrl,
          caption,
          sort_order: nextOrder
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      uploadedImages.push({
        id: inserted.id,
        image_url: imageUrl,
        caption,
      });

      nextOrder++;
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
    const { data: images, error } = await supabase
      .from('link_images')
      .select('*')
      .eq('link_id', id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return Response.json(images || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
