import { supabase } from '@/lib/db';
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

    let query = supabase.from('links').select('*, images:link_images(*)').order('sort_order', { ascending: true });

    if (!isAdmin) {
      query = query.eq('is_active', 1);
    }

    const { data: links, error } = await query;

    if (error) throw error;

    // ensure images array exists and is ordered
    const processedLinks = links?.map((link) => {
      // sort images by sort_order
      if (link.images && Array.isArray(link.images)) {
        link.images.sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order || 0) - (b.sort_order || 0));
      } else {
        link.images = [];
      }
      return link;
    }) || [];

    return Response.json(processedLinks);
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

    const { data, error } = await supabase
      .from('links')
      .insert([
        {
          type: type || 'link',
          title,
          url: url || '',
          description: description || '',
          is_active: is_active ?? 1,
          sort_order: sort_order ?? 0
        }
      ])
      .select('id')
      .single();

    if (error) throw error;

    return Response.json({ success: true, id: data.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
