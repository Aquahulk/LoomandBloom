import bcrypt from 'bcryptjs';

export function hashPassword(plain: string, cost = 12): string {
  return bcrypt.hashSync(plain, cost);
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    return bcrypt.compareSync(plain, stored || '');
  } catch {
    return false;
  }
}