import React, { useState } from 'react';
import { X, Cpu, PlusCircle } from 'lucide-react';

interface RegisterModuleModalProps {
  nextSuggestedSerial: string;
  onClose: () => void;
  onSubmit: (data: {
    serial: string;
    firmwareVersion: string;
  }) => Promise<void>;
}

export const RegisterModuleModal: React.FC<RegisterModuleModalProps> = ({
  nextSuggestedSerial,
  onClose,
  onSubmit,
}) => {
  const [serial, setSerial] = useState(nextSuggestedSerial);
  const [firmwareVersion, setFirmwareVersion] = useState('v1.2.5-ESP32');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        serial: serial.trim().toUpperCase(),
        firmwareVersion: firmwareVersion.trim() || 'v1.2.5-ESP32',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register module.');
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
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Register New Hardware Module</h3>
              <p className="text-xs text-slate-500">Add assembled ESP32 unit to inventory stock</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Device Serial ID *
            </label>
            <input
              type="text"
              required
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              placeholder="RT-007"
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Firmware Version *
            </label>
            <input
              type="text"
              required
              value={firmwareVersion}
              onChange={(e) => setFirmwareVersion(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Motorcycle details are optional at registration and can be added later when assigning the
            module to a customer.
          </p>

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
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Registering...' : 'Register Module'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
