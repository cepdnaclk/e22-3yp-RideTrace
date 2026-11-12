import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthenticatedRequest extends Request {
  admin?: {
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'OPERATOR' | string;
  };
}

export function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid authorization token. Please sign in to the RideTrace Admin Portal.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      email: string;
      name: string;
      role: string;
    };
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'TOKEN_EXPIRED',
      message: 'Session expired or invalid signature. Please sign in again.',
    });
  }
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'FORBIDDEN_ROLE',
      message: 'Access denied. Only the Primary Administrator (SUPER_ADMIN) can delete hardware modules.',
    });
    return;
  }
  next();
}
