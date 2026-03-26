import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarCheck, Fingerprint, Link2, ChevronDown, Download, Copy, Check } from 'lucide-react';

export const SessionQRManager = ({ activeEvent, selectedSession, onSessionChange, registrationUrl }) => {
  const [copied, setCopied] = React.useState(false);

  // Function to trigger the PNG download
  const downloadQRCode = () => {
  const svg = document.getElementById("session-qr-code");
  const svgData = new XMLSerializer().serializeToString(svg);
  
  // 1. Set a high target resolution for the download (e.g., 1024px)
  const canvasSize = 1024; 
  const margin = 80; // Nice breathable white border
  const qrSize = canvasSize - (margin * 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  // Standard way to handle SVG to Canvas conversion
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));

  img.onload = () => {
    // 2. Fill background white (essential for QR scannability)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 3. Draw the QR code centered and scaled up
    ctx.drawImage(img, margin, margin, qrSize, qrSize);

    // 4. Trigger the download
    const pngFile = canvas.toDataURL("image/png", 1.0);
    const downloadLink = document.createElement("a");
    downloadLink.download = `QR-${selectedSession}-${activeEvent.title}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  };
};
  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch mb-6">
      
      {/* LEFT SIDE: The Compact Control Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-5 text-white flex items-center gap-6 shadow-xl border border-white/5 min-w-[480px]">
        
        {/* QR Module with Download Action */}
        <div className="flex-none group relative">
          <div className="bg-white p-2 rounded-2xl border-[3px] border-slate-800 shadow-md transition-transform group-hover:scale-[1.02]">
            <div className="bg-slate-50 p-1 rounded-lg">
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
          
          {/* Floating Download Button */}
          <button 
            onClick={downloadQRCode}
            className="absolute -top-2 -right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
            title="Download QR as PNG"
          >
            <Download size={12} />
          </button>
        </div>

        {/* Controls Section */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-indigo-400">
              {selectedSession.includes('Pre') ? <CalendarCheck size={12}/> : <Fingerprint size={12}/>}
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 text-indigo-300">Active Gate</span>
            </div>
            <h2 className="text-xl font-black tracking-tight uppercase leading-none truncate max-w-[220px]">
              {selectedSession}
            </h2>
          </div>

          <div className="flex gap-2">
            {/* Session Select */}
            <div className="relative flex-1 group">
              <select 
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-2.5 px-3 pr-8 text-[11px] font-bold text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                value={selectedSession}
                onChange={e => onSessionChange(e.target.value)}
              >
                {activeEvent.hasPreReg && <option value="Pre-Registration">Pre-Registration</option>}
                {activeEvent.sessions?.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Copy Button with Feedback */}
            <button 
              onClick={handleCopy}
              className={`p-2.5 rounded-xl transition-all active:scale-95 border ${copied ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              title="Copy Link"
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Future GAD Analytics Container */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-2 opacity-20 group">
             <div className="w-12 h-1 bg-slate-200 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analytics Preview</span>
        </div>
      </div>
      
    </div>
  );
};