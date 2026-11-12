import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import {
  requireAdminAuth,
  requireSuperAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.middleware';
import { DbService, HardwareModule } from '../services/db.service';
import {
  dispatchVerificationEmail,
  buildVerificationEmailHtml,
  buildVerificationUrl,
} from '../services/email.service';
import { getConnectionSummary } from '../config/env';

const router = Router();

function getBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

function renderVerificationHtmlPage(title: string, message: string, success: boolean): string {
  const accent = success ? '#059669' : '#DC2626';
  const badge = success ? 'VERIFIED &amp; ACTIVE' : 'VERIFICATION ERROR';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - RideTrace</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8FAFC; margin: 0; padding: 32px 16px; color: #0F172A; }
    .card { max-width: 460px; margin: 48px auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06); }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: ${accent}; background: ${success ? '#ECFDF5' : '#FEF2F2'}; border: 1px solid ${success ? '#A7F3D0' : '#FECACA'}; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 10px; color: #0F172A; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${badge}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">© 2026 RideTrace Systems</div>
  </div>
</body>
</html>`;
}

// Public Route: GET /api/modules/verify?token=... — Customer clicks email verification link
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    res
      .status(400)
      .send(renderVerificationHtmlPage('Invalid Verification Link', 'No verification token was provided.', false));
    return;
  }

  const modules = DbService.getAllModules();
  const mod = modules.find((m) => m.activationToken === token);
  if (!mod || !mod.ownerEmail) {
    res
      .status(404)
      .send(
        renderVerificationHtmlPage(
          'Link Expired or Invalid',
          'This verification link is invalid or has already been replaced. Please contact RideTrace support to request a new link.',
          false
        )
      );
    return;
  }

  if (mod.tokenExpiresAt && new Date(mod.tokenExpiresAt).getTime() < Date.now()) {
    res
      .status(410)
      .send(
        renderVerificationHtmlPage(
          'Verification Link Expired',
          'This verification link has expired. Please request a new verification email from RideTrace.',
          false
        )
      );
    return;
  }

  if (mod.status !== 'ACTIVE') {
    const now = new Date().toISOString();
    const updated: HardwareModule = {
      ...mod,
      status: 'ACTIVE',
      updatedAt: now,
      verifiedAt: now,
    };
    await DbService.saveModule(updated);

    DbService.appendAuditLog({
      actor: mod.ownerEmail,
      action: 'OWNERSHIP_VERIFIED',
      targetSerial: mod.serial,
      details: `Email verified by customer (${mod.ownerEmail}). Device ${mod.serial} is now Active.`,
      ipAddress: req.ip || '127.0.0.1',
    });
  }

  res
    .status(200)
    .send(
      renderVerificationHtmlPage(
        `Device ${mod.serial} Activated`,
        `Your email <strong>${mod.ownerEmail}</strong> has been verified. Open the <strong>RideTrace Mobile App</strong> and sign in with this account—your module is ready to use.`,
        true
      )
    );
});

// Protect all admin routes below with Admin JWT verification
router.use(requireAdminAuth);

const RegisterModuleSchema = z.object({
  serial: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^RT-\d{3,5}$/, 'Serial must follow format RT-001 (e.g. RT-005)'),
  bikeMake: z.string().trim().optional().nullable(),
  bikeModel: z.string().trim().optional().nullable(),
  engineCc: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(50).max(2000).nullable().optional()
  ),
  firmwareVersion: z.string().trim().default('v1.2.5-ESP32'),
  hardwarePin: z
    .union([
      z.string().trim().regex(/^\d{4}$/, 'Hardware PIN must be a 4-digit number'),
      z.literal(''),
    ])
    .optional(),
});

const AssignCustomerSchema = z.object({
  ownerName: z.string().trim().optional().default('RideTrace Customer'),
  ownerEmail: z.string().trim().email('Valid customer email is required'),
  emergencyPhone: z.string().trim().optional().default(''),
  bikeMake: z.string().trim().optional().nullable(),
  bikeModel: z.string().trim().optional().nullable(),
  engineCc: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(50).max(2000).nullable().optional()
  ),
});

function generateFourDigitPin(): string {
  return crypto.randomInt(1000, 9999).toString();
}

function generateVerificationToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

// 1. GET /api/modules — List all modules + KPI stats (pulling any cloud verifications first)
router.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  await DbService.pullVerifiedStatusFromCloud();
  const modules = DbService.getAllModules();
  const stats = {
    total: modules.length,
    unassigned: modules.filter((m) => m.status === 'UNASSIGNED').length,
    pending: modules.filter((m) => m.status === 'PENDING_VERIFICATION').length,
    active: modules.filter((m) => m.status === 'ACTIVE').length,
    revoked: modules.filter((m) => m.status === 'REVOKED').length,
  };

  res.json({
    modules,
    stats,
    securityStatus: getConnectionSummary(),
  });
});

// 2. POST /api/modules — Register a new manufactured module into stock
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsed = RegisterModuleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message || 'Invalid module registration payload',
    });
    return;
  }

  const { serial, bikeMake, bikeModel, engineCc, firmwareVersion, hardwarePin } = parsed.data;
  const existing = DbService.getModuleBySerial(serial);
  if (existing) {
    res.status(409).json({
      error: 'DUPLICATE_SERIAL',
      message: `Module with serial ${serial} is already registered in the inventory.`,
    });
    return;
  }

  const now = new Date().toISOString();
  const newMod: HardwareModule = {
    serial,
    hardwarePin: hardwarePin || generateFourDigitPin(),
    bikeMake: bikeMake || null,
    bikeModel: bikeModel || null,
    engineCc: engineCc ?? null,
    firmwareVersion,
    status: 'UNASSIGNED',
    ownerName: null,
    ownerEmail: null,
    emergencyPhone: null,
    activationToken: null,
    tokenExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    verifiedAt: null,
  };

  await DbService.saveModule(newMod);

  DbService.appendAuditLog({
    actor: req.admin?.email || 'admin@ridetrace.lk',
    action: 'MODULE_REGISTERED',
    targetSerial: serial,
    details: `Registered hardware unit ${serial} (${firmwareVersion}) into stock.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ module: newMod });
});

// 3. POST /api/modules/:serial/assign — Assign customer email & dispatch verification link
router.post('/:serial/assign', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const serial = String(req.params.serial).toUpperCase();
  const mod = DbService.getModuleBySerial(serial);
  if (!mod) {
    res.status(404).json({ error: 'NOT_FOUND', message: `Module ${serial} not found.` });
    return;
  }

  const parsed = AssignCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message || 'Invalid customer details',
    });
    return;
  }

  const { ownerName, ownerEmail, emergencyPhone, bikeMake, bikeModel, engineCc } = parsed.data;
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const updated: HardwareModule = {
    ...mod,
    ownerName,
    ownerEmail: ownerEmail.toLowerCase(),
    emergencyPhone,
    bikeMake: bikeMake !== undefined ? bikeMake || null : mod.bikeMake,
    bikeModel: bikeModel !== undefined ? bikeModel || null : mod.bikeModel,
    engineCc: engineCc !== undefined ? engineCc ?? null : mod.engineCc,
    status: 'PENDING_VERIFICATION',
    activationToken: token,
    tokenExpiresAt: expiresAt,
    updatedAt: new Date().toISOString(),
    verifiedAt: null,
  };

  await DbService.saveModule(updated);
  const emailDispatch = await dispatchVerificationEmail(updated, getBaseUrl(req));

  DbService.appendAuditLog({
    actor: req.admin?.email || 'admin@ridetrace.lk',
    action: 'CUSTOMER_ASSIGNED',
    targetSerial: serial,
    details: `Assigned ${serial} to ${ownerEmail} (${ownerName}). Verification link dispatched.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    module: updated,
    emailDispatch,
  });
});

// 4. POST /api/modules/:serial/resend — Regenerate verification link & resend email
router.post('/:serial/resend', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const serial = String(req.params.serial).toUpperCase();
  const mod = DbService.getModuleBySerial(serial);
  if (!mod || !mod.ownerEmail) {
    res.status(400).json({
      error: 'INVALID_STATE',
      message: `Module ${serial} does not have an assigned customer email.`,
    });
    return;
  }

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const updated: HardwareModule = {
    ...mod,
    status: 'PENDING_VERIFICATION',
    activationToken: token,
    tokenExpiresAt: expiresAt,
    updatedAt: new Date().toISOString(),
  };

  await DbService.saveModule(updated);
  const emailDispatch = await dispatchVerificationEmail(updated, getBaseUrl(req));

  DbService.appendAuditLog({
    actor: req.admin?.email || 'admin@ridetrace.lk',
    action: 'VERIFICATION_RESENT',
    targetSerial: serial,
    details: `Re-issued verification link and resent email to ${mod.ownerEmail}.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    module: updated,
    emailDispatch,
  });
});

// 5. GET /api/modules/:serial/email-preview — View the rendered verification email
router.get('/:serial/email-preview', (req: AuthenticatedRequest, res: Response): void => {
  const serial = String(req.params.serial).toUpperCase();
  const mod = DbService.getModuleBySerial(serial);
  if (!mod || !mod.ownerEmail) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'No email assigned to this module.' });
    return;
  }

  const verificationUrl = buildVerificationUrl(mod, getBaseUrl(req));
  res.json({
    recipient: mod.ownerEmail,
    subject: `[RideTrace] Verify Your Email & Activate Module (${mod.serial})`,
    verificationUrl,
    htmlPreview: buildVerificationEmailHtml(mod, verificationUrl),
  });
});

// 6. POST /api/modules/:serial/verify-simulate — Simulate customer clicking verification link
router.post(
  '/:serial/verify-simulate',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const serial = String(req.params.serial).toUpperCase();
    const mod = DbService.getModuleBySerial(serial);
    if (!mod || !mod.ownerEmail) {
      res.status(400).json({ error: 'INVALID_STATE', message: 'Module is not assigned.' });
      return;
    }

    const now = new Date().toISOString();
    const updated: HardwareModule = {
      ...mod,
      status: 'ACTIVE',
      updatedAt: now,
      verifiedAt: now,
    };

    await DbService.saveModule(updated);

    DbService.appendAuditLog({
      actor: mod.ownerEmail,
      action: 'OWNERSHIP_VERIFIED',
      targetSerial: serial,
      details: `Email verified by customer (${mod.ownerEmail}). Device status set to Active.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ module: updated });
  }
);

// 7. POST /api/modules/:serial/revoke — Revoke customer ownership and reset to UNASSIGNED
router.post('/:serial/revoke', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const serial = String(req.params.serial).toUpperCase();
  const mod = DbService.getModuleBySerial(serial);
  if (!mod) {
    res.status(404).json({ error: 'NOT_FOUND', message: `Module ${serial} not found.` });
    return;
  }

  const previousEmail = mod.ownerEmail;
  const updated: HardwareModule = {
    ...mod,
    status: 'UNASSIGNED',
    ownerName: null,
    ownerEmail: null,
    emergencyPhone: null,
    activationToken: null,
    tokenExpiresAt: null,
    verifiedAt: null,
    updatedAt: new Date().toISOString(),
  };

  await DbService.saveModule(updated);

  DbService.appendAuditLog({
    actor: req.admin?.email || 'admin@ridetrace.lk',
    action: 'OWNERSHIP_REVOKED',
    targetSerial: serial,
    details: `Ownership revoked from ${previousEmail || 'customer'}. Device returned to unassigned stock.`,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ module: updated });
});

// 8. DELETE /api/modules/:serial — Permanently delete module (Restricted to SUPER_ADMIN)
router.delete(
  '/:serial',
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const serial = String(req.params.serial).toUpperCase();
    const existing = DbService.getModuleBySerial(serial);
    if (!existing) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Module ${serial} not found.` });
      return;
    }

    await DbService.deleteModule(serial);

    DbService.appendAuditLog({
      actor: req.admin?.email || 'admin@ridetrace.lk',
      action: 'MODULE_DELETED',
      targetSerial: serial,
      details: `Permanently deleted hardware unit ${serial} from inventory and Firebase database.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ deleted: true, serial });
  }
);

// 9. GET /api/modules/audit-logs — Fetch immutable security audit trail
router.get('/audit-logs', (_req: AuthenticatedRequest, res: Response): void => {
  res.json({
    logs: DbService.getAuditLogs(),
  });
});

export default router;
