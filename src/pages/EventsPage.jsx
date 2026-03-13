import React, { useState, useMemo } from 'react';
import { Plus, Calendar, QrCode, Users, BarChart3, Trash2, ExternalLink, Download, CheckCircle2, X, Search, Lock, PlayCircle, School, Briefcase, UserCircle, Footprints } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import GeneralDashboard from '../components/events/GeneralPage'; // Assuming same directory

export default function EventsPage({ events = [], attendanceData = [], onCreateEvent, onDeleteEvent, onUpdateEventStatus }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newEvent, setNewEvent] = useState({ 
    title: '', startDate: '', endDate: '', status: 'Active',
    formConfig: { fullName: true, sex: true, sector: true, idNumber: true, office_college: true, scholarship: false, position: false },
    sessions: ['Pre-Registration', 'Day 1 Attendance']
  });

  const currentAttendance = useMemo(() => {
    if (!activeEvent) return [];
    return attendanceData.filter(record => String(record.eventId) === String(activeEvent.id));
  }, [activeEvent, attendanceData]);

  const filteredAttendance = useMemo(() => {
    return currentAttendance.filter(item => 
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.office_college?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentAttendance, searchTerm]);

  const eventStats = useMemo(() => {
    const s = { Male: 0, Female: 0, Student: 0, Faculty: 0, Staff: 0, Visitor: 0 };
    currentAttendance.forEach(p => {
      if (p.sex === 'Male') s.Male++;
      if (p.sex === 'Female') s.Female++;
      if (s.hasOwnProperty(p.sector)) s[p.sector]++;
    });
    return s;
  }, [currentAttendance]);

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(currentAttendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${activeEvent.title}_Report.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Create Modal Code here... (Keep your existing modal code) */}

      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">GAD Event Manager</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <Plus size={16}/> Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <button 
            onClick={() => setActiveEvent(null)}
            className={`w-full p-4 rounded-2xl border text-left transition-all ${!activeEvent ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={16}/>
              <span className="text-[11px] font-black uppercase tracking-widest">General Overview</span>
            </div>
          </button>

          {events.map(event => (
            <div key={event.id} onClick={() => {setActiveEvent(event); setSelectedSession(event.sessions?.[0] || '');}} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeEvent?.id === event.id ? 'border-indigo-500 bg-indigo-50/30' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase truncate pr-2">{event.title}</h4>
                {event.status === 'Done' && <CheckCircle2 size={12} className="text-emerald-500"/>}
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{event.startDate}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {!activeEvent ? (
            <GeneralDashboard events={events} attendanceData={attendanceData} />
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">{activeEvent.title}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${activeEvent.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{activeEvent.status}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateEventStatus(activeEvent.id, activeEvent.status === 'Done' ? 'Active' : 'Done')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  {activeEvent.status === 'Done' ? 'Open Registration' : 'Mark as Done'}
                </button>
              </div>

              {/* QR and Local Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col items-center">
                  {activeEvent.status === 'Done' ? (
                    <div className="py-10 text-center text-slate-400 font-black text-[10px] uppercase"><Lock className="mx-auto mb-2" size={32}/> Registration Locked</div>
                  ) : (
                    <>
                      <select className="mb-4 w-full bg-slate-50 border rounded-xl p-2 text-[10px] font-black uppercase" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                        {activeEvent.sessions?.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <QRCodeSVG value={`${window.location.origin}/register?event=${activeEvent.id}&session=${selectedSession}`} size={140} />
                    </>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase text-center mb-2">Event Gender Split</h3>
                  <div className="flex justify-between p-3 bg-indigo-50 rounded-xl"><span className="text-[10px] font-black text-indigo-700 uppercase">Male</span><span className="font-black">{eventStats.Male}</span></div>
                  <div className="flex justify-between p-3 bg-pink-50 rounded-xl"><span className="text-[10px] font-black text-pink-700 uppercase">Female</span><span className="font-black">{eventStats.Female}</span></div>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="relative w-1/2">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={14} />
                    <input type="text" placeholder="Search attendees..." className="w-full bg-slate-50 border-none rounded-xl pl-9 py-2 text-xs font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={handleDownloadExcel} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Download size={16}/></button>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase sticky top-0">
                      <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Sector</th><th className="px-6 py-3">Sex</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredAttendance.map((user, i) => (
                        <tr key={i} className="text-xs font-bold text-slate-700 hover:bg-slate-50/50">
                          <td className="px-6 py-3">{user.fullName}</td>
                          <td className="px-6 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px]">{user.sector}</span></td>
                          <td className="px-6 py-3">{user.sex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}