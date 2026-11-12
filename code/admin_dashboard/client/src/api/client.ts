import {
  HardwareModule,
  ModuleStats,
  SecurityStatus,
  AuditLogEntry,
  EmailPreviewData,
  AdminProfile,
} from '../types/module';

const TOKEN_STORAGE_KEY = 'ridetrace_admin_jwt';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `API Error (${res.status})`);
  }
  return data as T;
}

export const AdminApi = {
  login(email: string, password: string) {
    return apiRequest<{
      token: string;
      admin: AdminProfile;
      securityStatus: SecurityStatus;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getProfile() {
    return apiRequest<{
      admin: AdminProfile;
      securityStatus: SecurityStatus;
    }>('/api/auth/me');
  },

  getModules() {
    return apiRequest<{
      modules: HardwareModule[];
      stats: ModuleStats;
      securityStatus: SecurityStatus;
    }>('/api/modules');
  },

  registerModule(payload: {
    serial: string;
    firmwareVersion: string;
    hardwarePin?: string;
  }) {
    return apiRequest<{ module: HardwareModule }>('/api/modules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  assignCustomer(
    serial: string,
    payload: {
      ownerName: string;
      ownerEmail: string;
      emergencyPhone: string;
      bikeMake?: string | null;
      bikeModel?: string | null;
      engineCc?: number | null;
    }
  ) {
    return apiRequest<{
      module: HardwareModule;
      emailDispatch: EmailPreviewData;
    }>(`/api/modules/${encodeURIComponent(serial)}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resendVerification(serial: string) {
    return apiRequest<{
      module: HardwareModule;
      emailDispatch: EmailPreviewData;
    }>(`/api/modules/${encodeURIComponent(serial)}/resend`, {
      method: 'POST',
    });
  },

  getEmailPreview(serial: string) {
    return apiRequest<EmailPreviewData>(
      `/api/modules/${encodeURIComponent(serial)}/email-preview`
    );
  },

  simulateCustomerVerify(serial: string) {
    return apiRequest<{ module: HardwareModule }>(
      `/api/modules/${encodeURIComponent(serial)}/verify-simulate`,
      {
        method: 'POST',
      }
    );
  },

  revokeOwnership(serial: string) {
    return apiRequest<{ module: HardwareModule }>(
      `/api/modules/${encodeURIComponent(serial)}/revoke`,
      {
        method: 'POST',
      }
    );
  },

  deleteModule(serial: string) {
    return apiRequest<{ deleted: boolean; serial: string }>(
      `/api/modules/${encodeURIComponent(serial)}`,
      {
        method: 'DELETE',
      }
    );
  },

  getAuditLogs() {
    return apiRequest<{ logs: AuditLogEntry[] }>('/api/modules/audit-logs');
  },
};
