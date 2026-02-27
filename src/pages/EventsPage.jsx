import React, { useState, useMemo } from 'react';
import { 
  Plus, Calendar, QrCode, Users, BarChart3, 
  Trash2, ExternalLink, ChevronRight, Download, CheckCircle2, X,
  UserCircle, School, Briefcase, Footprints, Building, Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function EventsPage({ events = [], attendanceData = [], onCreateEvent, onDeleteEvent }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filter attendance for selected event
  const currentAttendance = useMemo(() => {
    if (!activeEvent) return [];
    return attendanceData.filter(record => String(record.eventId) === String(activeEvent.id));
  }, [activeEvent, attendanceData]);

  // 2. Filter attendance based on Search Term (Name or College)
  const filteredAttendance = useMemo(() => {
    return currentAttendance.filter(item => 
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.office_college && item.office_college.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentAttendance, searchTerm]);

  // 3. Export Logic (Now includes Office/College)
  const handleDownloadExcel = () => {
    if (currentAttendance.length === 0) {
      alert("No data to export!");
      return;
    }

    const dataToExport = currentAttendance.map(item => ({
      'Full Name': item.fullName,
      'ID Number': item.idNumber || 'N/A',
      'Sex': item.sex,
      'Sector': item.sector,
      'College/Office': item.office_college || 'N/A', // Added this
      'Timestamp': item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    const fileName = `${activeEvent.title.replace(/\s+/g, '_')}_Attendance.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const analytics = useMemo(() => {
    const stats = { Male: 0, Female: 0, Student: 0, Faculty: 0, Staff: 0, Visitor: 0 };
    currentAttendance.forEach(person => {
      if (person.sex === 'Male') stats.Male++;
      if (person.sex === 'Female') stats.Female++;
      if (stats.hasOwnProperty(person.sector)) stats[person.sector]++;
    });
    return stats;
  }, [currentAttendance]);

  const genderData = [
    { name: 'Male', value: analytics.Male, fill: '#6366f1' },
    { name: 'Female', value: analytics.Female, fill: '#ec4899' },
  ];

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    onCreateEvent({ ...newEvent, id: Date.now().toString() });
    setNewEvent({ title: '', date: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* --- CREATE MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 uppercase">New GAD Event</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Event Title</label>
                <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Women's Month 2024" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Event Date</label>
                <input required type="date" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all">Confirm & Create</button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Event Manager</h1>
          <p className="text-slate-500 font-medium text-sm">Monitor real-time attendance and sector participation.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
          <Plus size={18} /> Create New Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Event List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recent Events</h3>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {events.map(event => (
              <div key={event.id} onClick={() => {setActiveEvent(event); setSearchTerm('');}} className={`group p-5 rounded-[24px] border transition-all cursor-pointer ${activeEvent?.id === event.id ? 'bg-white border-purple-500 shadow-md ring-1 ring-purple-100' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${activeEvent?.id === event.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Calendar size={16} /></div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
                <h4 className="font-bold text-slate-900 leading-tight">{event.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">{event.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Insights & Data */}
        <div className="lg:col-span-8 space-y-6">
          {activeEvent ? (
            <>
              {/* Sector Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<School size={16}/>} label="Students" count={analytics.Student} color="text-blue-600" />
                <StatCard icon={<Briefcase size={16}/>} label="Faculty" count={analytics.Faculty} color="text-purple-600" />
                <StatCard icon={<UserCircle size={16}/>} label="Staff" count={analytics.Staff} color="text-orange-600" />
                <StatCard icon={<Footprints size={16}/>} label="Visitors" count={analytics.Visitor} color="text-emerald-600" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="p-4 bg-slate-50 rounded-[24px] mb-4 border border-slate-100">
                    <QRCodeSVG value={`${window.location.origin}/?event=${activeEvent.id}`} size={120} level="H" />
                  </div>
                  <h4 className="font-black text-xs uppercase text-slate-900 mb-1">Registration QR</h4>
                  <button onClick={() => window.open(`/?event=${activeEvent.id}`, '_blank')} className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 hover:text-purple-700">
                    <ExternalLink size={14} /> Open Form
                  </button>
                </div>

                {/* Gender Chart */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4 text-center">Sex Distribution</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genderData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Participants Table Container */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest">Participants List ({currentAttendance.length})</h3>
                    <button 
                      onClick={handleDownloadExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      <Download size={14} /> Export XLSX
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-4 top-3 text-slate-300" size={16} />
                    <input 
                      type="text"
                      placeholder="Search by name or college..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Sector</th>
                        <th className="px-6 py-4">College/Office</th>
                        <th className="px-6 py-4">Sex</th>
                        <th className="px-6 py-4">ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredAttendance.map((user, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{user.fullName}</td>
                          <td className="px-6 py-4"><span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 rounded-full uppercase tracking-tighter">{user.sector}</span></td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold italic">{user.office_college || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.sex}</td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">{user.idNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAttendance.length === 0 && (
                    <div className="py-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching records found</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-dashed border-slate-200">
              <ChevronRight className="text-slate-300 mb-4" size={32} />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Select an event to view dashboard</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, count, color }) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
      <div className={`p-2 rounded-lg bg-slate-50 inline-block mb-3 ${color}`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{count}</p>
    </div>
  );
}