import { useState, useEffect, useMemo } from 'react';
import { Calendar, ExternalLink, ShieldCheck, AlertCircle, Loader2, Award, X, MapPin, Clock, Users, Target, Building2 } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

export default function PublicEventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});

  // Real-time Firestore Live Event Synchronization
  useEffect(() => {
    console.log('📅 Public Events: Initializing zero-index pipeline stream...');
    const eventsRef = collection(db, 'events');

    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('❌ Error streaming events timeline:', err);
      setError('Unable to load calendar feed.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch attendance stats (SDD only - no participant details)
  useEffect(() => {
    if (events.length === 0) return;

    console.log('📊 Fetching attendance stats...');

    const attendanceRef = collection(db, 'attendance');

    const unsubscribe = onSnapshot(attendanceRef, (snapshot) => {
      const stats = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const eventId = data.eventId;
        const sex = data.sex || data.gender || 'Not Specified';

        if (!stats[eventId]) {
          stats[eventId] = { Male: 0, Female: 0, total: 0 };
        }

        if (sex === 'Female') {
          stats[eventId].Female++;
        } else if (sex === 'Male') {
          stats[eventId].Male++;
        }
        stats[eventId].total++;
      });

      console.log('📊 Attendance stats loaded');
      setAttendanceStats(stats);
    });

    return () => unsubscribe();
  }, [events]);

  // High-Density Client-Side Filtering & Sorting Pipeline
  const processedEvents = useMemo(() => {
    const now = new Date();

    return [...events]
      .filter(event => event.status?.toLowerCase() !== 'cancelled')
      .map(event => {
        // Check both date and startDate fields
        const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;
        const isUpcoming = eventDate ? eventDate >= now : event.status?.toLowerCase() === 'upcoming' || event.status?.toLowerCase() === 'open';
        return { ...event, isUpcoming };
      })
      .sort((a, b) => {
        if (a.isUpcoming && !b.isUpcoming) return -1;
        if (!a.isUpcoming && b.isUpcoming) return 1;
        const dateA = a.startDate ? new Date(a.startDate) : a.date ? new Date(a.date) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
  }, [events]);

  if (loading) {
    return (
      <div className="h-32 flex flex-col items-center justify-center gap-1.5 text-neutral-400">
        <Loader2 size={16} className="animate-spin text-[#741112]" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Syncing Roadmap...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center text-rose-500">
        <AlertCircle size={16} className="mx-auto mb-1" />
        <p className="text-xs font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Metric Header Totalizer */}
      <div className="mb-3 shrink-0 flex items-center justify-between px-0.5">
        <div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-[#741112] dark:text-rose-300">Institutional Calendar</h3>
          <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-50 tracking-tight mt-0.5">GADC Action Roadmap</h2>
        </div>
        <span className="text-[9px] font-black tracking-tight text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-0.5 rounded border border-neutral-200/20 dark:border-neutral-700/20">
          {processedEvents.length} Actions Logged
        </span>
      </div>

      {/* Main High-Density Scrolling Stream */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 scrollbar-none">
        {processedEvents.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-center p-4">
            <Calendar size={16} className="text-neutral-300 dark:text-neutral-700 mb-1" />
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">No active entries inside registry.</p>
          </div>
        ) : (
          processedEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-3 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer group ${event.isUpcoming
                ? 'bg-gradient-to-br from-[#741112]/[0.04] via-[#741112]/[0.01] to-transparent border-[#741112]/30 dark:border-[#741112]/40 shadow-xs ring-1 ring-[#741112]/5 hover:border-[#741112]/60'
                : 'bg-[#fafafa] dark:bg-[#151518]/40 border-neutral-200/60 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/20'
                }`}
            >
              {event.isUpcoming && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#741112] to-[#530B0C] text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg shadow-xs flex items-center gap-0.5 z-10">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  Upcoming Open
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug max-w-[83%] group-hover:text-[#741112] dark:group-hover:text-rose-300 transition-colors">
                  {event.title || event.eventName || 'Untitled GADC Event Activity'}
                </h4>

                {event.description && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Card Meta Row */}
              <div className="mt-2.5 pt-2 border-t border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between gap-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-bold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex items-center gap-1 shrink-0 bg-neutral-100 dark:bg-neutral-800/50 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 text-[9px] border border-neutral-200/20 dark:border-neutral-700/20">
                    <Calendar size={10} />
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </span>

                  {event.sdd && (
                    <span className="truncate bg-[#741112]/5 dark:bg-[#741112]/20 text-[#741112] dark:text-rose-300 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-[#741112]/15 dark:border-[#741112]/20">
                      SDG: {event.sdd}
                    </span>
                  )}
                </div>

                {event.isUpcoming ? (
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#741112] dark:text-rose-300 bg-[#741112]/50/10 px-1.5 py-0.5 rounded">
                    Inspect ➔
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/40 px-1.5 py-0.5 rounded">
                    <ShieldCheck size={9} /> Concluded
                  </span>
                )}
              </div>

              {/* Pre-Registration Action Button (Upcoming Events Only) */}
              {event.isUpcoming && (
                <div className="mt-2.5 pt-2.5 border-t border-neutral-200/30 dark:border-neutral-800/30">
                  <a
                    href={event.preRegLink || event.registrationUrl || `${window.location.origin}/register/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#741112] to-[#530B0C] hover:from-[#530B0C] hover:to-[#3a0708] text-white rounded-lg text-[10px] font-black tracking-wide shadow-sm hover:shadow transition-all group uppercase"
                  >
                    <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Pre-Register Now
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sync Footer */}
      <div className="border-t border-neutral-100 dark:border-neutral-800/60 pt-2 mt-2 shrink-0 text-center">
        <div className="flex items-center justify-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          Live Stream Connected
        </div>
      </div>

      {/* ── PREMIUM REDESIGNED DETAILED BRIEFING MODAL ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 dark:bg-neutral-950/70 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Header Accent Frame */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#161619]/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${selectedEvent.isUpcoming
                    ? 'bg-[#741112]/10 text-[#741112] dark:bg-[#741112]/20 dark:text-rose-300 border border-[#741112]/20'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                    {selectedEvent.isUpcoming ? 'Active Scope' : 'Archive Data'}
                  </span>
                  {selectedEvent.sdd && (
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Directive: {selectedEvent.sdd}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-50 tracking-tight leading-snug mt-1">
                  {selectedEvent.title || selectedEvent.eventName || 'GAD Event Activity Briefing'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body Info Stack */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Context Summary Narrative */}
              {selectedEvent.description && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Activity Mandate</span>
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50/60 dark:bg-neutral-900/40 p-3 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Spatial-Temporal Execution Profiles Grid */}
              <div className="grid grid-cols-2 gap-2">

                {/* Date Badge */}
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <Calendar size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Date Logged</p>
                    <p className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                      {selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Time Badge */}
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <Clock size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Schedule Time</p>
                    <p className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                      {selectedEvent.time || selectedEvent.startTime || selectedEvent.duration || 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Venue Badge */}
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <MapPin size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Target Venue</p>
                    <p className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                      {selectedEvent.venue || selectedEvent.location || 'Campus Desk Arena'}
                    </p>
                  </div>
                </div>

                {/* Organizer Badge */}
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200/40 dark:border-neutral-800/40 flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                    <Building2 size={11} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">Host Unit</p>
                    <p className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                      {selectedEvent.organizer || selectedEvent.hostUnit || 'GADC Executive Desk'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Strategy Parameters Index Banner */}
              {selectedEvent.sdd && (
                <div className="p-3 bg-[#741112]/[0.03] rounded-xl border border-[#741112]/10 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#741112]/10 flex items-center justify-center text-[#741112] dark:text-rose-300 shrink-0">
                    <Target size={12} />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-[#741112] dark:text-rose-300 uppercase tracking-widest block">Institutional Target Metric</span>
                    <p className="text-xs font-black text-neutral-800 dark:text-neutral-200 mt-0.5">Strategic Directive Group: {selectedEvent.sdd}</p>
                  </div>
                </div>
              )}

              {/* Sex Disaggregated Data (SDD) Attendance Stats — MSU-IIT SIGNATURE MAROON & GOLD */}
              {attendanceStats[selectedEvent.id] && attendanceStats[selectedEvent.id].total > 0 && (() => {
                const stats = attendanceStats[selectedEvent.id];
                const malePercentage = stats.total > 0 ? Math.round((stats.Male / stats.total) * 100) : 0;
                const femalePercentage = stats.total > 0 ? Math.round((stats.Female / stats.total) * 100) : 0;

                return (
                  <div className="p-3.5 bg-neutral-50/60 dark:bg-neutral-900/30 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 transition-all duration-200">

                    {/* Header Accent Line with Maroon Flagging */}
                    <div className="flex items-center justify-between gap-4 mb-3 pb-2 border-b border-neutral-200/30 dark:border-neutral-800/30">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#741112]/10 dark:bg-[#741112]/20 flex items-center justify-center text-[#741112] dark:text-rose-400">
                          <Users size={11} />
                        </div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                          Sex-Disaggregated Framework
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 bg-[#741112]/10 dark:bg-[#741112]/20 text-[#741112] dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight border border-[#741112]/10">
                        <span className="text-[8px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mr-0.5">Total Pool:</span>
                        {stats.total.toLocaleString()}
                      </div>
                    </div>

                    {/* MSU-IIT Core Visual Segmented Progress Rail */}
                    <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex mb-4 border border-neutral-200/20 dark:border-neutral-700/20 shadow-inner">
                      <div
                        style={{ width: `${malePercentage}%` }}
                        className="h-full bg-gradient-to-r from-[#530B0C] to-[#741112] transition-all duration-500 ease-out"
                        title={`Male: ${malePercentage}%`}
                      />
                      <div
                        style={{ width: `${femalePercentage}%` }}
                        className="h-full bg-gradient-to-r from-[#ECC142] to-[#D4AF37] transition-all duration-500 ease-out"
                        title={`Female: ${femalePercentage}%`}
                      />
                    </div>

                    {/* High-Density Branded Stat Info Cards */}
                    <div className="grid grid-cols-2 gap-2.5">

                      {/* Academic Maroon Male Segment Card */}
                      <div className="p-2.5 bg-white dark:bg-[#151518]/60 rounded-xl border border-neutral-200/40 dark:border-neutral-800/50 flex items-center justify-between group hover:border-[#741112]/30 transition-all">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#741112] shrink-0 shadow-xs" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Male Pool</p>
                          </div>
                          <p className="text-sm font-black text-neutral-800 dark:text-neutral-100 tracking-tight pl-3">
                            {stats.Male.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-black tracking-tight text-[#741112] dark:text-rose-400 bg-[#741112]/5 dark:bg-[#741112]/10 px-1.5 py-0.5 rounded border border-[#741112]/10">
                          {malePercentage}%
                        </span>
                      </div>

                      {/* Academic Gold Female Segment Card */}
                      <div className="p-2.5 bg-white dark:bg-[#151518]/60 rounded-xl border border-neutral-200/40 dark:border-neutral-800/50 flex items-center justify-between group hover:border-[#D4AF37]/40 transition-all">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 shadow-xs" />
                            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Female Pool</p>
                          </div>
                          <p className="text-sm font-black text-neutral-800 dark:text-neutral-100 tracking-tight pl-3">
                            {stats.Female.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[10px] font-black tracking-tight text-[#b49026] dark:text-[#ECC142] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                          {femalePercentage}%
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Modal Bottom Interactive Footer Action Gate */}
            <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#161619]/40 shrink-0 flex items-center justify-end">
              {selectedEvent.isUpcoming ? (
                <a
                  href={selectedEvent.preRegLink || selectedEvent.registrationUrl || `${window.location.origin}/register/${selectedEvent.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#741112] hover:bg-[#530B0C] text-white rounded-xl text-xs font-black tracking-wide shadow-sm hover:shadow transition-all group uppercase cursor-pointer"
                >
                  Proceed with Pre-Registration
                  <ExternalLink size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              ) : (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-black tracking-wide transition-all uppercase cursor-pointer text-center"
                >
                  Close Document Briefing
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}