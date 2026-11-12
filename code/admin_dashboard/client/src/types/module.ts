export type ModuleStatus = 'UNASSIGNED' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'REVOKED';

export interface HardwareModule {
  serial: string;
  hardwarePin: string;
  bikeMake: string | null;
  bikeModel: string | null;
  engineCc: number | null;
  firmwareVersion: string;
  status: ModuleStatus;
  ownerName: string | null;
  ownerEmail: string | null;
  emergencyPhone: string | null;
  activationToken: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
}

export interface ModuleStats {
  total: number;
  unassigned: number;
  pending: number;
  active: number;
  revoked: number;
}

export interface SecurityStatus {
  storageMode: 'LOCAL_VAULT' | 'CLOUD_HYBRID';
  firebaseConnected: boolean;
  supabaseConnected: boolean;
  smtpConfigured: boolean;
  zeroClientKeyExposure: boolean;
  encryptionStandard: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetSerial: string;
  details: string;
  ipAddress: string;
}

export interface EmailPreviewData {
  sentViaSmtp?: boolean;
  recipient: string;
  subject: string;
  verificationUrl: string;
  htmlPreview: string;
  dispatchedAt?: string;
  note?: string;
}

export interface AdminProfile {
  email: string;
  name: string;
  role: string;
}
