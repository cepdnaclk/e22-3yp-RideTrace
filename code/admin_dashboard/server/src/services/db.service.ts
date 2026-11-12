import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';
import { checkFirebaseEmailVerified } from './email.service';

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

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetSerial: string;
  details: string;
  ipAddress: string;
}

interface VaultData {
  modules: HardwareModule[];
  auditLogs: AuditLogEntry[];
}

const VAULT_PATH = path.resolve(__dirname, '../../data/vault.json');

function readVault(): VaultData {
  try {
    if (!fs.existsSync(VAULT_PATH)) {
      const empty: VaultData = { modules: [], auditLogs: [] };
      fs.mkdirSync(path.dirname(VAULT_PATH), { recursive: true });
      fs.writeFileSync(VAULT_PATH, JSON.stringify(empty, null, 2), 'utf-8');
      return empty;
    }
    const raw = fs.readFileSync(VAULT_PATH, 'utf-8');
    return JSON.parse(raw) as VaultData;
  } catch (err) {
    console.error('[Vault Read Error]', err);
    return { modules: [], auditLogs: [] };
  }
}

function writeVault(data: VaultData): void {
  fs.mkdirSync(path.dirname(VAULT_PATH), { recursive: true });
  fs.writeFileSync(VAULT_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Optional Server-Side Cloud Sync Adapter:
 * When FIREBASE_DATABASE_URL or SUPABASE_URL is plugged into server/.env later,
 * this method automatically pushes the device registration/ownership record to the cloud
 * without ever exposing database keys to the browser!
 */
async function syncModuleToCloudIfConfigured(mod: HardwareModule): Promise<void> {
  // 1. Firebase Realtime Database Sync (if URL is configured in .env)
  if (ENV.FIREBASE_DATABASE_URL.trim()) {
    try {
      const baseUrl = ENV.FIREBASE_DATABASE_URL.replace(/\/$/, '');
      const authQuery = ENV.FIREBASE_DATABASE_SECRET.trim()
        ? `?auth=${encodeURIComponent(ENV.FIREBASE_DATABASE_SECRET.trim())}`
        : '';
      const url = `${baseUrl}/bikes/${encodeURIComponent(mod.serial)}.json${authQuery}`;

      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_serial: mod.serial,
          firmware_version: mod.firmwareVersion,
          bike_make: mod.bikeMake,
          bike_model: mod.bikeModel,
          engine_cc: mod.engineCc,
          device_name:
            mod.bikeMake || mod.bikeModel
              ? `${mod.bikeMake || ''} ${mod.bikeModel || ''}`.trim()
              : mod.serial,
          owner_name: mod.ownerName,
          owner_email: mod.ownerEmail,
          emergency_mobile: mod.emergencyPhone,
          status: mod.status,
          activation_token: mod.activationToken,
          token_expires_at: mod.tokenExpiresAt,
          verified_at: mod.verifiedAt,
          updated_at: Math.floor(Date.now() / 1000),
        }),
      });

      // Initialize default /telemetry/:serial node ONLY if it does not exist yet
      // (so the mobile app & Firebase console have the node ready before ESP32 first boot,
      // without ever overwriting live telemetry once the ESP32 starts streaming)
      const telemetryUrl = `${baseUrl}/telemetry/${encodeURIComponent(mod.serial)}.json${authQuery}`;
      const existingTelemetryRes = await fetch(telemetryUrl);
      const existingTelemetry = await existingTelemetryRes.json().catch(() => null);
      if (existingTelemetry === null) {
        await fetch(telemetryUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speed: 0,
            lean_angle: 0,
            accel_g: 1.0,
            engine_temp: 0,
            battery_pct: 100,
            crash_state: false,
            lat: 7.2545,
            lon: 80.5916,
            last_updated: Math.floor(Date.now() / 1000),
          }),
        });
      }
    } catch (err) {
      console.warn('[Firebase Cloud Sync Warning]', err);
    }
  }

  // 2. Supabase PostgreSQL Sync (if URL & Service Role Key are configured in .env)
  if (ENV.SUPABASE_URL.trim() && ENV.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    try {
      const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
      await fetch(`${baseUrl}/rest/v1/bikes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          device_serial: mod.serial,
          bike_make: mod.bikeMake,
          bike_model: mod.bikeModel,
          engine_cc: mod.engineCc,
          owner_name: mod.ownerName,
          owner_email: mod.ownerEmail,
          emergency_phone: mod.emergencyPhone,
          status: mod.status,
          activation_token: mod.activationToken,
          updated_at: mod.updatedAt,
        }),
      });
    } catch (err) {
      console.warn('[Supabase Cloud Sync Warning]', err);
    }
  }
}

async function deleteModuleFromCloudIfConfigured(serial: string): Promise<void> {
  // 1. Firebase Realtime Database Delete (/bikes/:serial and /telemetry/:serial)
  if (ENV.FIREBASE_DATABASE_URL.trim()) {
    try {
      const baseUrl = ENV.FIREBASE_DATABASE_URL.replace(/\/$/, '');
      const authQuery = ENV.FIREBASE_DATABASE_SECRET.trim()
        ? `?auth=${encodeURIComponent(ENV.FIREBASE_DATABASE_SECRET.trim())}`
        : '';
      const bikeUrl = `${baseUrl}/bikes/${encodeURIComponent(serial)}.json${authQuery}`;
      const telemetryUrl = `${baseUrl}/telemetry/${encodeURIComponent(serial)}.json${authQuery}`;

      await Promise.all([
        fetch(bikeUrl, { method: 'DELETE' }),
        fetch(telemetryUrl, { method: 'DELETE' }),
      ]);
    } catch (err) {
      console.warn('[Firebase Cloud Delete Warning]', err);
    }
  }

  // 2. Supabase PostgreSQL Delete (if configured)
  if (ENV.SUPABASE_URL.trim() && ENV.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    try {
      const baseUrl = ENV.SUPABASE_URL.replace(/\/$/, '');
      await fetch(`${baseUrl}/rest/v1/bikes?device_serial=eq.${encodeURIComponent(serial)}`, {
        method: 'DELETE',
        headers: {
          apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
    } catch (err) {
      console.warn('[Supabase Cloud Delete Warning]', err);
    }
  }
}

export const DbService = {
  getAllModules(): HardwareModule[] {
    const vault = readVault();
    return vault.modules.sort((a, b) => a.serial.localeCompare(b.serial));
  },

  getModuleBySerial(serial: string): HardwareModule | undefined {
    const vault = readVault();
    return vault.modules.find((m) => m.serial.toUpperCase() === serial.toUpperCase());
  },

  async saveModule(mod: HardwareModule): Promise<HardwareModule> {
    const vault = readVault();
    const index = vault.modules.findIndex(
      (m) => m.serial.toUpperCase() === mod.serial.toUpperCase()
    );
    if (index >= 0) {
      vault.modules[index] = mod;
    } else {
      vault.modules.push(mod);
    }
    writeVault(vault);
    await syncModuleToCloudIfConfigured(mod);
    return mod;
  },

  async deleteModule(serial: string): Promise<boolean> {
    const vault = readVault();
    const initialLen = vault.modules.length;
    vault.modules = vault.modules.filter((m) => m.serial.toUpperCase() !== serial.toUpperCase());
    if (vault.modules.length === initialLen) {
      return false;
    }
    writeVault(vault);
    await deleteModuleFromCloudIfConfigured(serial);
    return true;
  },

  async syncAllToCloud(): Promise<void> {
    const vault = readVault();
    await Promise.all(vault.modules.map((mod) => syncModuleToCloudIfConfigured(mod)));
  },

  async pullVerifiedStatusFromCloud(): Promise<void> {
    if (!ENV.FIREBASE_DATABASE_URL.trim()) return;
    try {
      const baseUrl = ENV.FIREBASE_DATABASE_URL.replace(/\/$/, '');
      const authQuery = ENV.FIREBASE_DATABASE_SECRET.trim()
        ? `?auth=${encodeURIComponent(ENV.FIREBASE_DATABASE_SECRET.trim())}`
        : '';
      const res = await fetch(`${baseUrl}/bikes.json${authQuery}`);
      if (!res.ok) return;
      const cloudBikes = (await res.json()) as Record<string, any> | null;
      if (!cloudBikes) return;

      const vault = readVault();
      let changed = false;

      for (const mod of vault.modules) {
        if (mod.status === 'ACTIVE' || !mod.ownerEmail) continue;

        const fbBike = cloudBikes ? cloudBikes[mod.serial] : null;
        let isVerifiedInCloud = fbBike && fbBike.status === 'ACTIVE';

        if (!isVerifiedInCloud && ENV.FIREBASE_WEB_API_KEY.trim()) {
          isVerifiedInCloud = await checkFirebaseEmailVerified(mod.ownerEmail);
        }

        if (isVerifiedInCloud) {
          const verifiedAt = (fbBike && fbBike.verified_at) || new Date().toISOString();
          mod.status = 'ACTIVE';
          mod.verifiedAt = verifiedAt;
          mod.updatedAt = verifiedAt;
          changed = true;
          await syncModuleToCloudIfConfigured(mod);

          const nextNum = 1001 + vault.auditLogs.length;
          vault.auditLogs.unshift({
            id: `AUD-${nextNum}`,
            timestamp: new Date().toISOString(),
            actor: mod.ownerEmail,
            action: 'OWNERSHIP_VERIFIED',
            targetSerial: mod.serial,
            details: `Email verified by customer (${mod.ownerEmail}) via universal verification link. Device ${mod.serial} is now Active.`,
            ipAddress: 'Cloud-Verify',
          });
        }
      }

      if (changed) {
        writeVault(vault);
      }
    } catch (err) {
      console.warn('[Firebase Cloud Pull Warning]', err);
    }
  },

  getAuditLogs(): AuditLogEntry[] {
    const vault = readVault();
    return vault.auditLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const vault = readVault();
    const nextNum = 1001 + vault.auditLogs.length;
    const newLog: AuditLogEntry = {
      id: `AUD-${nextNum}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    vault.auditLogs.unshift(newLog);
    writeVault(vault);
    return newLog;
  },
};
