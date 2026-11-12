import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { HardwareModule } from './db.service';

export interface EmailDispatchResult {
  sentViaSmtp: boolean;
  sentViaFirebaseAuth?: boolean;
  recipient: string;
  subject: string;
  verificationUrl: string;
  htmlPreview: string;
  dispatchedAt: string;
  note: string;
}

export function deriveFirebaseAuthPassword(email: string): string {
  return (
    crypto
      .createHmac('sha256', ENV.JWT_SECRET)
      .update(email.toLowerCase().trim())
      .digest('hex')
      .slice(0, 20) + 'Rt1!'
  );
}

export async function getOrCreateFirebaseAuthIdToken(email: string): Promise<string | null> {
  const apiKey = ENV.FIREBASE_WEB_API_KEY.trim();
  if (!apiKey || !email) return null;
  const password = deriveFirebaseAuthPassword(email);

  try {
    // 1. Try signing up the customer email in Firebase Authentication
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const signUpData = (await signUpRes.json()) as any;
    if (signUpRes.ok && signUpData.idToken) {
      return signUpData.idToken as string;
    }

    // 2. If account already exists, sign in to obtain idToken
    if (signUpData?.error?.message === 'EMAIL_EXISTS') {
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const signInData = (await signInRes.json()) as any;
      if (signInRes.ok && signInData.idToken) {
        return signInData.idToken as string;
      }
    }
  } catch (err) {
    console.warn('[Firebase Auth Token Warning]', err);
  }
  return null;
}

export async function checkFirebaseEmailVerified(email: string): Promise<boolean> {
  const apiKey = ENV.FIREBASE_WEB_API_KEY.trim();
  if (!apiKey || !email) return false;
  try {
    const idToken = await getOrCreateFirebaseAuthIdToken(email);
    if (!idToken) return false;
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    const lookupData = (await lookupRes.json()) as any;
    return Boolean(lookupData?.users?.[0]?.emailVerified);
  } catch {
    return false;
  }
}

async function sendFirebaseUniversalVerificationEmail(email: string): Promise<boolean> {
  const apiKey = ENV.FIREBASE_WEB_API_KEY.trim();
  if (!apiKey || !email) return false;
  try {
    const idToken = await getOrCreateFirebaseAuthIdToken(email);
    if (!idToken) return false;
    const oobRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'VERIFY_EMAIL',
          idToken,
        }),
      }
    );
    return oobRes.ok;
  } catch (err) {
    console.warn('[Firebase Universal Verify Email Warning]', err);
    return false;
  }
}

export function buildVerificationUrl(mod: HardwareModule, baseUrl?: string): string {
  const token = mod.activationToken || '';
  const origin = (ENV.PUBLIC_BASE_URL.trim() || baseUrl || `http://localhost:${ENV.PORT}`).replace(
    /\/$/,
    ''
  );
  return `${origin}/api/modules/verify?token=${encodeURIComponent(token)}`;
}

export function buildVerificationEmailHtml(mod: HardwareModule, verificationUrl: string): string {
  const bikeSummary =
    mod.bikeMake || mod.bikeModel
      ? `${mod.bikeMake || ''} ${mod.bikeModel || ''}${mod.engineCc ? ` (${mod.engineCc}cc)` : ''}`.trim()
      : 'To be configured in RideTrace App';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A; }
    .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
    .header { background: #0F172A; color: #FFFFFF; padding: 24px 32px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF; }
    .brand span { color: #38BDF8; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; color: #334155; }
    .cta-box { background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0; }
    .cta-btn { display: inline-block; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 8px; }
    .specs { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; font-size: 13px; margin-bottom: 20px; }
    .specs div { margin: 4px 0; }
    .link-fallback { font-size: 11px; color: #64748B; word-break: break-all; margin-top: 12px; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; font-size: 12px; color: #64748B; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">Ride<span>Trace</span></div>
      <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Smart Motorcycle Safety & Telemetry</div>
    </div>
    <div class="content">
      <p style="margin-top: 0;">Hello <strong>${mod.ownerName || 'Rider'}</strong>,</p>
      <p>Your RideTrace hardware unit has been assigned to your account. Please verify your email address below to activate your module.</p>
      
      <div class="specs">
        <div><strong>Module Serial ID:</strong> ${mod.serial}</div>
        <div><strong>Motorcycle:</strong> ${bikeSummary}</div>
        <div><strong>Assigned Account:</strong> ${mod.ownerEmail}</div>
      </div>

      <div class="cta-box">
        <a href="${verificationUrl}" class="cta-btn">Verify Email &amp; Activate Device</a>
        <div style="font-size: 11px; color: #64748B; margin-top: 10px;">This verification link is valid for 24 hours.</div>
        <div class="link-fallback">Or open this link in your browser:<br/>${verificationUrl}</div>
      </div>

      <p style="font-size: 13px; color: #475569;"><strong>Next steps:</strong><br/>
      1. Click <strong>Verify Email &amp; Activate Device</strong> above (or the Firebase universal verification link sent to your inbox).<br/>
      2. Open the <strong>RideTrace Mobile App</strong> and sign in with <strong>${mod.ownerEmail}</strong>.<br/>
      3. Your module (<strong>${mod.serial}</strong>) will be linked automatically and ready to use.</p>
    </div>
    <div class="footer">
      © 2026 RideTrace Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function dispatchVerificationEmail(
  mod: HardwareModule,
  baseUrl?: string
): Promise<EmailDispatchResult> {
  const subject = `[RideTrace] Verify Your Email & Activate Module (${mod.serial})`;
  const verificationUrl = buildVerificationUrl(mod, baseUrl);
  const htmlPreview = buildVerificationEmailHtml(mod, verificationUrl);
  const recipient = mod.ownerEmail || '';

  // 1. Trigger universal Firebase Authentication verification email (if FIREBASE_WEB_API_KEY is configured)
  const sentViaFirebaseAuth = await sendFirebaseUniversalVerificationEmail(recipient);

  // 2. Also send RideTrace branded SMTP notification if configured
  if (ENV.SMTP_USER.trim() && ENV.SMTP_PASS.trim() && recipient) {
    try {
      const transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: recipient,
        subject,
        html: htmlPreview,
      });

      return {
        sentViaSmtp: true,
        sentViaFirebaseAuth,
        recipient,
        subject,
        verificationUrl,
        htmlPreview,
        dispatchedAt: new Date().toISOString(),
        note: sentViaFirebaseAuth
          ? 'Delivered via Firebase Universal Auth + SMTP server.'
          : 'Delivered via live SMTP server.',
      };
    } catch (err) {
      console.warn('[SMTP Send Warning - Falling back to interactive preview]', err);
    }
  }

  return {
    sentViaSmtp: false,
    sentViaFirebaseAuth,
    recipient,
    subject,
    verificationUrl,
    htmlPreview,
    dispatchedAt: new Date().toISOString(),
    note: sentViaFirebaseAuth
      ? 'Universal verification email dispatched via Firebase Authentication.'
      : 'Generated in Sandbox/Preview Mode.',
  };
}
