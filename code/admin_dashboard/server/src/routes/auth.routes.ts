import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ENV, getConnectionSummary } from '../config/env';
import { requireAdminAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { DbService } from '../services/db.service';

const router = Router();

// Hash configured admin and operator passwords at startup using 12 rounds of bcrypt
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ENV.ADMIN_PASSWORD, 12);
const OPERATOR_PASSWORD_HASH = bcrypt.hashSync(ENV.OPERATOR_PASSWORD, 12);

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password is required'),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message || 'Invalid credentials format',
    });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  let matchedUser: { email: string; name: string; role: 'SUPER_ADMIN' | 'OPERATOR' } | null = null;

  if (normalizedEmail === ENV.ADMIN_EMAIL.toLowerCase().trim()) {
    const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (ok) {
      matchedUser = {
        email: ENV.ADMIN_EMAIL,
        name: ENV.ADMIN_NAME,
        role: 'SUPER_ADMIN',
      };
    }
  } else if (normalizedEmail === ENV.OPERATOR_EMAIL.toLowerCase().trim()) {
    const ok = await bcrypt.compare(password, OPERATOR_PASSWORD_HASH);
    if (ok) {
      matchedUser = {
        email: ENV.OPERATOR_EMAIL,
        name: ENV.OPERATOR_NAME,
        role: 'OPERATOR',
      };
    }
  }

  if (!matchedUser) {
    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid administrator email or password.',
    });
    return;
  }

  const token = jwt.sign(matchedUser, ENV.JWT_SECRET, { expiresIn: '8h' });

  DbService.appendAuditLog({
    actor: matchedUser.email,
    action: 'ADMIN_LOGIN',
    targetSerial: 'SYSTEM',
    details: `${matchedUser.role === 'SUPER_ADMIN' ? 'Primary Administrator' : 'Provisioning Operator'} signed in to the portal.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    token,
    admin: matchedUser,
    securityStatus: getConnectionSummary(),
  });
});

router.get('/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({
    admin: req.admin,
    securityStatus: getConnectionSummary(),
  });
});

export default router;
