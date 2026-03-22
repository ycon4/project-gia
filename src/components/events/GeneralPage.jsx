import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, FunnelChart, Funnel,
  LabelList, AreaChart, Area
} from 'recharts';
import {
  Users, TrendingUp, Target, FileText,
  Calendar, Filter, Printer, Download, RefreshCcw,
  BookOpen, Briefcase, UserCircle, GraduationCap, Building2,
  ChevronDown, Award, BarChart2, Layers
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTOR_COLORS = {
  Student: '#6366f1',
  Faculty: '#f59e0b',
  Staff:   '#10b981',
  Visitor: '#ec4899',
};

const GENDER_COLORS = { Male: '#3b82f6', Female: '#f472b6' };

const SECTOR_ICONS = {
  Student: GraduationCap,
  Faculty: BookOpen,
  Staff:   Briefcase,
  Visitor: UserCircle,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function pct(n, total) {
  if (!total) return '0';
  return ((n / total) * 100).toFixed(1);
}

function monthKey(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key) {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' });
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** KPI card */
function KPICard({ label, value, sub, accent = '#6366f1', icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={16} style={{ color: accent }} />}
      </div>
      <span className="text-3xl font-black text-slate-900">{value}</span>
      {sub && <span className="text-[9px] font-bold text-slate-400 uppercase">{sub}</span>}
    </div>
  );
}

/** Section header */
function SectionTitle({ children }) {
  return (
    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{children}</h3>
  );
}

/** Horizontal progress bar row */
function RankRow({ rank, name, count, total, color = '#6366f1' }) {
  const width = total ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[9px] font-black text-slate-300 w-4 text-right">{rank}</span>
      <span className="text-[10px] font-bold text-slate-700 flex-1 truncate">{name}</span>
      <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black text-slate-900 w-8 text-right">{count}</span>
      <span className="text-[9px] text-slate-400 w-10 text-right">{pct(count, total)}%</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GeneralDashboard({ events = [], attendanceData = [] }) {

  // ── Filter state ──
  const [dateRange, setDateRange]       = useState({ start: '', end: '' });
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedEvent, setSelectedEvent]   = useState('All');
  const reportRef = useRef(null);

  // ── Filtered base data ──
  const filtered = useMemo(() => {
    return attendanceData.filter(item => {
      const d = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end   = dateRange.end   ? new Date(new Date(dateRange.end).setHours(23,59,59)) : null;
      const okDate   = (!start || d >= start) && (!end || d <= end);
      const okSector = selectedSector === 'All' || item.sector === selectedSector;
      const okEvent  = selectedEvent  === 'All' || String(item.eventId) === String(selectedEvent);
      return okDate && okSector && okEvent;
    });
  }, [attendanceData, dateRange, selectedSector, selectedEvent]);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const total   = filtered.length;
    const male    = filtered.filter(d => d.sex === 'Male').length;
    const female  = filtered.filter(d => d.sex === 'Female').length;
    const scholars = filtered.filter(d => d.scholarship).length;

    // Sector breakdown
    const sectors = ['Student', 'Faculty', 'Staff', 'Visitor'];
    const sectorData = sectors.map(s => ({
      sector: s,
      count:  filtered.filter(d => d.sector === s).length,
      Male:   filtered.filter(d => d.sector === s && d.sex === 'Male').length,
      Female: filtered.filter(d => d.sector === s && d.sex === 'Female').length,
    }));

    // Gender pie
    const genderPie = [
      { name: 'Male',   value: male,   color: GENDER_COLORS.Male },
      { name: 'Female', value: female, color: GENDER_COLORS.Female },
    ];

    // Sector pie
    const sectorPie = sectorData
      .filter(s => s.count > 0)
      .map(s => ({ name: s.sector, value: s.count, color: SECTOR_COLORS[s.sector] }));

    // College / Office ranking
    const unitMap = {};
    filtered.forEach(d => {
      const u = d.office_college || 'External / N/A';
      unitMap[u] = (unitMap[u] || 0) + 1;
    });
    const unitRanking = Object.entries(unitMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly trend (all attendance data for trend, not just filtered)
    const trendMap = {};
    attendanceData.forEach(d => {
      const key = monthKey(d.timestamp);
      if (!trendMap[key]) trendMap[key] = { month: key, Total: 0, Male: 0, Female: 0 };
      trendMap[key].Total++;
      if (d.sex === 'Male')   trendMap[key].Male++;
      if (d.sex === 'Female') trendMap[key].Female++;
    });
    const trend = Object.values(trendMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(t => ({ ...t, month: formatMonth(t.month) }));

    // Session funnel (across filtered data)
    const sessionMap = {};
    filtered.forEach(d => {
      const s = d.session || 'Unknown';
      sessionMap[s] = (sessionMap[s] || 0) + 1;
    });
    const sessionFunnel = Object.entries(sessionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Event comparison table
    const eventTable = events.map(ev => {
      const evData = filtered.filter(d => String(d.eventId) === String(ev.id));
      const evMale   = evData.filter(d => d.sex === 'Male').length;
      const evFemale = evData.filter(d => d.sex === 'Female').length;
      const topUnit  = (() => {
        const m = {};
        evData.forEach(d => { const u = d.office_college || 'N/A'; m[u] = (m[u]||0)+1; });
        return Object.entries(m).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
      })();
      return {
        id:       ev.id,
        title:    ev.title,
        date:     ev.startDate,
        status:   ev.status,
        total:    evData.length,
        male:     evMale,
        female:   evFemale,
        femalePct: pct(evFemale, evData.length),
        topUnit,
      };
    }).filter(e => e.total > 0);

    // Narrative
    const topUnit = unitRanking[0]?.name || 'N/A';
    const femalePct = pct(female, total);
    const topSector = sectorData.sort((a,b) => b.count - a.count)[0]?.sector || 'N/A';
    const narrative = total === 0
      ? 'No data available for the selected filters.'
      : `This reporting period recorded ${total} total participants across ${
          events.filter(e => filtered.some(d => String(d.eventId) === String(e.id))).length
        } event(s). ${topUnit} contributed the highest participation. The gender composition stands at ${femalePct}% female, with ${topSector}s representing the largest sector group. ${
          scholars > 0 ? `A total of ${scholars} scholarship recipients were recorded.` : ''
        }`;

    return {
      total, male, female, scholars,
      sectorData, genderPie, sectorPie,
      unitRanking, trend, sessionFunnel,
      eventTable, narrative,
      femalePct: pct(female, total),
    };
  }, [filtered, events, attendanceData]);

  // ── Print handler ──
  const handlePrint = () => window.print();

  // ── Reset filters ──
  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedSector('All');
    setSelectedEvent('All');
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── PRINT STYLES (injected inline so no separate CSS file needed) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #gad-report, #gad-report * { visibility: visible; }
          #gad-report { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
          .print-hide { display: none !important; }
          .print-page-break { page-break-before: always; }
          @page { size: A4 portrait; margin: 18mm; }
        }
      `}</style>

      <div className="space-y-6 pb-20 animate-in fade-in duration-500" id="gad-report" ref={reportRef}>

        {/* ── PRINT HEADER (only visible when printing) ── */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gender and Development Office</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase">GAD Event Participation Report</h1>
          <p className="text-[10px] text-slate-500 mt-1">
            Generated: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}
            {dateRange.start && ` | Period: ${dateRange.start} to ${dateRange.end || 'present'}`}
          </p>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="print-hide bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border text-[10px] font-bold">
            <Calendar size={13} className="text-slate-400" />
            <input type="date" className="bg-transparent outline-none text-[10px] font-bold"
              value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
            <span className="text-slate-300">→</span>
            <input type="date" className="bg-transparent outline-none text-[10px] font-bold"
              value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
          </div>

          {/* Sector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border text-[10px] font-bold">
            <Filter size={13} className="text-slate-400" />
            <select className="bg-transparent outline-none text-[10px] font-bold"
              value={selectedSector} onChange={e => setSelectedSector(e.target.value)}>
              <option value="All">All Sectors</option>
              {['Student','Faculty','Staff','Visitor'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Event */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border text-[10px] font-bold">
            <Layers size={13} className="text-slate-400" />
            <select className="bg-transparent outline-none text-[10px] font-bold"
              value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="All">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          <button onClick={resetFilters}
            className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors">
            <RefreshCcw size={12} /> Reset
          </button>

          <button onClick={handlePrint}
            className="ml-auto flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors">
            <Printer size={14} /> Print / Export
          </button>
        </div>

        {/* ── KPI STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Total Participants" value={stats.total.toLocaleString()} icon={Users} accent="#6366f1"
            sub={`${events.length} event(s) total`} />
          <KPICard label="Female Participants" value={stats.female.toLocaleString()} icon={Award} accent="#ec4899"
            sub={`${stats.femalePct}% of total`} />
          <KPICard label="Male Participants" value={stats.male.toLocaleString()} icon={Award} accent="#3b82f6"
            sub={`${pct(stats.male, stats.total)}% of total`} />
          
        </div>


        {/* ── NARRATIVE ── */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-slate-50"><FileText size={140} /></div>
          <div className="relative z-10">
            <SectionTitle>Executive Summary</SectionTitle>
            <p className="text-base font-medium text-slate-700 leading-relaxed italic">"{stats.narrative}"</p>
          </div>
        </div>

        {/* ── ROW 1: Gender Pie + Sector Pie ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Gender Pie */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Gender Distribution</SectionTitle>
            {stats.total === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.genderPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                      {stats.genderPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} (${pct(v, stats.total)}%)`, n]} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-2">
                  {stats.genderPie.map(g => (
                    <div key={g.name} className="text-center">
                      <div className="text-xl font-black" style={{ color: g.color }}>{g.value}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase">{g.name}</div>
                      <div className="text-[9px] text-slate-400">{pct(g.value, stats.total)}%</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sector Pie */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Sector Breakdown</SectionTitle>
            {stats.total === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.sectorPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                      {stats.sectorPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} (${pct(v, stats.total)}%)`, n]} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-around flex-wrap gap-2 mt-2">
                  {stats.sectorPie.map(s => (
                    <div key={s.name} className="text-center">
                      <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase">{s.name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ROW 2: Sex-Disaggregated by Sector (grouped bar) ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <SectionTitle>Sex-Disaggregated Data by Sector</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.sectorData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }}
                formatter={(v, n) => [v, n]}
              />
              <Legend iconType="circle" iconSize={8}
                formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
              <Bar dataKey="Male"   fill={GENDER_COLORS.Male}   barSize={24} radius={[4,4,0,0]} />
              <Bar dataKey="Female" fill={GENDER_COLORS.Female} barSize={24} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── ROW 3: Monthly Trend (Area) ── */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print-page-break">
          <SectionTitle>Monthly Attendance Trend</SectionTitle>
          {stats.trend.length === 0 ? (
            <p className="text-center text-slate-300 text-xs py-10">No trend data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gFemale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                <Area type="monotone" dataKey="Total"  stroke="#6366f1" strokeWidth={2} fill="url(#gTotal)"  dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Male"   stroke="#3b82f6" strokeWidth={2} fill="none" dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Female" stroke="#f472b6" strokeWidth={2} fill="url(#gFemale)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── ROW 4: Session Funnel + College Ranking ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Session Funnel (horizontal bars as funnel proxy) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Session Attendance Funnel</SectionTitle>
            {stats.sessionFunnel.length === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No session data</p>
            ) : (
              <div className="space-y-3 mt-2">
                {stats.sessionFunnel.map((s, i) => {
                  const maxVal = stats.sessionFunnel[0].value;
                  const pctWidth = maxVal ? (s.value / maxVal) * 100 : 0;
                  const dropoff = i > 0
                    ? ` (${((1 - s.value / stats.sessionFunnel[i-1].value) * 100).toFixed(0)}% drop)`
                    : '';
                  return (
                    <div key={s.name}>
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>{s.name}</span>
                        <span className="text-slate-400">{s.value}{dropoff}</span>
                      </div>
                      <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center pl-2 transition-all duration-500"
                          style={{
                            width: `${pctWidth}%`,
                            background: `hsl(${240 - i * 30}, 80%, ${55 + i * 5}%)`,
                          }}
                        >
                          <span className="text-[9px] font-black text-white">{pct(s.value, stats.total)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* College / Office Ranking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Top Contributing Units / Colleges</SectionTitle>
            {stats.unitRanking.length === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No data</p>
            ) : (
              <div className="space-y-1">
                {stats.unitRanking.slice(0, 8).map((u, i) => (
                  <RankRow key={u.name} rank={i + 1} name={u.name} count={u.count} total={stats.total}
                    color={`hsl(${240 + i * 15}, 70%, 55%)`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── EVENT COMPARISON TABLE ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print-page-break">
          <div className="p-5 border-b">
            <SectionTitle>Event-by-Event Comparison</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Event','Date','Status','Total','Male','Female','% Female','Top Unit'].map(h => (
                    <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.eventTable.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-xs text-slate-300 py-10">No events with participants in this filter range</td>
                  </tr>
                ) : (
                  stats.eventTable.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{ev.title}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{ev.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          ev.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>{ev.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900">{ev.total}</td>
                      <td className="px-4 py-3 text-xs font-bold text-blue-600">{ev.male}</td>
                      <td className="px-4 py-3 text-xs font-bold text-pink-500">{ev.female}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-400 rounded-full" style={{ width: `${ev.femalePct}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-700">{ev.femalePct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 truncate max-w-[120px]">{ev.topUnit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PRINT FOOTER ── */}
        <div className="hidden print:block mt-8 pt-4 border-t text-[9px] text-slate-400 flex justify-between">
          <span>GAD Event Manager — Confidential</span>
          <span>Page 1</span>
        </div>

        {/* ── FOOTER / NARRATIVE ── */}
      <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-xl shadow-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Executive Narrative</h4>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Currently viewing data for <span className="text-white font-bold">{selectedEvent === 'All' ? 'all registered events' : 'a specific activity'}</span>. 
              The gender distribution shows a <span className="text-pink-400 font-bold">{pct(stats.female, stats.total)}% female</span> participation rate. 
              {stats.total > 0 && ` Most active unit recorded is ${stats.unitRanking[0]?.name}.`}
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
             <p className="text-[9px] font-black uppercase text-slate-500 mb-1 text-center">Inclusion Score</p>
             <div className="text-2xl font-black text-emerald-400">{pct(stats.female + stats.scholars, stats.total * 2)}%</div>
          </div>
        </div>
      </div> 

      </div>
    </>
  );
}