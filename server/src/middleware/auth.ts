import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface JwtPayload {
  userId: number;
}

/** 必须认证 — 未登录返回 401 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '请先登录' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
}

/** 可选认证 — 未登录时 userId 为 undefined */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = payload.userId;
    } catch { /* token invalid, continue without auth */ }
  }
  next();
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
