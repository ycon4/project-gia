import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarCheck, Fingerprint, Link2, Globe } from 'lucide-react';

export const SessionQRManager = ({ activeEvent, selectedSession, onSessionChange, registrationUrl }) => {
  return (
    <div className="bg-indigo-950 rounded-[40px] p-8 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
      {/* Decorative Background Icon */}
      <Globe size={300} className="absolute -right-20 -bottom-20 text-indigo-900 opacity-20 pointer-events-none group-hover:rotate-12 transition-transform duration-1000" />
      
      <div className="flex-1 space-y-6 w-full relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-4">
            {selectedSession.includes('Pre') ? <CalendarCheck size={12}/> : <Fingerprint size={12}/>}
            Control Panel
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight uppercase">
            {selectedSession}
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Change Active Gate</label>
          <select 
            className="w-full bg-indigo-900/40 border border-indigo-700/50 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
            value={selectedSession}
            onChange={e => onSessionChange(e.target.value)}
          >
            {activeEvent.hasPreReg && <option value="Pre-Registration">Pre-Registration</option>}
            {activeEvent.sessions?.map(s => (<option key={s} value={s}>{s}</option>))}
            {(!activeEvent.sessions || activeEvent.sessions.length === 0) && !activeEvent.hasPreReg && (
              <option value="General Attendance">General Attendance</option>
            )}
          </select>
        </div>

        <button 
          onClick={() => { navigator.clipboard.writeText(registrationUrl); alert("Copied!"); }}
          className="w-full md:w-auto bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-50 active:scale-95 transition-all shadow-xl"
        >
          <Link2 size={18} /> Copy Registration URL
        </button>
      </div>

      {/* QR Container */}
      <div className="bg-white p-6 rounded-[35px] shadow-2xl transform hover:rotate-2 transition-transform duration-500 border-[8px] border-indigo-900/10">
        <QRCodeSVG value={registrationUrl} size={180} level="H" fgColor="#1e1b4b" marginSize={2} />
        <div className="mt-4 text-center">
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Scan to Join</p>
          <p className="text-[8px] font-bold text-indigo-400 uppercase mt-0.5 italic">{activeEvent.title}</p>
        </div>
      </div>
    </div>
  );
};