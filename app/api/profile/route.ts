import { supabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET profile (public)
export async function GET() {
  try {
    const { data: profiles, error } = await supabase
      .from('profile')
      .select('*')
      .eq('id', 1);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return Response.json({
        display_name: 'Lido Lake Resort',
        bio: 'Lido Lake Resort by MNC Hotel',
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

    const { error } = await supabase
      .from('profile')
      .update({ display_name, bio, avatar_url })
      .eq('id', 1);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
