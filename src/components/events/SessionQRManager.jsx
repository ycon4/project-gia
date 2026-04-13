import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarCheck, Fingerprint, Link2, ChevronDown, Download, Check } from 'lucide-react';

export const SessionQRManager = ({ activeEvent, selectedSession, onSessionChange, registrationUrl }) => {
  const [copied, setCopied] = React.useState(false);

  const downloadQRCode = () => {
    const svg = document.getElementById('session-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvasSize = 1024;
    const margin = 80;
    const qrSize = canvasSize - margin * 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.drawImage(img, margin, margin, qrSize, qrSize);
      const pngFile = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `QR-${selectedSession}-${activeEvent.title}.png`;
      link.href = pngFile;
      link.click();
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-900 dark:bg-neutral-800 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-xl border border-white/5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 text-gia-300 mb-0.5">
            {selectedSession.includes('Pre') ? <CalendarCheck size={12}/> : <Fingerprint size={12}/>}
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Active Gate</span>
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase leading-none truncate">
            {selectedSession}
          </h2>
        </div>
      </div>

      {/* QR Code — fills remaining height */}
      <div className="group relative flex-1 min-h-0">
        <div className="bg-white p-3 rounded-2xl border-[3px] border-neutral-700 shadow-md transition-transform group-hover:scale-[1.02] w-full h-full flex items-center justify-center">
          <QRCodeSVG
            id="session-qr-code"
            value={registrationUrl}
            size={256}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            level="H"
            fgColor="#0f172a"
            marginSize={0}
          />
        </div>
        <button
          onClick={downloadQRCode}
          className="absolute top-1 right-1 bg-gia-600 hover:bg-gia-500 text-white p-1.5 rounded-full shadow-lg border-2 border-neutral-900 dark:border-neutral-800 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
          title="Download QR as PNG"
        >
          <Download size={12} />
        </button>
      </div>

      {/* Session selector + copy */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <select
            className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 px-3 pr-8 text-[11px] font-bold text-neutral-200 outline-none focus:ring-1 focus:ring-gia-500 appearance-none cursor-pointer"
            value={selectedSession}
            onChange={e => onSessionChange(e.target.value)}
          >
            {activeEvent.hasPreReg && <option value="Pre-Registration">Pre-Registration</option>}
            {activeEvent.sessions?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>
        <button
          onClick={handleCopy}
          className={`p-2.5 rounded-xl transition-all active:scale-95 border ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
          title="Copy registration link"
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
        </button>
      </div>

      {/* URL preview */}
      <p className="text-[9px] text-neutral-500 font-mono truncate shrink-0">{registrationUrl}</p>
    </div>
  );
};
