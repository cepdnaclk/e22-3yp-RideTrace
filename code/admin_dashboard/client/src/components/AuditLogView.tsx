import React from 'react';
import { Clock } from 'lucide-react';
import { AuditLogEntry } from '../types/module';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'CUSTOMER_ASSIGNED':
        return { label: 'Customer Assigned', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'OWNERSHIP_VERIFIED':
        return { label: 'Verified & Active', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'MODULE_REGISTERED':
        return { label: 'Module Registered', style: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'OWNERSHIP_REVOKED':
        return { label: 'Ownership Revoked', style: 'bg-red-50 text-red-700 border-red-200' };
      case 'VERIFICATION_RESENT':
        return { label: 'Code Resent', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'ADMIN_LOGIN':
        return { label: 'Admin Sign In', style: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: action.replace(/_/g, ' '), style: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Activity & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological record of hardware provisioning, customer onboarding, and verification events.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {logs.length} Events Recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Log ID</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4">Authorized User</th>
              <th className="py-3.5 px-4">Event</th>
              <th className="py-3.5 px-4">Device</th>
              <th className="py-3.5 px-4">Event Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {logs.map((log) => {
              const { label, style } = getActionConfig(log.action);
              return (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{log.id}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">{log.actor}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {log.targetSerial}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
