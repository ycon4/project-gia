import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Search, Edit3, Download,
  BarChart3, PanelRightClose, PanelRight, DatabaseZap, PlusSquare,
  MapPin, Monitor, Users, Tag, CalendarDays, FileText, Wifi,
  UserCircle, Wallet, Building, FileCheck, Target, StickyNote, BookOpen,
  ClipboardList,
} from 'lucide-react';
import { seedDemoData } from '../utils/seedDemoData';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { addEventSession, getAllDocuments, submitEvent, withdrawEvent, createEventWithSubmissionStatus } from '../../firebase/services';
import { db, auth } from '../../firebase/config';
import AttendanceTable from '../components/events/AttendanceTable';
import { SessionQRManager } from '../components/events/SessionQRManager';
import EventAnalyticsDashboard from '../components/events/EventsAnalytics';
import GeneralDashboard from '../components/events/GeneralPage';
import EventFormModal from '../components/events/EventFormModal';
import EventPosterGenerator from '../components/events/EventPosterGenerator';
import EventReportExporter from '../components/events/EventReportExporter';
import { useRole, Permission } from '../contexts/RoleContext.jsx';

// ─── Event info panel helpers ─────────────────────────────────────────────────

/** Single metadata row: icon + label + value */
function MetaItem({ icon: Icon, label, value, span = false }) {
  return (
    <div className={`flex items-start gap-2 ${span ? 'col-span-2' : ''}`}>
      <Icon size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">{label}</p>
        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}

/** Text block with icon label */
function InfoBlock({ icon: Icon, label, children }) {
  return (
    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">{label}</p>
      </div>
      {children}
    </div>
  );
}

/** Format a Firestore Timestamp or ISO string to a relative/absolute label */
function formatTs(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EventsPage({
  onCreateEvent = () => { },
  onDeleteEvent = () => { },
  onUpdateEvent = () => { },
}) {
  const { role, hasPermission, filterEventsByRole, canModifyEvent, canDeleteEvent, canSubmitEvent } = useRole();
  const user = auth.currentUser;

  // Local state for events and attendance - loaded from Firestore
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [activeEvent, setActiveEvent] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedSession, setSelectedSession] = useState('Pre-Registration');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newSessionInput, setNewSessionInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showPosterGenerator, setShowPosterGenerator] = useState(false);
  const [showReportExporter, setShowReportExporter] = useState(false);

  // Load events and attendance data when component mounts
  useEffect(() => {
    const loadEventsData = async () => {
      setLoadingEvents(true);
      try {
        const [eventsData, attendanceData] = await Promise.all([
          getAllDocuments('events'),
          getAllDocuments('attendance'),
        ]);
        setEvents(eventsData);
        setAttendance(attendanceData);
      } catch (error) {
        console.error('Error loading events data:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEventsData();
  }, []);

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
    if (event.hasPreReg) setSelectedSession('Pre-Registration');
    else if (event.sessions?.length) setSelectedSession(event.sessions[0]);
    else setSelectedSession('General Attendance');
  };

  const handleAddGate = async () => {
    const gateName = newSessionInput.trim().replace(/\s+/g, ' ');
    if (!gateName || !activeEvent?.id) return;

    // Prevent duplicate gate names
    const existing = [
      ...(activeEvent.hasPreReg ? ['Pre-Registration'] : []),
      ...(activeEvent.sessions || []),
    ];
    if (existing.some(s => s.toLowerCase() === gateName.toLowerCase())) {
      alert(`A gate named "${gateName}" already exists.`);
      return;
    }

    try {
      await addEventSession(activeEvent.id, gateName);
      const updated = {
        ...activeEvent,
        sessions: [...(activeEvent.sessions || []), gateName],
      };
      // Sync both local view state AND the parent events list in App.jsx
      setActiveEvent(updated);
      setSelectedSession(gateName);
      setNewSessionInput('');
      onUpdateEvent(activeEvent.id, updated);
    } catch (err) {
      alert(`Error creating gate: ${err.message}`);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setIsEditing(false);
    setShowCreateModal(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (formData) => {
    if (isEditing && editingEvent?.id) {
      // Update existing event
      await onUpdateEvent(editingEvent.id, formData);
      // Update local state
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...formData, id: editingEvent.id } : ev));
      if (activeEvent?.id === editingEvent.id) {
        setActiveEvent({ ...formData, id: editingEvent.id });
      }
    } else {
      // Create new event with proper submission status
      try {
        const eventId = await createEventWithSubmissionStatus(formData, user.uid, role);
        const newEvent = { ...formData, id: eventId, createdBy: user.uid };
        setEvents(prev => [newEvent, ...prev]);
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Error creating event. Please try again.');
      }
    }
  };

  // Handle event submission (draft -> submitted)
  const handleSubmitEvent = async (event) => {
    if (!canSubmitEvent(event.createdBy)) return;

    try {
      await submitEvent(event.id, user.uid);
      // Update local state
      setEvents(prev => prev.map(ev =>
        ev.id === event.id
          ? { ...ev, submissionStatus: 'submitted', submittedAt: new Date().toISOString(), submittedBy: user.uid }
          : ev
      ));
      if (activeEvent?.id === event.id) {
        setActiveEvent(prev => ({
          ...prev,
          submissionStatus: 'submitted',
          submittedAt: new Date().toISOString(),
          submittedBy: user.uid
        }));
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('Error submitting event. Please try again.');
    }
  };

  // Handle event withdrawal (submitted -> draft)
  const handleWithdrawEvent = async (event) => {
    if (!canSubmitEvent(event.createdBy)) return;

    try {
      await withdrawEvent(event.id);
      // Update local state
      setEvents(prev => prev.map(ev =>
        ev.id === event.id
          ? { ...ev, submissionStatus: 'draft', submittedAt: null, submittedBy: null }
          : ev
      ));
      if (activeEvent?.id === event.id) {
        setActiveEvent(prev => ({
          ...prev,
          submissionStatus: 'draft',
          submittedAt: null,
          submittedBy: null
        }));
      }
    } catch (error) {
      console.error('Error withdrawing event:', error);
      alert('Error withdrawing event. Please try again.');
    }
  };

  // Filter events based on user role and sort by newest first
  const visibleEvents = useMemo(() => {
    const filtered = filterEventsByRole(events);
    // Sort by createdAt timestamp, newest first
    return filtered.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
      return timeB - timeA; // Descending order (newest first)
    });
  }, [events, filterEventsByRole]);

  // Normalize session name for matching — trims and collapses internal whitespace
  const normSession = (s) => String(s || '').trim().replace(/\s+/g, ' ');

  const filteredAttendance = useMemo(() => {
    if (!activeEvent) return [];
    // attendanceData is already scoped to activeEvent.id via the onSnapshot query,
    // so no need to re-check eventId here.
    return attendanceData.filter(r => {
      const sameSession = normSession(r.session_name || r.session) === normSession(selectedSession);
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        r.fullName?.toLowerCase().includes(q) ||
        r.office_college?.toLowerCase().includes(q) ||
        r.id_number?.toLowerCase().includes(q);
      return sameSession && matchSearch;
    });
  }, [activeEvent, attendanceData, searchTerm, selectedSession]);

  // ─── Shared sidebar item style (mirrors left sidebar SideNavItem) ───────────
  const navItem = (active) =>
    `w-full flex items-center py-2 px-2 rounded-md transition-colors duration-150 gap-2.5 ${active
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
                {/* Main grid: Left column (QR + Stats stacked), Right column (Event Details) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">

                  {/* Left Column: QR Manager + Stats Cards Stacked */}
                  <div className="col-span-1 space-y-4">
                    {/* QR Manager */}
                    <SessionQRManager
                      activeEvent={activeEvent}
                      selectedSession={selectedSession}
                      onSessionChange={setSelectedSession}
                      registrationUrl={`${window.location.origin}/register/${activeEvent.id}?session=${encodeURIComponent(selectedSession)}`}
                    />
                  </div>

                  {/* Right Column: Event Details Panel */}
                  <div className="col-span-2 flex flex-col">
                    {/* 🌟 FIXED HEIGHT COMPONENT FRAME — Matched to SessionQR height */}
                    <div className="h-[550px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/70 rounded-2xl overflow-hidden flex flex-col shadow-sm">

                      {/* Panel header — Stays sticky/immobile at the top */}
                      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Event Details</p>
                          <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 leading-snug truncate">{activeEvent.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Event Status Badge */}
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${activeEvent.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            : activeEvent.status === 'Cancelled'
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                            }`}>{activeEvent.status || 'Active'}</span>

                          {/* Submission Status Badge */}
                          {role === 'SECRETARIAT' && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${(activeEvent.submissionStatus === 'submitted' || !activeEvent.submissionStatus)
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                              }`}>
                              {(activeEvent.submissionStatus === 'submitted' || !activeEvent.submissionStatus) ? 'Submitted' : 'Draft'}
                            </span>
                          )}

                          {/* Submit/Withdraw Buttons for Secretariat */}
                          {canSubmitEvent(activeEvent.createdBy) && (
                            <>
                              {activeEvent.submissionStatus === 'draft' ? (
                                <button
                                  onClick={() => handleSubmitEvent(activeEvent)}
                                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  title="Submit for admin review"
                                >
                                  Submit
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleWithdrawEvent(activeEvent)}
                                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                  title="Withdraw to draft"
                                >
                                  Withdraw
                                </button>
                              )}
                            </>
                          )}

                          {/* Action Buttons */}
                          <button onClick={() => {
                            console.log('Export report button clicked');
                            setShowReportExporter(true);
                          }}
                            className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/20 transition-colors"
                            title="Export report"><FileText size={13} /></button>
                          <button onClick={() => setShowPosterGenerator(true)}
                            className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/20 transition-colors"
                            title="Download poster"><Download size={13} /></button>
                          {canModifyEvent(activeEvent.createdBy) && (
                            <button onClick={() => openEdit(activeEvent)}
                              className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/20 transition-colors"
                              title="Edit event"><Edit3 size={13} /></button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable body — Content shifts fluidly within this window only */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0 custom-scrollbar">

                        {/* Core metadata */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {activeEvent.createdByName && <MetaItem icon={UserCircle} label="Created By" value={activeEvent.createdByName} span />}
                          {activeEvent.eventType && <MetaItem icon={Tag} label="Type" value={activeEvent.eventType} />}
                          {activeEvent.mode && <MetaItem icon={activeEvent.mode === 'Online' ? Wifi : Monitor} label="Mode" value={activeEvent.mode} />}
                          {activeEvent.venue && <MetaItem icon={MapPin} label={activeEvent.mode === 'Online' ? 'Platform' : 'Venue'} value={activeEvent.venue} span />}
                          {(activeEvent.startDate || activeEvent.endDate) && (
                            <MetaItem icon={CalendarDays} label="Date" span value={[
                              activeEvent.startDate && new Date(activeEvent.startDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
                              activeEvent.endDate && activeEvent.endDate !== activeEvent.startDate
                                ? new Date(activeEvent.endDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                : null,
                            ].filter(Boolean).join(' — ')} />
                          )}
                          {activeEvent.targetParticipants && <MetaItem icon={Users} label="Target Pax" value={`${Number(activeEvent.targetParticipants).toLocaleString()} participants`} />}
                          <MetaItem icon={CalendarDays} label="Gates" value={`${(activeEvent.hasPreReg ? 1 : 0) + (activeEvent.sessions?.length || 0)} session${((activeEvent.hasPreReg ? 1 : 0) + (activeEvent.sessions?.length || 0)) !== 1 ? 's' : ''}`} />
                          {activeEvent.targetGroup && <MetaItem icon={Target} label="Target Group" value={activeEvent.targetGroup} span />}
                          {activeEvent.organizer && <MetaItem icon={UserCircle} label="Organizer" value={activeEvent.organizer} span />}
                        </div>

                        {/* Description */}
                        {activeEvent.description && (
                          <InfoBlock icon={FileText} label="Description">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">{activeEvent.description}</p>
                          </InfoBlock>
                        )}

                        {/* Objectives */}
                        {activeEvent.objectives && (
                          <InfoBlock icon={Target} label="Objectives / Expected Output">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">{activeEvent.objectives}</p>
                          </InfoBlock>
                        )}

                        {/* GAD Planning */}
                        {(activeEvent.budget || activeEvent.fundingSource || activeEvent.partnerAgencies || activeEvent.gadMandate) && (
                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                              <BookOpen size={10} /> GAD Planning
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              {activeEvent.budget && <MetaItem icon={Wallet} label="Budget" value={`₱${Number(activeEvent.budget).toLocaleString()}`} />}
                              {activeEvent.fundingSource && <MetaItem icon={Building} label="Funding Source" value={activeEvent.fundingSource} />}
                              {activeEvent.partnerAgencies && <MetaItem icon={Building} label="Partner Agencies" value={activeEvent.partnerAgencies} span />}
                              {activeEvent.gadMandate && <MetaItem icon={FileCheck} label="GAD Mandate" value={activeEvent.gadMandate} span />}
                            </div>
                          </div>
                        )}

                        {/* Accomplishment Notes */}
                        {activeEvent.accomplishmentNotes && (
                          <InfoBlock icon={StickyNote} label="Accomplishment Notes">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">{activeEvent.accomplishmentNotes}</p>
                          </InfoBlock>
                        )}

                        {/* Form config summary */}
                        {activeEvent.formConfig && Object.values(activeEvent.formConfig).some(Boolean) && (
                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                              <ClipboardList size={10} /> Collecting from participants
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {['Full Name', 'Sex / Gender'].map(f => (
                                <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gia-50 dark:bg-gia-950/20 text-gia-600 dark:text-gia-400 border border-gia-200/60 dark:border-gia-800/40">{f}</span>
                              ))}
                              {[
                                { id: 'age', label: 'Age' }, { id: 'home_address', label: 'Address' },
                                { id: 'id_number', label: 'ID No.' }, { id: 'email', label: 'Email' },
                                { id: 'phone', label: 'Phone' }, { id: 'emergency_contact', label: 'Emergency Contact' },
                                { id: 'office_college', label: 'College / Office' }, { id: 'department', label: 'Department' },
                                { id: 'designation', label: 'Designation' }, { id: 'sector', label: 'Sector' },
                                { id: 'year_level', label: 'Year Level' }, { id: 'pwd_status', label: 'PWD Status' },
                                { id: 'ethnic_group', label: 'Ethnic Group' }, { id: 'employment_status', label: 'Employment' },
                              ].filter(f => activeEvent.formConfig[f.id]).map(f => (
                                <span key={f.id} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">{f.label}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamps */}
                        {(activeEvent.createdAt || activeEvent.updatedAt) && (
                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
                            {activeEvent.createdAt && (
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-medium">Created {formatTs(activeEvent.createdAt)}</p>
                            )}
                            {activeEvent.updatedAt && (
                              <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-medium">Updated {formatTs(activeEvent.updatedAt)}</p>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
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

                {/* Session tabs — each shows a live count badge so mismatches are immediately visible */}
                <div className="flex gap-2 flex-wrap">
                  {activeEvent.hasPreReg && (() => {
                    const count = attendanceData.filter(
                      r => normSession(r.session_name || r.session) === 'Pre-Registration'
                    ).length;
                    const active = selectedSession === 'Pre-Registration';
                    return (
                      <button
                        onClick={() => setSelectedSession('Pre-Registration')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${active
                          ? 'bg-gia-600 text-white shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-gia-400'
                          }`}
                      >
                        Pre-Registration
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                          }`}>{count}</span>
                      </button>
                    );
                  })()}
                  {(activeEvent.sessions || []).map(s => {
                    const count = attendanceData.filter(
                      r => normSession(r.session_name || r.session) === normSession(s)
                    ).length;
                    const active = selectedSession === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSession(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${active
                          ? 'bg-gia-600 text-white shadow-sm'
                          : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-gia-400'
                          }`}
                      >
                        {s}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${active ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                          }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search + table */}
                <div className="space-y-6">
                  <div className="relative group max-w-md">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-gia-500 transition-colors" />
                    <input type="text" placeholder={`Search in ${selectedSession}...`}
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-gia-500/10 focus:border-gia-500 outline-none shadow-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600" />
                  </div>
                  <AttendanceTable
                    title={`${selectedSession} Logs`}
                    data={filteredAttendance}
                    event={activeEvent}
                    sessions={activeEvent?.sessions || ['Morning', 'Afternoon']}
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
            {hasPermission(Permission.EVENT_CREATE) && (
              <button onClick={openCreate} title={!rightOpen ? 'New Event' : undefined}
                className={`w-full flex items-center py-2 px-2 rounded-md transition-colors duration-150 text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/20 ${rightOpen ? 'gap-2.5' : ''}`}>
                <Plus size={16} className="shrink-0" />
                {rightOpen && <span className="text-sm font-medium leading-none whitespace-nowrap">New Event</span>}
              </button>
            )}

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
                {visibleEvents.length === 0 ? (
                  <p className="text-neutral-400 dark:text-neutral-500 text-[10px] text-center py-4 px-3 leading-relaxed">
                    No events yet. Create one above!
                  </p>
                ) : visibleEvents.map(event => {
                  // Determine status dot color
                  const statusColor = event.status === 'Active'
                    ? 'bg-emerald-400'
                    : event.status === 'Cancelled'
                      ? 'bg-rose-400'
                      : 'bg-neutral-400'; // Done

                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-100 group flex items-start gap-2 ${activeEvent?.id === event.id
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                        }`}
                    >
                      {/* Status Dot */}
                      <div className="shrink-0 mt-1.5">
                        <div className={`w-2 h-2 rounded-full ${statusColor}`} title={event.status || 'Active'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-normal truncate leading-snug">{event.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs opacity-40">{event.startDate || event.status}</p>

                          {/* Submission Status for Secretariat */}
                          {role === 'SECRETARIAT' && (
                            <>
                              <span className="text-xs opacity-20">•</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${(event.submissionStatus === 'submitted' || !event.submissionStatus)
                                ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                                : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                                }`}>
                                {(event.submissionStatus === 'submitted' || !event.submissionStatus) ? 'Submitted' : 'Draft'}
                              </span>
                            </>
                          )}

                          {event.createdByName && role !== 'USER' && (
                            <>
                              <span className="text-xs opacity-20">•</span>
                              <p className="text-[10px] opacity-30 truncate" title={`Created by ${event.createdByName}`}>
                                {event.createdByName}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit / Delete on hover — only show if user can modify */}
                      {(canModifyEvent(event.createdBy) || canDeleteEvent(event.createdBy)) && (
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 flex gap-0.5 mt-0.5 transition-opacity">
                          {canModifyEvent(event.createdBy) && (
                            <span
                              onClick={e => { e.stopPropagation(); openEdit(event); }}
                              className="p-0.5 hover:text-gia-500 transition-colors cursor-pointer"
                              title="Edit"
                            ><Edit3 size={10} /></span>
                          )}
                          {canDeleteEvent(event.createdBy) && (
                            <span
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${event.title}"?`)) {
                                  try {
                                    await onDeleteEvent(event.id, event.title);
                                    // Remove from local state
                                    setEvents(prev => prev.filter(ev => ev.id !== event.id));
                                    if (activeEvent?.id === event.id) setActiveEvent(null);
                                  } catch (error) {
                                    // Error already handled in App.jsx
                                  }
                                }
                              }}
                              className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Delete"
                            ><Trash2 size={10} /></span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
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
          {!rightOpen && visibleEvents.length > 0 && (
            <div className="flex-1 flex flex-col items-center pt-3 gap-1.5 overflow-hidden">
              {visibleEvents.slice(0, 8).map(event => {
                // Determine status dot color
                const statusColor = event.status === 'Active'
                  ? 'bg-emerald-400'
                  : event.status === 'Cancelled'
                    ? 'bg-rose-400'
                    : 'bg-neutral-400'; // Done

                return (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    title={`${event.title} (${event.status || 'Active'})`}
                    className={`w-5 h-5 rounded-full transition-all border-2 ${activeEvent?.id === event.id
                      ? `${statusColor} border-neutral-900 dark:border-neutral-100`
                      : `${statusColor} border-transparent hover:border-neutral-300 dark:hover:border-neutral-600`
                      }`}
                  />
                );
              })}
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

      {/* ── Event Form Modal ── */}
      <EventFormModal
        isOpen={showCreateModal}
        isEditing={isEditing}
        initialData={editingEvent}
        onSubmit={handleFormSubmit}
        onClose={() => setShowCreateModal(false)}
      />

      {/* ── Event Poster Generator ── */}
      <EventPosterGenerator
        event={activeEvent}
        isOpen={showPosterGenerator}
        onClose={() => setShowPosterGenerator(false)}
      />

      {/* ── Event Report Exporter ── */}
      <EventReportExporter
        event={activeEvent}
        attendanceData={attendanceData}
        isOpen={showReportExporter}
        onClose={() => setShowReportExporter(false)}
      />
    </div>
  );
}
