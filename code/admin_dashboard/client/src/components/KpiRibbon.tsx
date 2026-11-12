import React from 'react';
import { Cpu, PackageOpen, MailWarning, CheckCircle2 } from 'lucide-react';
import { ModuleStats } from '../types/module';

interface KpiRibbonProps {
  stats: ModuleStats;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Manufactured
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Registered ESP32 units</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
          <Cpu className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available Stock
          </p>
          <p className="text-3xl font-extrabold text-slate-700 mt-1 font-mono">
            {stats.unassigned}
          </p>
          <p className="text-xs text-slate-500 mt-1">Unassigned inventory</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
          <PackageOpen className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Pending Verification
          </p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1 font-mono">
            {stats.pending}
          </p>
          <p className="text-xs text-amber-700/80 mt-1">Email sent, awaiting rider</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
          <MailWarning className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Verified & Active
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
            {stats.active}
          </p>
          <p className="text-xs text-emerald-700/80 mt-1">Claimed in mobile app</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
