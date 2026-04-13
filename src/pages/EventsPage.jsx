import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Calendar, Trash2, X, Search, Edit3, PlusSquare,
  BarChart3, PanelRightClose, PanelRight,
  CheckCircle2, DatabaseZap
} from 'lucide-react';
import { seedDemoData } from '../utils/seedDemoData';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { addEventSession } from '../../firebase/services';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import AttendanceTable from '../components/events/AttendanceTable';
import { SessionQRManager } from '../components/events/SessionQRManager';
import { EventAnalyticsDashboard } from '../components/events/EventsAnalytics';
import GeneralDashboard from '../components/events/GeneralPage';

const GAD_ATTRIBUTES = [
  'sex', 'age', 'home_address', 'email', 'phone', 'office_college',
  'department', 'designation', 'sector', 'pwd_status', 'ethnic_group',
  'employment_status', 'year_level', 'emergency_contact', 'id_number'
];

export default function EventsPage({
  events = [],
  attendance = [],
  onCreateEvent = () => {},
  onDeleteEvent = () => {},
  onUpdateEvent = () => {},
}) {
  const [activeEvent, setActiveEvent]     = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedSession, setSelectedSession] = useState('Pre-Registration');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [isEditing, setIsEditing]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [rightOpen, setRightOpen]         = useState(true);
  const [seeding, setSeeding]             = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '', description: '', status: 'Active',
    sessions: ['Day 1 Attendance'],
    hasPreReg: true,
    targetParticipants: '',
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true }
  });

  // Live attendance sync for selected event
  useEffect(() => {
    if (!activeEvent?.id) return;
    setLoading(true);
    const q = query(collection(db, 'attendance'), where('eventId', '==', String(activeEvent.id)));
    const unsub = onSnapshot(q, (snap) => {
      setAttendanceData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return unsub;
  }, [activeEvent?.id]);

  const handleSelectEvent = (event) => {
    setActiveEvent(event);
    if (event.hasPreReg)           setSelectedSession('Pre-Registration');
    else if (event.sessions?.length) setSelectedSession(event.sessions[0]);
    else                            setSelectedSession('General Attendance');
  };

  const handleAddGate = async () => {
    if (!newSessionInput.trim() || !activeEvent?.id) return;
    try {
      await addEventSession(activeEvent.id, newSessionInput.trim());
      const updated = { ...activeEvent, sessions: [...(activeEvent.sessions || []), newSessionInput.trim()] };
      setActiveEvent(updated);
      setSelectedSession(newSessionInput.trim());
      setNewSessionInput('');
      alert('Attendance gate created.');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggleAttribute = (id) =>
    setNewEvent(p => ({ ...p, formConfig: { ...p.formConfig, [id]: !p.formConfig?.[id] } }));

  const handleSelectAll = () => {
    const all = GAD_ATTRIBUTES.every(a => newEvent.formConfig?.[a]);
    const cfg = {};
    GAD_ATTRIBUTES.forEach(a => (cfg[a] = !all));
    setNewEvent(p => ({ ...p, formConfig: cfg }));
  };

  const openCreate = () => {
    setNewEvent({ title:'', description:'', status:'Active', sessions:['Day 1 Attendance'], hasPreReg:true,
      targetParticipants: '',
      formConfig:{ sex:true, office_college:true, pwd_status:true, sector:true } });
    setIsEditing(false);
    setShowCreateModal(true);
  };

  const filteredAttendance = useMemo(() => {
    if (!activeEvent) return [];
    return attendanceData.filter(r => {
      const sameEvent   = String(r.eventId) === String(activeEvent.id);
      const sameSession = String(r.session || r.session_name || '').trim() === String(selectedSession).trim();
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        r.fullName?.toLowerCase().includes(q) ||
        r.office_college?.toLowerCase().includes(q) ||
        r.id_number?.toLowerCase().includes(q);
      return sameEvent && sameSession && matchSearch;
    });
  }, [activeEvent, attendanceData, searchTerm, selectedSession]);

  // ─── Shared sidebar item style (mirrors left sidebar SideNavItem) ───────────
  const navItem = (active) =>
    `w-full flex items-center py-2 px-2 rounded-md transition-colors duration-150 gap-2.5 ${
      active
        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
    }`;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ══════════════════════════════════════════════
          CENTER — main content (scrollable)
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeEvent ? (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
            <GeneralDashboard events={events} attendanceData={attendance} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 pt-8 animate-in fade-in duration-300">

            {/* Event breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveEvent(null)}
                className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-gia-600 dark:hover:text-gia-400 transition-colors"
              >
                Overview
              </button>
              <span className="text-neutral-300 dark:text-neutral-700 text-xs">/</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-300 truncate">
                {activeEvent.title}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl h-32 border border-neutral-200 dark:border-neutral-700" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl h-20 border border-neutral-200 dark:border-neutral-700" />)}
                </div>
              </div>
            ) : (
              <>
                {/* Top row: QR left, stat cards right */}
                <div className="grid grid-cols-3 gap-6 items-stretch min-h-[320px]">
                  <div className="col-span-1 flex">
                    <SessionQRManager
                      activeEvent={activeEvent}
                      selectedSession={selectedSession}
                      onSessionChange={setSelectedSession}
                      registrationUrl={`${window.location.origin}/register/${activeEvent.id}?session=${encodeURIComponent(selectedSession)}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <EventAnalyticsDashboard
                      attendanceData={attendanceData}
                      filteredAttendance={filteredAttendance}
                      activeEvent={activeEvent}
                      selectedSession={selectedSession}
                      statsOnly={true}
                    />
                  </div>
                </div>

                {/* Full-width charts */}
                <EventAnalyticsDashboard
                  attendanceData={attendanceData}
                  filteredAttendance={filteredAttendance}
                  activeEvent={activeEvent}
                  selectedSession={selectedSession}
                  chartsOnly={true}
                />

                {/* Session tabs */}
                <div className="flex gap-2 flex-wrap">
                  {activeEvent.hasPreReg && (
                    <button onClick={() => setSelectedSession('Pre-Registration')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedSession === 'Pre-Registration'
                          ? 'bg-gia-600 text-white shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-gia-400'
                      }`}>Pre-Registration</button>
                  )}
                  {(activeEvent.sessions || []).map(s => (
                    <button key={s} onClick={() => setSelectedSession(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedSession === s
                          ? 'bg-gia-600 text-white shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-gia-400'
                      }`}>{s}</button>
                  ))}
                </div>

                {/* Search + table */}
                <div className="space-y-3">
                  <div className="relative group max-w-md">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-gia-500 transition-colors" />
                    <input type="text" placeholder={`Search in ${selectedSession}...`}
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-gia-500/10 focus:border-gia-500 outline-none shadow-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600" />
                  </div>
                  <AttendanceTable
                    title={`${selectedSession} Logs`}
                    data={filteredAttendance}
                    onExport={(rows) => {
                      if (!rows?.length) return alert('No records to export');
                      const ws = XLSX.utils.json_to_sheet(rows);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
                      XLSX.writeFile(wb, `${activeEvent.title}_${selectedSession}.xlsx`);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT SIDEBAR — mirrors left sidebar exactly
      ══════════════════════════════════════════════ */}
      <aside className={`
        shrink-0 flex flex-col
        bg-white dark:bg-neutral-900
        border-l border-neutral-200 dark:border-neutral-700/70
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${rightOpen ? 'w-56' : 'w-10'}
      `}>

        {/* ── Header (mirrors left sidebar header) ── */}
        <div className="flex items-center h-12 px-2 gap-2 border-b border-neutral-100 dark:border-neutral-700/60 shrink-0">
          {rightOpen ? (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-montserrat text-neutral-900 dark:text-neutral-100 font-semibold text-sm leading-none truncate">GAD Events</div>
                <div className="text-neutral-400 dark:text-neutral-500 text-[10px] font-normal mt-0.5 truncate">Attendance Tracker</div>
              </div>
              <button onClick={() => setRightOpen(false)} title="Collapse"
                className="shrink-0 p-1 text-neutral-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-md transition-all">
                <PanelRightClose size={15} />
              </button>
            </>
          ) : (
            <button onClick={() => setRightOpen(true)} title="Expand"
              className="p-1 text-neutral-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-md transition-all">
              <PanelRight size={15} />
            </button>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Nav items */}
          <nav className="px-1 py-3 space-y-1 shrink-0">

            {/* New Event — mirrors "New Chat" (gia purple) */}
            <button onClick={openCreate} title={!rightOpen ? 'New Event' : undefined}
              className={`w-full flex items-center py-2 px-2 rounded-md transition-colors duration-150 text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/20 ${rightOpen ? 'gap-2.5' : ''}`}>
              <Plus size={16} className="shrink-0" />
              {rightOpen && <span className="text-sm font-medium leading-none whitespace-nowrap">New Event</span>}
            </button>

            {/* Overview — mirrors "About" */}
            <button onClick={() => setActiveEvent(null)} title={!rightOpen ? 'Overview' : undefined}
              className={navItem(!activeEvent) + (rightOpen ? '' : ' justify-center')}>
              <BarChart3 size={16} className="shrink-0" />
              {rightOpen && <span className="text-sm font-medium leading-none whitespace-nowrap overflow-hidden">Overview</span>}
            </button>

          </nav>

          {/* Events list — mirrors "Recents" */}
          {rightOpen && (
            <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-100 dark:border-neutral-700/60">
              <div className="flex items-center px-3 py-2 shrink-0">
                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Events</span>
              </div>

              <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-0.5">
                {events.length === 0 ? (
                  <p className="text-neutral-400 dark:text-neutral-500 text-[10px] text-center py-4 px-3 leading-relaxed">
                    No events yet. Create one above!
                  </p>
                ) : events.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-100 group flex items-start gap-2 ${
                      activeEvent?.id === event.id
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <Calendar size={12} className="shrink-0 mt-0.5 opacity-40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal truncate leading-snug">{event.title}</p>
                      <p className="text-xs opacity-40 mt-0.5">{event.startDate || event.status}</p>
                    </div>
                    {/* Edit / Delete on hover — mirrors chat delete */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 flex gap-0.5 mt-0.5 transition-opacity">
                      <span
                        onClick={e => { e.stopPropagation(); setNewEvent(event); setIsEditing(true); setShowCreateModal(true); }}
                        className="p-0.5 hover:text-gia-500 transition-colors cursor-pointer"
                        title="Edit"
                      ><Edit3 size={10} /></span>
                      <span
                        onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${event.title}"?`)) onDeleteEvent(event.id, event.title); }}
                        className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete"
                      ><Trash2 size={10} /></span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Seed demo data — always visible */}
              <div className="shrink-0 px-2 py-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      await seedDemoData();
                      window.location.reload();
                    } catch (e) {
                      alert('Seed failed: ' + e.message);
                      setSeeding(false);
                    }
                  }}
                  disabled={seeding}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/20 disabled:opacity-40 transition-colors"
                >
                  <DatabaseZap size={11} />
                  {seeding ? 'Loading…' : 'Load Demo Data'}
                </button>
              </div>
            </div>
          )}

          {/* Collapsed dots for event list (when sidebar closed) */}
          {!rightOpen && events.length > 0 && (
            <div className="flex-1 flex flex-col items-center pt-3 gap-1.5 overflow-hidden">
              {events.slice(0, 8).map(event => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  title={event.title}
                  className={`w-5 h-5 rounded-full transition-all ${
                    activeEvent?.id === event.id
                      ? 'bg-gia-600'
                      : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-gia-300 dark:hover:bg-gia-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: Add Attendance Gate ── */}
        {activeEvent && (
          <div className="px-1 py-2 border-t border-neutral-100 dark:border-neutral-700/60 shrink-0 space-y-1">
            {rightOpen ? (
              <div className="px-2 space-y-1.5">
                <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Add Gate</p>
                <input type="text" placeholder="e.g. Day 2, Workshop..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:ring-1 focus:ring-gia-500 outline-none text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  value={newSessionInput}
                  onChange={e => setNewSessionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddGate()} />
                <button onClick={handleAddGate} disabled={!newSessionInput.trim()}
                  className="w-full py-1.5 bg-gia-600 hover:bg-gia-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                  <PlusSquare size={11} /> Create Gate
                </button>
              </div>
            ) : (
              <button onClick={() => setRightOpen(true)} title="Add Attendance Gate"
                className="w-full flex items-center justify-center py-2 text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/20 rounded-md transition-all">
                <PlusSquare size={16} />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════════════
          MODAL: Create / Edit Event
      ══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div>
                <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                  {isEditing ? 'Update GAD Event' : 'Initialize New GAD Event'}
                </h2>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">Configure event details and registration requirements</p>
              </div>
              <button onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); isEditing ? onUpdateEvent(newEvent.id, newEvent) : onCreateEvent(newEvent); setShowCreateModal(false); }}
              className="p-6 space-y-6 overflow-y-auto">

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">Event Title</label>
                  <input required placeholder="e.g., Annual Gender Sensitivity Training"
                    className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gia-500 font-medium"
                    value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">Description</label>
                  <textarea placeholder="Briefly explain the purpose of this GAD activity..."
                    className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gia-500 min-h-[80px] text-sm"
                    value={newEvent.description || ''} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">Start Date</label>
                    <input type="date" required
                      className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gia-500 text-sm font-medium"
                      value={newEvent.startDate || ''} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">End Date</label>
                    <input type="date" required
                      className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gia-500 text-sm font-medium"
                      value={newEvent.endDate || ''} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">Target Participants</label>
                  <input type="number" min="1" placeholder="e.g. 100"
                    className="w-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-gia-500 text-sm font-medium"
                    value={newEvent.targetParticipants || ''} onChange={e => setNewEvent({...newEvent, targetParticipants: e.target.value})} />
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Registration Attributes</h3>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium italic">Full Name and Timestamp are automatically included.</p>
                  </div>
                  <button type="button" onClick={handleSelectAll}
                    className="text-[10px] bg-gia-100 dark:bg-gia-900/30 text-gia-700 dark:text-gia-300 px-3 py-1 rounded-full font-bold hover:bg-gia-200 dark:hover:bg-gia-800/40 transition-colors">
                    {GAD_ATTRIBUTES.every(a => newEvent.formConfig?.[a]) ? 'CLEAR ALL' : 'SELECT ALL 15'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  {[
                    { id: 'sex', label: 'Sex/Gender' },
                    { id: 'age', label: 'Age' },
                    { id: 'home_address', label: 'Home Address' },
                    { id: 'email', label: 'Email Address' },
                    { id: 'phone', label: 'Phone Number' },
                    { id: 'office_college', label: 'College/Office' },
                    { id: 'department', label: 'Department' },
                    { id: 'designation', label: 'Designation' },
                    { id: 'sector', label: 'Sector (Solo Parent, etc.)' },
                    { id: 'pwd_status', label: 'PWD Status' },
                    { id: 'ethnic_group', label: 'Ethnic Group' },
                    { id: 'employment_status', label: 'Employment Status' },
                    { id: 'year_level', label: 'Year Level (Students)' },
                    { id: 'emergency_contact', label: 'Emergency Contact' },
                    { id: 'id_number', label: 'ID Number (Student/Emp)' },
                  ].map(attr => (
                    <label key={attr.id} className="flex items-center gap-3 group cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-gia-600 focus:ring-gia-500"
                        checked={newEvent.formConfig?.[attr.id] || false} onChange={() => handleToggleAttribute(attr.id)} />
                      <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 group-hover:text-gia-600 dark:group-hover:text-gia-400 transition-colors">
                        {attr.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 sticky bottom-0 bg-white dark:bg-neutral-900">
                <button type="submit"
                  className="w-full bg-neutral-900 dark:bg-neutral-800 hover:bg-gia-600 dark:hover:bg-gia-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                  {isEditing ? <Edit3 size={18}/> : <PlusSquare size={18}/>}
                  {isEditing ? 'Confirm Changes' : 'Launch GAD Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
