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
    <div className="bg-neutral-900 dark:bg-neutral-800 rounded-2xl p-5 text-white flex items-center gap-6 shadow-xl border border-white/5">

      {/* QR Code */}
      <div className="flex-none group relative">
        <div className="bg-white p-2 rounded-xl border-[3px] border-neutral-700 shadow-md transition-transform group-hover:scale-[1.02]">
          <div className="bg-neutral-50 p-1 rounded-lg">
            <QRCodeSVG
              id="session-qr-code"
              value={registrationUrl}
              size={85}
              level="H"
              fgColor="#0f172a"
              marginSize={0}
            />
          </div>
        </div>
        <button
          onClick={downloadQRCode}
          className="absolute -top-2 -right-2 bg-gia-600 hover:bg-gia-500 text-white p-1.5 rounded-full shadow-lg border-2 border-neutral-900 dark:border-neutral-800 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
          title="Download QR as PNG"
        >
          <Download size={12} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col justify-center gap-3 min-w-0">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-gia-300">
            {selectedSession.includes('Pre') ? <CalendarCheck size={12}/> : <Fingerprint size={12}/>}
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Active Gate</span>
          </div>
          <h2 className="text-xl font-black tracking-tight uppercase leading-none truncate">
            {selectedSession}
          </h2>
        </div>

        <div className="flex gap-2">
          {/* Session select */}
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

          {/* Copy link */}
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
        <p className="text-[9px] text-neutral-500 font-mono truncate">{registrationUrl}</p>
      </div>
    </div>
  );
};
