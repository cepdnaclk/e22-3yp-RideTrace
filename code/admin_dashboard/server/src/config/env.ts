import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_local_fallback_jwt_secret_change_in_env',

  // Primary Administrator (SUPER_ADMIN - Loaded from server/.env)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@ridetrace.lk',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'RideTrace@2026',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Primary Administrator',

  // Staff / Operator Account (OPERATOR - Loaded from server/.env)
  OPERATOR_EMAIL: process.env.OPERATOR_EMAIL || 'operator@ridetrace.lk',
  OPERATOR_PASSWORD: process.env.OPERATOR_PASSWORD || 'Operator@2026',
  OPERATOR_NAME: process.env.OPERATOR_NAME || 'Provisioning Operator',

  // All Database & SMTP Keys/URLs are loaded strictly from local server/.env (never committed to Git)
  STORAGE_MODE: (process.env.STORAGE_MODE || 'LOCAL') as 'LOCAL' | 'CLOUD',
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || '',
  FIREBASE_DATABASE_SECRET: process.env.FIREBASE_DATABASE_SECRET || '',
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '"RideTrace Systems" <no-reply@ridetrace.lk>',
};

export function getConnectionSummary() {
  const hasFirebase = Boolean(ENV.FIREBASE_DATABASE_URL.trim());
  const hasSupabase = Boolean(ENV.SUPABASE_URL.trim() && ENV.SUPABASE_SERVICE_ROLE_KEY.trim());
  const hasSmtp = Boolean(ENV.SMTP_USER.trim() && ENV.SMTP_PASS.trim());

  return {
    storageMode: hasFirebase || hasSupabase ? 'CLOUD_HYBRID' : 'LOCAL_VAULT',
    firebaseConnected: hasFirebase,
    supabaseConnected: hasSupabase,
    smtpConfigured: hasSmtp,
    zeroClientKeyExposure: true,
    encryptionStandard: 'JWT-HS256 + Bcrypt-12',
  };
}
