import { supabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE an image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
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

    const { imageId } = await params;

    // Get image to delete file
    const { data: images, error: getError } = await supabase
      .from('link_images')
      .select('*')
      .eq('id', imageId);

    if (getError) throw getError;

    if (images && images.length > 0) {
      // Try to delete the physical file
      try {
        const filepath = path.join(process.cwd(), 'public', images[0].image_url);
        await unlink(filepath);
      } catch {
        // File might not exist, continue
      }

      const { error: delError } = await supabase
        .from('link_images')
        .delete()
        .eq('id', imageId);
      
      if (delError) throw delError;
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
