import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Calendar, BarChart3, Trash2,
  CheckCircle2, X, Search, Edit3, PlusSquare,
  Users
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import {
  addEventSession
} from '../../firebase/services';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import AttendanceTable from '../components/events/AttendanceTable';
import { SessionQRManager } from '../components/events/SessionQRManager';

const GAD_ATTRIBUTES = [
  'sex', 'age', 'home_address', 'email', 'phone', 'office_college', 
  'department', 'designation', 'sector', 'pwd_status', 'ethnic_group', 
  'employment_status', 'year_level', 'emergency_contact', 'id_number'
];

export default function EventsPage({ 
  events = [], 
  onCreateEvent = () => {},
  onDeleteEvent = () => {},
  onUpdateEvent = () => {},
  onBulkUpload = () => {}
}) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedSession, setSelectedSession] = useState('Pre-Registration');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  
  const [newEvent, setNewEvent] = useState({ 
    title: '', description: '', status: 'Active',
    sessions: ['Day 1 Attendance'],
    hasPreReg: true,
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true }
  });

 
  useEffect(() => {
    if (!activeEvent?.id) return;
    console.log("Listening for Event ID:", activeEvent.id);

    setLoading(true)
    const q = query(
      collection(db, "attendance"), 
      where("eventId", "==", String(activeEvent.id))
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setAttendanceData(logs); 
      setLoading(false);
    }, (err) => {
      console.error("Firebase Sync Error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeEvent?.id]);

  const filteredData = allLogs.filter(log => log.session_name === selectedSession);

  const handleAddNewSession = async () => {
  if (!newSessionInput.trim()) return;

  console.log("DEBUG: Target Event ID ->", activeEvent?.id);
  console.log("DEBUG: New Session Name ->", newSessionInput.trim());
  
  try {
    if (!activeEvent?.id) throw new Error ("No Active Event ID found!");
    await addEventSession(activeEvent.id, newSessionInput.trim());
    
    const sessionName = newSessionInput.trim();
    const updated = {
      ...activeEvent,
      sessions: [...(activeEvent.sessions || []), sessionName]
    };

    setActiveEvent(updated);
    setSelectedSession(newSessionInput.trim());
    setNewSessionInput("");
    alert("New session has been created.");
    setShowActionMenu(false);

    console.log("SUCCESS: Session added to Firestore.");
  } catch (err) {
    console.error("FIREBASE ERROR DETAILS:", err);
    console.error("ERROR CODE:", err.code);
    alert(`Error: ${err.message || "Database connection failed"}`);
  }
};

  const handleToggleAttribute = (attrId) => {
  setNewEvent(prev => ({
    ...prev,
    formConfig: {
      ...prev.formConfig,
      [attrId]: !prev.formConfig?.[attrId]
    }
  }));
};

  const handleEventSelect = (event) => {
    setActiveEvent(event);
    // Auto-set the first available session
    if (event.hasPreReg) {
      setSelectedSession('Pre-Registration');
    } else if (event.sessions?.length > 0) {
      setSelectedSession(event.sessions[0]);
    } else {
      setSelectedSession('General Attendance');
    }
};

  const handleExport = () => {
    if (filteredAttendance.length === 0) return alert("No records to export");

    const ws = XLSX.utils.json_to_sheet(filteredAttendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${activeEvent?.title || 'Event'}_${selectedSession}.xlsx`);
};

const handleSelectAll = () => {
  const currentConfig = newEvent.formConfig || {};
  const isAllSelected = GAD_ATTRIBUTES.every(attr => currentConfig[attr]);
  
  const newConfig = {};
  GAD_ATTRIBUTES.forEach(attr => {
    newConfig[attr] = !isAllSelected;
  });

  setNewEvent(prev => ({ 
    ...prev, 
    formConfig: newConfig 
  }));
};

const filteredAttendance = useMemo(() => {
    if (!activeEvent) return [];

    return attendanceData.filter(record => {
      const isSameEvent = String(record.eventId) === String(activeEvent.id);
      const matchesSession = String(record.session || record.session_name || "").trim() === String(selectedSession || "").trim();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        record.fullName?.toLowerCase().includes(searchLower) ||
        record.office_college?.toLowerCase().includes(searchLower) ||
        record.id_number?.toLowerCase().includes(searchLower);

        if (isSameEvent && !matchesSession) {
          console.log(`Event Match! But Session Mismatch: Record has "${record.session_name}" but UI is looking for "${selectedSession}"`);
        }

      return isSameEvent && matchesSession && matchesSearch;
    });
  }, [activeEvent, attendanceData, searchTerm, selectedSession]);

  if (loading && activeEvent) {
  return (
    <div className="col-span-12 lg:col-span-9 p-20 text-center">
       <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
       <p className="font-black text-slate-300 uppercase tracking-widest">Loading Records...</p>
    </div>
  );
};

  const registrationUrl = activeEvent ? `${window.location.origin}/register/${activeEvent.id}?session=${encodeURIComponent(selectedSession)}` : '';

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* MODAL: CREATE/EDIT */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">
                    {isEditing ? 'Update GAD Event' : 'Initialize New GAD Event'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Configure event details and registration requirements</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20}/>
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (isEditing) {
                    onUpdateEvent(newEvent.id, newEvent);
                  } else {
                    onCreateEvent(newEvent);
                  }
                  
                  setShowCreateModal(false);
                }} 
                className="p-6 space-y-6 overflow-y-auto"
              >
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Event Title</label>
                    <input 
                      required 
                      placeholder="e.g., Annual Gender Sensitivity Training"
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                      value={newEvent.title} 
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Description</label>
                    <textarea 
                      placeholder="Briefly explain the purpose of this GAD activity..."
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm" 
                      value={newEvent.description || ''} 
                      onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Start Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        value={newEvent.startDate || ''} 
                        onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">End Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        value={newEvent.endDate || ''} 
                        onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                {/* Attribute Selection Section */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Registration Attributes</h3>
                      <p className="text-[10px] text-slate-500 font-medium italic">Full Name and Timestamp are automatically included.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleSelectAll} 
                      className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                    >
                      {GAD_ATTRIBUTES.every(attr => newEvent.formConfig?.[attr]) ? 'CLEAR ALL' : 'SELECT ALL 15'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-2 border-t border-slate-200">
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
                    ].map((attr) => (
                      <label key={attr.id} className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            checked={newEvent.formConfig?.[attr.id] || false} 
                            onChange={() => handleToggleAttribute(attr.id)}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                          {attr.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 sticky bottom-0 bg-white">
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isEditing ? <Edit3 size={18}/> : <PlusSquare size={18}/>}
                    {isEditing ? 'Confirm Changes' : 'Launch GAD Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200"><Calendar size={24}/></div>
                    <div>
                      {/* The Title: Switches between "Global Overview" and "Event Title" */}
                      <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight transition-all duration-300">
                        {activeEvent ? activeEvent.title : "Global Overview"}
                      </h1>

                      {/* The Subtitle: Switches between fixed text and "Event Description" */}
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest transition-all duration-300">
                        {activeEvent 
                          ? (activeEvent.description || "No description provided") 
                          : "Registrations & Attendance"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {setNewEvent({title:'', sessions:['Day 1 Attendance'], hasPreReg:true, 
                      formConfig:{sex:true, office_college:true, pwd_status: true, sector: true}}); 
                    setIsEditing(false); setShowCreateModal(true);}}
                    className="w-full md:w-auto bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={18} /> New Event
                  </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SIDEBAR */}
      <div className="col-span-12 lg:col-span-3 space-y-3">
        {/* Global Overview Button */}
        <button 
          onClick={() => setActiveEvent(null)}
          className={`w-full p-4 rounded-xl border font-bold text-left flex items-center gap-3 transition-all ${!activeEvent ? 'bg-slate-900 text-white shadow-lg' : 'bg-white hover:bg-slate-50'}`}
        >
          <BarChart3 size={18} /> Global Overview
        </button>

        <div className="h-px bg-slate-200 my-2" />

        {/* Event List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {events.map(event => (
            <div 
              key={event.id}
              onClick={() => setActiveEvent(event)}
              className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                activeEvent?.id === event.id 
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                  : 'bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start relative">
                <p className="font-bold text-sm text-slate-800 truncate pr-8">
                  {event.title}
                </p>
                
                {/* The "Actions" Container */}
                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewEvent(event);
                      setIsEditing(true);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-indigo-600 transition-all"
                    title="Edit Event"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event.id, event.title);
                    }}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-rose-600 transition-all"
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>    
                </div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] text-slate-400 font-black uppercase">
                  {event.status}
                </span>
                {event.status === 'Done' && <CheckCircle2 size={12} className="text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>


        {/* NEW: QUICK ADD SESSION (Only shows when an event is selected) */}
        {activeEvent && (
          <div className="pt-4 border-t border-slate-200 mt-4 animate-in fade-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
              Add Attendance Gate
            </label>
            <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <input 
                type="text" 
                placeholder="e.g. Day 2, Workshop..." 
                className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                value={newSessionInput}
                onChange={(e) => setNewSessionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewSession()}
              />
              <button 
                onClick={handleAddNewSession}
                disabled={!newSessionInput.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <PlusSquare size={14} /> Create Session
              </button>
            </div>
          </div>
        )}
      </div>

        {/* MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-9">
          {!activeEvent ? (
            <div className="bg-white border-2 border-dashed rounded-[40px] p-32 text-center border-slate-200">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Users size={48} />
              </div>
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">
                Select an event to view dashboard
              </h2>
              <p className="text-slate-400 text-sm mt-2 font-medium">Choose from the sidebar to manage sessions and attendance.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* 1. SESSION & QR MANAGER */}
              <div className="relative">
                <SessionQRManager 
                  activeEvent={activeEvent}
                  selectedSession={selectedSession}
                  onSessionChange={(newSession) => setSelectedSession(newSession)}
                  registrationUrl={`${window.location.origin}/register/${activeEvent.id}?session=${encodeURIComponent(selectedSession)}`}
                />
                
              </div>

              {/* 2. DATA TABLE SECTION */}
              <div className="space-y-4">
                {/* Search Bar (Functional filtering handled here) */}
                <div className="relative group max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder={`Search in ${selectedSession}...`} 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* CUSTOM MODULAR TABLE */}
                <AttendanceTable 
                  title={`${selectedSession} Logs`} 
                  data={filteredAttendance} 
                  onExport={() => {
                    const cleanData = filteredAttendance.map(({ eventId, session, ...rest }) => rest);
                    
                    const ws = XLSX.utils.json_to_sheet(cleanData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                    XLSX.writeFile(wb, `${activeEvent.name}_${selectedSession}.xlsx`);
                  }}
                />
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}