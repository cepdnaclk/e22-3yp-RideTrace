import React from 'react';
import { ShieldCheck, Package, FileText, LogOut } from 'lucide-react';
import { AdminProfile, SecurityStatus } from '../types/module';

interface TopNavbarProps {
  admin: AdminProfile;
  securityStatus: SecurityStatus | null;
  activeTab: 'INVENTORY' | 'AUDIT';
  onTabChange: (tab: 'INVENTORY' | 'AUDIT') => void;
  onLogout: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  admin,
  securityStatus,
  activeTab,
  onTabChange,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">
                    Ride<span className="text-blue-600">Trace</span>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Enterprise Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Hardware Provisioning & Customer Onboarding Portal
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => onTabChange('INVENTORY')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'INVENTORY'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Module Inventory</span>
            </button>

            <button
              onClick={() => onTabChange('AUDIT')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </nav>

          {/* Right Status & Admin Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>System Online</span>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-900">{admin.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">{admin.email}</div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
