import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Mail,
  QrCode,
  RefreshCw,
  CheckCircle2,
  UserX,
  Trash2,
  Eye,
  Lock,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  HardwareModule,
  ModuleStats,
  SecurityStatus,
  AuditLogEntry,
  EmailPreviewData,
  AdminProfile,
} from './types/module';
import { AdminApi, getStoredToken, setStoredToken } from './api/client';
import { TopNavbar } from './components/TopNavbar';
import { KpiRibbon } from './components/KpiRibbon';
import { RegisterModuleModal } from './components/RegisterModuleModal';
import { AssignCustomerModal } from './components/AssignCustomerModal';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { QrLabelModal } from './components/QrLabelModal';
import { AuditLogView } from './components/AuditLogView';

export function App() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin@ridetrace.lk');
  const [loginPassword, setLoginPassword] = useState('RideTrace@2026');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'AUDIT'>('INVENTORY');
  const [modules, setModules] = useState<HardwareModule[]>([]);
  const [stats, setStats] = useState<ModuleStats>({
    total: 0,
    unassigned: 0,
    pending: 0,
    active: 0,
    revoked: 0,
  });
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [assigningModule, setAssigningModule] = useState<HardwareModule | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreviewData | null>(null);
  const [qrModule, setQrModule] = useState<HardwareModule | null>(null);

  // Banner Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [modRes, auditRes] = await Promise.all([
        AdminApi.getModules(),
        AdminApi.getAuditLogs(),
      ]);
      setModules(modRes.modules);
      setStats(modRes.stats);
      setSecurityStatus(modRes.securityStatus);
      setAuditLogs(auditRes.logs);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to load dashboard data.');
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    AdminApi.getProfile()
      .then((res) => {
        setAdmin(res.admin);
        setSecurityStatus(res.securityStatus);
        return loadDashboardData();
      })
      .catch(() => {
        setStoredToken(null);
        setAdmin(null);
      })
      .finally(() => setAuthChecking(false));
  }, [loadDashboardData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await AdminApi.login(loginEmail, loginPassword);
      setStoredToken(res.token);
      setAdmin(res.admin);
      setSecurityStatus(res.securityStatus);
      await loadDashboardData();
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setAdmin(null);
  };

  const handleRegisterModule = async (payload: {
    serial: string;
    firmwareVersion: string;
    hardwarePin?: string;
  }) => {
    const res = await AdminApi.registerModule(payload);
    await loadDashboardData();
    showNotice('success', `Module ${res.module.serial} registered into inventory.`);
    setQrModule(res.module);
  };

  const handleAssignCustomer = async (
    serial: string,
    payload: {
      ownerName: string;
      ownerEmail: string;
      emergencyPhone: string;
      bikeMake?: string | null;
      bikeModel?: string | null;
      engineCc?: number | null;
    }
  ) => {
    const res = await AdminApi.assignCustomer(serial, payload);
    await loadDashboardData();
    showNotice(
      'success',
      `Assigned ${serial} to ${payload.ownerEmail} and dispatched verification email.`
    );
    setEmailPreview(res.emailDispatch);
  };

  const handleResendEmail = async (serial: string) => {
    try {
      const res = await AdminApi.resendVerification(serial);
      await loadDashboardData();
      showNotice('success', `Re-issued verification link and resent email for ${serial}.`);
      setEmailPreview(res.emailDispatch);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handlePreviewEmail = async (serial: string) => {
    try {
      const res = await AdminApi.getEmailPreview(serial);
      setEmailPreview(res);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleSimulateVerify = async (serial: string) => {
    try {
      await AdminApi.simulateCustomerVerify(serial);
      await loadDashboardData();
      showNotice('success', `Module ${serial} ownership verified and marked ACTIVE.`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleRevokeOwnership = async (serial: string) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke customer ownership for ${serial}? This will reset the module back to UNASSIGNED stock.`
      )
    ) {
      return;
    }
    try {
      await AdminApi.revokeOwnership(serial);
      await loadDashboardData();
      showNotice('success', `Ownership revoked. Module ${serial} is now UNASSIGNED.`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const handleDeleteModule = async (serial: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete module ${serial} from the system and Firebase database? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await AdminApi.deleteModule(serial);
      await loadDashboardData();
      showNotice('success', `Module ${serial} permanently deleted from inventory and Firebase.`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  const getNextSuggestedSerial = () => {
    const maxNum = modules.reduce((max, m) => {
      const match = m.serial.match(/^RT-(\d+)$/);
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);
    return `RT-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const filteredModules = modules.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      m.serial.toLowerCase().includes(q) ||
      (m.bikeMake && m.bikeMake.toLowerCase().includes(q)) ||
      (m.bikeModel && m.bikeModel.toLowerCase().includes(q)) ||
      (m.ownerEmail && m.ownerEmail.toLowerCase().includes(q)) ||
      (m.ownerName && m.ownerName.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          Verifying Enterprise Session...
        </div>
      </div>
    );
  }

  // ============================================================================
  // ENTERPRISE SIGN-IN GATE
  // ============================================================================
  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Ride<span className="text-blue-600">Trace</span> Enterprise Portal
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Hardware Module Provisioning & Customer Email Verification System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-medium text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Security Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to Provisioning Portal'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-400">
                © 2026 RideTrace Systems • Authorized Personnel Only
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED ENTERPRISE PORTAL
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNavbar
        admin={admin}
        securityStatus={securityStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {toast.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-xs font-bold underline opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <KpiRibbon stats={stats} />

        {activeTab === 'AUDIT' && <AuditLogView logs={auditLogs} />}

        {activeTab === 'INVENTORY' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Action Bar */}
            <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'UNASSIGNED', 'PENDING_VERIFICATION', 'ACTIVE'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'All Units'
                        : st === 'UNASSIGNED'
                        ? 'Unassigned Stock'
                        : st === 'PENDING_VERIFICATION'
                        ? 'Pending Verification'
                        : 'Verified & Active'}
                    </button>
                  )
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Serial, Bike, or Email..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Module</span>
                </button>
              </div>
            </div>

            {/* Modules Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Module Serial & Firmware</th>
                    <th className="py-3.5 px-4">Target Motorcycle</th>
                    <th className="py-3.5 px-4">Assigned Customer Email</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4">Email Verification</th>
                    <th className="py-3.5 px-4 text-right">Provisioning Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredModules.map((mod) => (
                    <tr key={mod.serial} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {mod.serial}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {mod.firmwareVersion}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {mod.bikeMake || mod.bikeModel ? (
                          <>
                            <div className="font-semibold text-slate-900">
                              {mod.bikeMake} {mod.bikeModel}
                            </div>
                            {mod.engineCc && (
                              <div className="text-[11px] text-slate-500">{mod.engineCc}cc</div>
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-400">Not assigned yet</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {mod.ownerEmail ? (
                          <div>
                            <div className="font-semibold text-slate-900">{mod.ownerName}</div>
                            <div className="font-mono text-blue-600 text-[11px]">
                              {mod.ownerEmail}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Tel: {mod.emergencyPhone}
                            </div>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Unassigned Stock</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {mod.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Verified & Active
                          </span>
                        )}
                        {mod.status === 'PENDING_VERIFICATION' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Email Verification
                          </span>
                        )}
                        {mod.status === 'UNASSIGNED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {mod.verifiedAt ? (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Verified {new Date(mod.verifiedAt).toLocaleDateString()}
                          </span>
                        ) : mod.activationToken ? (
                          <span className="text-[11px] font-medium text-amber-700">
                            Link Dispatched (24h)
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Assign or Edit Email */}
                          <button
                            onClick={() => setAssigningModule(mod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            title="Assign Customer Email & Send Verification"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{mod.ownerEmail ? 'Reassign' : 'Assign Email'}</span>
                          </button>

                          {/* Preview Sent Email */}
                          {mod.ownerEmail && (
                            <button
                              onClick={() => handlePreviewEmail(mod.serial)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                              title="Preview Verification Email"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Email</span>
                            </button>
                          )}

                          {/* Resend Email */}
                          {mod.status === 'PENDING_VERIFICATION' && (
                            <>
                              <button
                                onClick={() => handleResendEmail(mod.serial)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                                title="Resend New Verification Token"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleSimulateVerify(mod.serial)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                title="Simulate Customer Completing App Verification"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>
                            </>
                          )}

                          {/* QR Box Label */}
                          <button
                            onClick={() => setQrModule(mod)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                            title="Print Box QR Label"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Revoke Ownership */}
                          {mod.ownerEmail && (
                            <button
                              onClick={() => handleRevokeOwnership(mod.serial)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                              title="Revoke Customer Ownership"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Module (Restricted strictly to SUPER_ADMIN) */}
                          {admin.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteModule(mod.serial)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                              title="Permanently Delete Module (Primary Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredModules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                        No hardware modules match your current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showRegisterModal && (
        <RegisterModuleModal
          nextSuggestedSerial={getNextSuggestedSerial()}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterModule}
        />
      )}

      {assigningModule && (
        <AssignCustomerModal
          module={assigningModule}
          onClose={() => setAssigningModule(null)}
          onAssign={handleAssignCustomer}
        />
      )}

      {emailPreview && (
        <EmailPreviewModal data={emailPreview} onClose={() => setEmailPreview(null)} />
      )}

      {qrModule && <QrLabelModal module={qrModule} onClose={() => setQrModule(null)} />}
    </div>
  );
}
