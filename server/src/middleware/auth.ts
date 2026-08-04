import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken, AuthTokenPayload } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = verifyAuthToken(token);
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!authReq.user.isAdmin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
}
