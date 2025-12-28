import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

