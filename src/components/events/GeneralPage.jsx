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
  Guest:   '#ec4899',
};

const GENDER_COLORS = { Male: '#3b82f6', Female: '#f472b6' };

const SECTOR_ICONS = {
  Student: GraduationCap,
  Faculty: BookOpen,
  Staff:   Briefcase,
  Guest:   UserCircle,
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

function sexKey(sex) {
  const v = (sex ?? '').toString().trim();
  if (v === 'Male') return 'Male';
  if (v === 'Female') return 'Female';
  return null; // Ignore other values like "Prefer not to say" for SDD charts.
}

function getAgeBand(age) {
  const n = parseInt(age, 10);
  if (Number.isNaN(n)) return null;
  if (n < 18) return 'Under 18';
  if (n <= 24) return '18–24';
  if (n <= 34) return '25–34';
  if (n <= 44) return '35–44';
  if (n <= 54) return '45–54';
  return '55+';
}

function getSessionName(row) {
  return row?.session_name || row?.session || 'Unknown';
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
      const rawTs = item?.createdAt ?? item?.timestamp;
      const d = rawTs?.toDate ? rawTs.toDate() : new Date(rawTs);
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
    const total = filtered.length;

    const male = filtered.reduce((acc, d) => acc + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
    const female = filtered.reduce((acc, d) => acc + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);

    // PWD participation (used for inclusion score)
    const pwdYes = filtered.reduce((acc, d) => acc + ((d.pwd_status ?? '').toString().trim() === 'Yes' ? 1 : 0), 0);

    // Sector breakdown (data uses "Guest" from RegistrationForm)
    const sectors = ['Student', 'Faculty', 'Staff', 'Guest'];
    const sectorData = sectors.map((s) => {
      const inSector = filtered.filter((d) => d.sector === s);
      const m = inSector.reduce((acc, d) => acc + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
      const f = inSector.reduce((acc, d) => acc + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
      return { sector: s, count: inSector.length, Male: m, Female: f };
    });

    const genderPie = [
      { name: 'Male', value: male, color: GENDER_COLORS.Male },
      { name: 'Female', value: female, color: GENDER_COLORS.Female },
    ];

    const sectorPie = sectorData
      .filter((s) => s.count > 0)
      .map((s) => ({
        name: s.sector,
        value: s.count,
        color: SECTOR_COLORS[s.sector] || '#94a3b8',
      }));

    // Office/College SDD ranking
    const ageBands = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
    const unitGenderMap = {};
    filtered.forEach((d) => {
      const u = d.office_college || 'External / N/A';
      if (!unitGenderMap[u]) unitGenderMap[u] = { name: u, male: 0, female: 0, total: 0 };
      unitGenderMap[u].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') unitGenderMap[u].male += 1;
      if (sk === 'Female') unitGenderMap[u].female += 1;
    });
    const unitGenderRanking = Object.values(unitGenderMap).sort((a, b) => b.total - a.total);

    const unitRanking = unitGenderRanking.map((u) => ({ name: u.name, count: u.total }));

    // Monthly trend (all data for trend, not just filtered)
    const trendMap = {};
    attendanceData.forEach((d) => {
      const rawTs = d.createdAt ?? d.timestamp;
      if (!rawTs) return;
      const key = monthKey(rawTs);
      if (!trendMap[key]) trendMap[key] = { month: key, Total: 0, Male: 0, Female: 0 };
      trendMap[key].Total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') trendMap[key].Male += 1;
      if (sk === 'Female') trendMap[key].Female += 1;
    });
    const trend = Object.values(trendMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((t) => ({ ...t, month: formatMonth(t.month) }));

    // Session funnel data (SDD)
    const sessionGenderMap = {};
    filtered.forEach((d) => {
      const s = getSessionName(d);
      if (!sessionGenderMap[s]) sessionGenderMap[s] = { name: s, Male: 0, Female: 0, total: 0 };
      sessionGenderMap[s].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') sessionGenderMap[s].Male += 1;
      if (sk === 'Female') sessionGenderMap[s].Female += 1;
    });
    const sessionGenderData = Object.values(sessionGenderMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const sessionFunnel = sessionGenderData
      .map((s) => ({ name: s.name, value: s.total }))
      .sort((a, b) => b.value - a.value);

    // Age SDD distribution
    const ageGenderMap = {};
    ageBands.forEach((b) => (ageGenderMap[b] = { band: b, Male: 0, Female: 0, total: 0 }));
    filtered.forEach((d) => {
      const band = getAgeBand(d.age);
      if (!band) return;
      ageGenderMap[band].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') ageGenderMap[band].Male += 1;
      if (sk === 'Female') ageGenderMap[band].Female += 1;
    });
    const ageGenderData = ageBands.map((b) => ageGenderMap[b]);
    const topAgeBand = [...ageGenderData].sort((a, b) => b.total - a.total)[0]?.band || 'N/A';

    // Employment SDD
    const employmentGenderMap = {};
    filtered.forEach((d) => {
      const raw = (d.employment_status ?? '').toString().trim();
      const status = raw || 'N/A';
      if (!employmentGenderMap[status]) employmentGenderMap[status] = { name: status, Male: 0, Female: 0, total: 0 };
      employmentGenderMap[status].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') employmentGenderMap[status].Male += 1;
      if (sk === 'Female') employmentGenderMap[status].Female += 1;
    });
    const employmentGenderData = Object.values(employmentGenderMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    const topEmployment = employmentGenderData[0]?.name || 'N/A';

    // PWD SDD
    const pwdGenderMap = {
      Yes: { name: 'Yes', Male: 0, Female: 0, total: 0 },
      No: { name: 'No', Male: 0, Female: 0, total: 0 },
    };
    filtered.forEach((d) => {
      const val = (d.pwd_status ?? '').toString().trim();
      const key = val === 'Yes' ? 'Yes' : val === 'No' ? 'No' : null;
      if (!key) return;
      pwdGenderMap[key].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') pwdGenderMap[key].Male += 1;
      if (sk === 'Female') pwdGenderMap[key].Female += 1;
    });
    const pwdGenderData = ['Yes', 'No'].map((k) => pwdGenderMap[k]).filter((x) => x.total > 0);
    const pwdYesPct = pct(pwdYes, total);

    // Event comparison table
    const eventTable = events
      .map((ev) => {
        const evData = filtered.filter((d) => String(d.eventId) === String(ev.id));
        const evMale = evData.reduce((acc, d) => acc + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
        const evFemale = evData.reduce((acc, d) => acc + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
        const topUnit = (() => {
          const m = {};
          evData.forEach((d) => {
            const u = d.office_college || 'N/A';
            m[u] = (m[u] || 0) + 1;
          });
          return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        })();
        return {
          id: ev.id,
          title: ev.title,
          date: ev.startDate,
          status: ev.status,
          total: evData.length,
          male: evMale,
          female: evFemale,
          femalePct: pct(evFemale, evData.length),
          topUnit,
        };
      })
      .filter((e) => e.total > 0);

    // Narrative + topinsights
    const topUnit = unitGenderRanking[0]?.name || 'N/A';
    const femalePct = pct(female, total);
    const topSectorRow = [...sectorData].sort((a, b) => b.count - a.count)[0] || null;
    const topSector = topSectorRow?.sector || 'N/A';
    const topSectorFemalePct = topSectorRow ? pct(topSectorRow.Female, topSectorRow.count) : '0';

    const genderGap = male + female > 0 ? Math.round(((female - male) / (male + female)) * 100) : 0;
    const topSessionRow = sessionGenderData[0] || null;
    const topSession = topSessionRow?.name || 'N/A';

    const trendFirst = trend[0]?.Total ?? 0;
    const trendLast = trend[trend.length - 1]?.Total ?? 0;
    const trendDelta = trendLast - trendFirst;

    const narrative =
      total === 0
        ? 'No data available for the selected filters.'
        : `This reporting period recorded ${total} total participants across ${
            events.filter((e) => filtered.some((d) => String(d.eventId) === String(e.id))).length
          } event(s). Top participation came from ${topUnit}. Gender composition is ${femalePct}% female (gender gap: ${genderGap > 0 ? '+' : ''}${genderGap} pts). The largest sector group is ${topSector}, while the most active gate/session is ${topSession}. ${
            pwdYes > 0 ? `${pwdYes} participant(s) were recorded as PWD.` : 'No PWD participants were recorded in this period.'
          }`;

    return {
      total,
      male,
      female,
      pwdYes,
      pwdYesPct,
      sectorData,
      genderPie,
      sectorPie,
      unitRanking,
      unitGenderRanking,
      trend,
      sessionGenderData,
      sessionFunnel,
      ageGenderData,
      topAgeBand,
      employmentGenderData,
      topEmployment,
      pwdGenderData,
      eventTable,
      narrative,
      femalePct,
      topSector,
      topSectorFemalePct,
      topSession,
      trendDelta,
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
              {['Student','Faculty','Staff','Guest'].map(s => <option key={s} value={s}>{s}</option>)}
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
          <KPICard
            label="PWD Participants"
            value={stats.pwdYes.toLocaleString()}
            icon={Target}
            accent="#10b981"
            sub={`${stats.pwdYesPct}% of total`}
          />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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

          <p className="mt-3 text-[9px] font-bold text-slate-400">
            Largest sector: <span className="text-slate-700">{stats.topSector}</span> •{" "}
            Female {stats.sectorData.find(s => s.sector === stats.topSector)?.Female ?? 0} / Male{" "}
            {stats.sectorData.find(s => s.sector === stats.topSector)?.Male ?? 0} •{" "}
            {stats.topSectorFemalePct}% female
          </p>
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

          {stats.trend.length > 1 && (
            <p className="mt-3 text-[9px] font-bold text-slate-400">
              Trend direction (Total):{" "}
              <span className={stats.trendDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {stats.trendDelta >= 0 ? '+' : ''}{stats.trendDelta}
              </span>{' '}
              net change from first to last month
            </p>
          )}
        </div>

        </div>

        {/* ── ROW 4: Session SDD + Office/College SDD ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Session SDD (Male vs Female) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Session Attendance SDD</SectionTitle>

            {stats.sessionGenderData.length === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No session data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.sessionGenderData} layout="vertical" barGap={6} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 0, border: 'none', fontSize: 11 }}
                      formatter={(v, n) => [`${v}`, n]}
                    />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                    <Bar dataKey="Female" stackId="gender" fill={GENDER_COLORS.Female} barSize={22} radius={[6, 0, 0, 6]} />
                    <Bar dataKey="Male" stackId="gender" fill={GENDER_COLORS.Male} barSize={22} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <p className="mt-3 text-[9px] font-bold text-slate-400">
                  Top gate: <span className="text-slate-700">{stats.sessionGenderData[0].name}</span> •{" "}
                  {stats.sessionGenderData[0].Female} Female / {stats.sessionGenderData[0].Male} Male
                </p>
              </>
            )}
          </div>

          {/* Office/College SDD Ranking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Top Units / Colleges (Male vs Female)</SectionTitle>
            {stats.unitGenderRanking.length === 0 ? (
              <p className="text-center text-slate-300 text-xs py-10">No data</p>
            ) : (
              <div className="space-y-3">
                {stats.unitGenderRanking.slice(0, 8).map((u, i) => {
                  const femaleShare = u.total ? u.female / u.total : 0;
                  return (
                    <div key={u.name}>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="truncate pr-3">{u.name}</span>
                        <span className="text-slate-500">
                          {u.total} • F {u.female} / M {u.male}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-50 rounded-sm overflow-hidden flex">
                        <div className="h-full bg-rose-400" style={{ width: `${femaleShare * 100}%` }} />
                        <div className="h-full bg-indigo-400" style={{ width: `${(1 - femaleShare) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 5: Additional SDD breakdowns ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Age SDD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Age Distribution (SDD)</SectionTitle>
            <div className="h-[260px]">
              {stats.total === 0 ? (
                <p className="text-center text-slate-300 text-xs py-20">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ageGenderData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="band" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                    <Bar dataKey="Male" stackId="age" fill={GENDER_COLORS.Male} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Female" stackId="age" fill={GENDER_COLORS.Female} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-3 text-[9px] font-bold text-slate-400">
              Top age band: <span className="text-slate-700">{stats.topAgeBand}</span>
            </p>
          </div>

          {/* Employment SDD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <SectionTitle>Employment Status (SDD)</SectionTitle>
            <div className="h-[260px]">
              {stats.employmentGenderData.length === 0 ? (
                <p className="text-center text-slate-300 text-xs py-20">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.employmentGenderData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                    <Bar dataKey="Male" stackId="emp" fill={GENDER_COLORS.Male} barSize={22} radius={[6, 0, 0, 6]} />
                    <Bar dataKey="Female" stackId="emp" fill={GENDER_COLORS.Female} barSize={22} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-3 text-[9px] font-bold text-slate-400">
              Top status: <span className="text-slate-700">{stats.topEmployment}</span>
            </p>
          </div>

          {/* PWD SDD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print-page-break">
            <SectionTitle>PWD Status (SDD)</SectionTitle>
            <div className="h-[260px]">
              {stats.pwdGenderData.length === 0 ? (
                <p className="text-center text-slate-300 text-xs py-20">No PWD data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.pwdGenderData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                    <Bar dataKey="Male" stackId="pwd" fill={GENDER_COLORS.Male} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Female" stackId="pwd" fill={GENDER_COLORS.Female} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-3 text-[9px] font-bold text-slate-400">
              PWD “Yes”: <span className="text-slate-700">{stats.pwdYes}</span> • {stats.pwdYesPct}%
            </p>
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
             <p className="text-[9px] font-black uppercase text-slate-500 mb-1 text-center">Inclusion Score (PWD)</p>
             <div className="text-2xl font-black text-emerald-400">{stats.pwdYesPct}%</div>
          </div>
        </div>
      </div> 

      </div>
    </>
  );
}