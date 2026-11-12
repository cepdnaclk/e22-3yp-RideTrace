import React from 'react';
import { X, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { HardwareModule } from '../types/module';

interface QrLabelModalProps {
  module: HardwareModule;
  onClose: () => void;
}

export const QrLabelModal: React.FC<QrLabelModalProps> = ({ module, onClose }) => {
  const qrPayload = JSON.stringify({
    serial: module.serial,
    firmware: module.firmwareVersion,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Hardware Box Unit Label</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div
            id="printable-qr-sticker"
            className="border-2 border-slate-900 rounded-xl p-5 bg-white text-center space-y-3"
          >
            <div className="border-b border-slate-200 pb-2">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">
                RIDE<span className="text-blue-600">TRACE</span> HARDWARE UNIT
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Smart Motorcycle Safety &amp; Telemetry
              </div>
            </div>

            <div className="flex justify-center py-2">
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                <QRCodeSVG value={qrPayload} size={148} level="M" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-left space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">DEVICE SERIAL:</span>
                <span className="font-mono font-bold text-slate-900">{module.serial}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">FIRMWARE:</span>
                <span className="font-mono text-[11px] text-slate-600">
                  {module.firmwareVersion}
                </span>
              </div>
              {module.bikeMake && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">MOTORCYCLE:</span>
                  <span className="font-semibold text-slate-800">
                    {module.bikeMake} {module.bikeModel}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 pt-1">
              Unit Identification Label • Scan or reference Serial ID when assigning this module to
              a customer.
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Box Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
