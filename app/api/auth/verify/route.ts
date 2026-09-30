import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Token tidak ditemukan' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      return Response.json({ error: 'Token tidak valid' }, { status: 401 });
    }

    return Response.json({ success: true, user });
  } catch {
    return Response.json({ error: 'Token verification failed' }, { status: 401 });
  }
}
