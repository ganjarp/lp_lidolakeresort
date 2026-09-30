import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lido-lake-resort-secret-key-2024';

export function signToken(payload: { id: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { id: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
}
