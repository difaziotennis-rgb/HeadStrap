import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "clover-dev-jwt-secret";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "clover-admin-key";

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * JWT auth for user routes.
 * Expects header: Authorization: Bearer <token>
 */
export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid Authorization header. Use: Bearer <token>" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

/**
 * API key auth for admin routes.
 * Expects header: X-API-Key: <key>
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (!key || key !== ADMIN_API_KEY) {
    return res.status(403).json({ success: false, error: "Invalid or missing X-API-Key header" });
  }
  next();
}

/** Sign a JWT for a user */
export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}
