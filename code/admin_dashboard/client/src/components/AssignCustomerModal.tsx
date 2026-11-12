import React, { useState } from 'react';
import { X, Mail, Send, ShieldAlert } from 'lucide-react';
import { HardwareModule } from '../types/module';

interface AssignCustomerModalProps {
  module: HardwareModule;
  onClose: () => void;
  onAssign: (
    serial: string,
    data: {
      ownerName: string;
      ownerEmail: string;
      emergencyPhone: string;
      bikeMake?: string | null;
      bikeModel?: string | null;
      engineCc?: number | null;
    }
  ) => Promise<void>;
}

export const AssignCustomerModal: React.FC<AssignCustomerModalProps> = ({
  module,
  onClose,
  onAssign,
}) => {
  const [ownerName, setOwnerName] = useState(module.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(module.ownerEmail || '');
  const [emergencyPhone, setEmergencyPhone] = useState(module.emergencyPhone || '');
  const [bikeMake, setBikeMake] = useState(module.bikeMake || '');
  const [bikeModel, setBikeModel] = useState(module.bikeModel || '');
  const [engineCc, setEngineCc] = useState(module.engineCc ? String(module.engineCc) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const parsedCc = engineCc.trim() ? parseInt(engineCc, 10) : null;
      await onAssign(module.serial, {
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        emergencyPhone: emergencyPhone.trim(),
        bikeMake: bikeMake.trim() || null,
        bikeModel: bikeModel.trim() || null,
        engineCc: parsedCc && !Number.isNaN(parsedCc) ? parsedCc : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Assign Customer & Send Verification
              </h3>
              <p className="text-xs text-slate-500 font-mono">Module: {module.serial}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              Assigning an email sends a <strong>Verification Link</strong> to the customer. Once
              verified, this module is automatically ready when they sign into the RideTrace Mobile
              App.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Email Address (For Verification) *
            </label>
            <input
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="rider@gmail.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Danuja"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="0771234567"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
              />
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Motorcycle Details (Optional)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={bikeMake}
                onChange={(e) => setBikeMake(e.target.value)}
                placeholder="Make (Yamaha)"
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
              <input
                type="text"
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
                placeholder="Model (FZ)"
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
              <input
                type="number"
                min={50}
                max={2000}
                value={engineCc}
                onChange={(e) => setEngineCc(e.target.value)}
                placeholder="CC (150)"
                className="px-2.5 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Dispatching...' : 'Assign & Send Verification Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
