import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CalendarCheck, Fingerprint, Link2, ChevronDown,
  Download, Check, ExternalLink,
} from 'lucide-react';

export const SessionQRManager = ({ activeEvent, selectedSession, onSessionChange, registrationUrl }) => {
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef(null);

  const isPreReg = selectedSession === 'Pre-Registration';

  // ── Download QR as high-res PNG ──────────────────────────────────────────
  const downloadQRCode = () => {
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) return;

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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.drawImage(img, margin, margin, qrSize, qrSize);
      const link = document.createElement('a');
      link.download = `QR_${activeEvent.title}_${selectedSession}.png`
        .replace(/[^a-z0-9_\-\.]/gi, '_');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // All sessions in order for the selector
  const allSessions = [
    ...(activeEvent.hasPreReg ? ['Pre-Registration'] : []),
    ...(activeEvent.sessions || []),
  ];

  return (
    <div className="
      w-full h-full flex flex-col
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-700/70
      rounded-2xl overflow-hidden
      shadow-sm
    ">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          {isPreReg
            ? <CalendarCheck size={12} className="text-gia-500 dark:text-gia-400 shrink-0" />
            : <Fingerprint size={12} className="text-gia-500 dark:text-gia-400 shrink-0" />
          }
          <span className="text-[9px] font-black uppercase tracking-widest text-gia-500 dark:text-gia-400">
            Active Gate
          </span>
        </div>
        <h2 className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-none truncate">
          {selectedSession}
        </h2>
      </div>

      {/* ── QR Code ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-5 py-4 flex items-center justify-center">
        <div className="group relative w-full">
          {/* QR wrapper — white background always so QR is scannable in dark mode */}
          <div
            ref={qrContainerRef}
            className="
              bg-white rounded-xl border border-neutral-200 dark:border-neutral-700
              p-4 w-full aspect-square flex items-center justify-center
              transition-transform duration-200 group-hover:scale-[1.015]
              shadow-sm
            "
          >
            <QRCodeSVG
              value={registrationUrl}
              size={512}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              level="H"
              fgColor="#0f172a"
              marginSize={0}
            />
          </div>

          {/* Download button — appears on hover */}
          <button
            onClick={downloadQRCode}
            title="Download QR as PNG"
            className="
              absolute top-2 right-2
              bg-white dark:bg-neutral-800
              border border-neutral-200 dark:border-neutral-700
              text-neutral-500 dark:text-neutral-400
              hover:text-gia-600 dark:hover:text-gia-400
              hover:border-gia-400 dark:hover:border-gia-600
              p-1.5 rounded-lg shadow-sm
              transition-all active:scale-90
              opacity-0 group-hover:opacity-100
            "
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ── Session selector + actions ──────────────────────────────────────── */}
      <div className="px-5 pb-5 space-y-3 shrink-0">

        {/* Session dropdown */}
        {allSessions.length > 1 && (
          <div className="relative">
            <select
              className="
                w-full appearance-none
                bg-neutral-50 dark:bg-neutral-800
                border border-neutral-200 dark:border-neutral-700
                text-neutral-800 dark:text-neutral-200
                rounded-xl px-3 py-2.5 pr-8
                text-xs font-bold
                outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500
                cursor-pointer transition-colors
              "
              value={selectedSession}
              onChange={e => onSessionChange(e.target.value)}
            >
              {allSessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
            />
          </div>
        )}

        {/* Action row: copy + open */}
        <div className="flex gap-2">
          {/* Copy link */}
          <button
            onClick={handleCopy}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-3 py-2.5 rounded-xl
              text-[10px] font-black uppercase tracking-widest
              border transition-all active:scale-[0.98]
              ${copied
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-gia-400 dark:hover:border-gia-600 hover:text-gia-600 dark:hover:text-gia-400'
              }
            `}
            title="Copy registration link"
          >
            {copied ? <Check size={13} /> : <Link2 size={13} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          {/* Open in new tab */}
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-center
              px-3 py-2.5 rounded-xl
              bg-neutral-50 dark:bg-neutral-800
              border border-neutral-200 dark:border-neutral-700
              text-neutral-500 dark:text-neutral-400
              hover:border-gia-400 dark:hover:border-gia-600
              hover:text-gia-600 dark:hover:text-gia-400
              transition-all active:scale-[0.98]
            "
            title="Open registration page"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        {/* URL preview */}
        <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-mono truncate leading-none">
          {registrationUrl}
        </p>
      </div>
    </div>
  );
};
