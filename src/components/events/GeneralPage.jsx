import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, FunnelChart, Funnel,
  LabelList, AreaChart, Area
} from 'recharts';
import {
  Users, TrendingUp, Target, FileText,
  Calendar, Filter, Printer, Download, RefreshCcw,
  BookOpen, Briefcase, UserCircle, GraduationCap, Building2,
  ChevronDown, Award, BarChart2, Layers, User, Accessibility
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SECTOR_COLORS = {
  Student: '#a673d8',
  Faculty: '#dd6e6b',
  Staff: '#a5df6a',
  Guest: '#73dae1',
};

const GENDER_COLORS = { Male: '#73dae1', Female: '#a673d8' };

const SECTOR_ICONS = {
  Student: GraduationCap,
  Faculty: BookOpen,
  Staff: Briefcase,
  Guest: UserCircle,
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

// ─── DARK MODE HOOK ───────────────────────────────────────────────────────────
function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** KPI card */
function KPICard({ label, value, sub, accent = '#a673d8', icon: Icon, change }) {
  const [hovered, setHovered] = useState(false);
  const isDark = useIsDark();
  const hasChange = change !== null && change !== undefined;
  const isPos = hasChange && change > 0;
  const isNeg = hasChange && change < 0;

  return (
    <div
      className="rounded-2xl border bg-white dark:bg-[#1a1a1a] p-5 flex flex-col gap-4 cursor-default transition-all duration-300 select-none"
      style={{
        borderColor: hovered ? accent + '60' : (isDark ? '#2a2a2a' : '#e5e5e5'),
        boxShadow: hovered ? `0 4px 20px ${accent}18` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl transition-all duration-300"
          style={{ backgroundColor: hovered ? accent + '35' : accent + '18' }}>
          {Icon && <Icon size={26} style={{ color: accent }} strokeWidth={1.8} />}
        </div>
        {hasChange && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${isPos ? 'text-emerald-500 dark:text-emerald-400' : isNeg ? 'text-red-500 dark:text-red-400' : 'text-neutral-400'
            }`}
            style={{
              backgroundColor: isPos ? 'rgba(52,211,153,0.12)' : isNeg ? 'rgba(248,113,113,0.12)' : 'rgba(115,115,115,0.10)',
            }}>
            {isPos ? '▲' : isNeg ? '▼' : '─'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      {/* Value */}
      <span className="text-3xl font-black leading-none text-neutral-900 dark:text-neutral-100">{value}</span>
      {/* Label + sub */}
      <div>
        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Section header */
function SectionTitle({ children }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-neutral-400 dark:text-neutral-600">Analytics</p>
      <h3 className="text-base font-black leading-none text-neutral-900 dark:text-neutral-100">{children}</h3>
    </div>
  );
}

/** Horizontal progress bar row */
function RankRow({ rank, name, count, total, color = '#a673d8' }) {
  const width = total ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[9px] font-black text-neutral-300 dark:text-neutral-600 w-4 text-right">{rank}</span>
      <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 flex-1 truncate">{name}</span>
      <div className="w-28 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black text-neutral-900 dark:text-neutral-100 w-8 text-right">{count}</span>
      <span className="text-[9px] text-neutral-400 dark:text-neutral-500 w-10 text-right">{pct(count, total)}%</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GeneralDashboard({ events = [], attendanceData = [], compact = false }) {

  const isDark = useIsDark();

  // ── Filter state ──
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const reportRef = useRef(null);

  // ── Filtered base data ──
  const filtered = useMemo(() => {
    return attendanceData.filter(item => {
      const rawTs = item?.createdAt ?? item?.timestamp;
      const d = rawTs?.toDate ? rawTs.toDate() : new Date(rawTs);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(new Date(dateRange.end).setHours(23, 59, 59)) : null;
      const okDate = (!start || d >= start) && (!end || d <= end);
      const okSector = selectedSector === 'All' || item.sector === selectedSector;
      const okEvent = selectedEvent === 'All' || String(item.eventId) === String(selectedEvent);
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
      .filter((ev) => {
        // Filter by status
        if (selectedStatus !== 'All' && ev.status !== selectedStatus) return false;
        return true;
      })
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
        : `This reporting period recorded ${total} total participants across ${events.filter((e) => filtered.some((d) => String(d.eventId) === String(e.id))).length
        } event(s). Top participation came from ${topUnit}. Gender composition is ${femalePct}% female (gender gap: ${genderGap > 0 ? '+' : ''}${genderGap} pts). The largest sector group is ${topSector}, while the most active gate/session is ${topSession}. ${pwdYes > 0 ? `${pwdYes} participant(s) were recorded as PWD.` : 'No PWD participants were recorded in this period.'
        }`;

    // ── Event-by-event chart data (sorted by date) ──
    const eventChart = events
      .map(ev => {
        const evData = filtered.filter(d => String(d.eventId) === String(ev.id));
        const m = evData.reduce((a, d) => a + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
        const f = evData.reduce((a, d) => a + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
        const label = ev.title.length > 18 ? ev.title.slice(0, 17) + '…' : ev.title;
        const target = ev.targetParticipants ? Number(ev.targetParticipants) : null;
        return { name: label, Total: evData.length, Male: m, Female: f, Target: target, _date: ev.startDate || ev.date || '' };
      })
      .filter(e => e.Total > 0)
      .sort((a, b) => a._date.localeCompare(b._date));

    // ── Previous-period percentage change ──
    let changes = { total: null, female: null, male: null, pwd: null };
    if (dateRange.start) {
      const startMs = new Date(dateRange.start).getTime();
      const endMs = dateRange.end
        ? new Date(new Date(dateRange.end).setHours(23, 59, 59)).getTime()
        : Date.now();
      const duration = endMs - startMs;
      const prevEndMs = startMs - 1;
      const prevStartMs = prevEndMs - duration;
      const prev = attendanceData.filter(item => {
        const rawTs = item?.createdAt ?? item?.timestamp;
        const d = rawTs?.toDate ? rawTs.toDate() : new Date(rawTs);
        const ms = d.getTime();
        if (ms < prevStartMs || ms > prevEndMs) return false;
        if (selectedSector !== 'All' && item.sector !== selectedSector) return false;
        if (selectedEvent !== 'All' && String(item.eventId) !== String(selectedEvent)) return false;
        return true;
      });
      const pTotal = prev.length;
      const pFemale = prev.reduce((a, d) => a + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
      const pMale = prev.reduce((a, d) => a + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
      const pPwd = prev.reduce((a, d) => a + ((d.pwd_status ?? '').toString().trim() === 'Yes' ? 1 : 0), 0);
      const chg = (cur, p) => p > 0 ? +((cur - p) / p * 100).toFixed(1) : null;
      changes = {
        total: chg(total, pTotal),
        female: chg(female, pFemale),
        male: chg(male, pMale),
        pwd: chg(pwdYes, pPwd),
      };
    }

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
      changes,
      eventChart,
    };
  }, [filtered, events, attendanceData, dateRange, selectedSector, selectedEvent, selectedStatus]);

  // ── Print handler ──
  const handlePrint = () => window.print();

  // ── Reset filters ──
  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedSector('All');
    setSelectedEvent('All');
    setSelectedStatus('All');
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
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

      {/* ── FILTER BAR — fixed header, never scrolls ── */}
      <div className="print-hide shrink-0 h-12 px-8 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] flex items-center gap-4">

        {/* Date range */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <Calendar size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <input type="date"
            className="bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
          <span className="text-neutral-300 dark:text-neutral-700">—</span>
          <input type="date"
            className="bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        {/* Sector */}
        <div className="relative flex items-center gap-1.5">
          <Filter size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4 [color-scheme:light] dark:[color-scheme:dark]"
            value={selectedSector} onChange={e => setSelectedSector(e.target.value)}>
            <option value="All">All Sectors</option>
            {['Student', 'Faculty', 'Staff', 'Guest'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        {/* Event */}
        <div className="relative flex items-center gap-1.5">
          <Layers size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4 max-w-[200px] [color-scheme:light] dark:[color-scheme:dark]"
            value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="All">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        {/* Status */}
        <div className="relative flex items-center gap-1.5">
          <Filter size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4 [color-scheme:light] dark:[color-scheme:dark]"
            value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        {/* Reset */}
        <button onClick={resetFilters}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
          <RefreshCcw size={11} /> Reset
        </button>

        <button onClick={handlePrint}
          className="ml-auto flex items-center gap-2 text-neutral-600 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-gia-700/30 transition-colors">
          <Printer size={13} /> Print / Export
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8" id="gad-report" ref={reportRef}>

        {/* ── PRINT HEADER (only visible when printing) ── */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gender and Development Office</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase">GAD Event Participation Report</h1>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Generated: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}
            {dateRange.start && ` | Period: ${dateRange.start} to ${dateRange.end || 'present'}`}
          </p>
        </div>

        <div className="flex flex-col gap-6 pt-6 pb-20">

          {/* ── PAGE TITLE ── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-0.5">MSU-IIT GAD Office</p>
            <h1 className="text-2xl font-black leading-none text-neutral-900 dark:text-neutral-100">Events Dashboard</h1>
          </div>

          {/* ── KPI STRIP ── */}
          <div className={`grid gap-6 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
            <KPICard label="Total Participants" value={stats.total.toLocaleString()} icon={Users} accent="#dd6e6b"
              sub={`${events.length} event(s) total`} change={stats.changes.total} />
            <KPICard label="Female Participants" value={stats.female.toLocaleString()} icon={UserCircle} accent="#a673d8"
              sub={`${stats.femalePct}% of total`} change={stats.changes.female} />
            <KPICard label="Male Participants" value={stats.male.toLocaleString()} icon={User} accent="#73dae1"
              sub={`${pct(stats.male, stats.total)}% of total`} change={stats.changes.male} />
            <KPICard label="PWD Participants" value={stats.pwdYes.toLocaleString()} icon={Accessibility} accent="#a5df6a"
              sub={`${stats.pwdYesPct}% of total`} change={stats.changes.pwd} />
          </div>

          {/* ── PARTICIPATION TREND CHART ── */}
          <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212]">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-neutral-400 dark:text-neutral-600">Overview</p>
                <h3 className="text-base font-black leading-none text-neutral-900 dark:text-neutral-100">Participation Trend</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#dd6e6b' }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#a673d8' }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Female</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#73dae1' }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Male</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 inline-block border-t-2 border-dashed" style={{ borderColor: '#a5df6a' }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Target</span></div>
              </div>
            </div>

            {/* Chart — event-by-event (always has data when events exist) */}
            {stats.eventChart.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-neutral-400 dark:text-neutral-600 text-xs italic">No event data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.eventChart} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dd6e6b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#dd6e6b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFemale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a673d8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a673d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#73dae1" stopOpacity={0.30} />
                      <stop offset="95%" stopColor="#73dae1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: isDark ? '#525252' : '#9ca3af' }}
                    interval={0} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: isDark ? '#525252' : '#9ca3af' }} width={28} />
                  <Tooltip
                    contentStyle={{ background: isDark ? '#1e1e22' : '#ffffff', border: `1px solid ${isDark ? '#2a2a2e' : '#e5e7eb'}`, borderRadius: 12, fontSize: 11, color: isDark ? '#e5e5e5' : '#171717' }}
                    labelStyle={{ fontWeight: 900, fontSize: 10, marginBottom: 4 }}
                    itemStyle={{ fontWeight: 700 }}
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="Total" stroke="#dd6e6b" strokeWidth={2} fill="url(#gTotal)" dot={{ r: 3, fill: '#dd6e6b', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#dd6e6b' }} />
                  <Area type="monotone" dataKey="Female" stroke="#a673d8" strokeWidth={2} fill="url(#gFemale)" dot={{ r: 3, fill: '#a673d8', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#a673d8' }} />
                  <Area type="monotone" dataKey="Male" stroke="#73dae1" strokeWidth={2} fill="url(#gMale)" dot={{ r: 3, fill: '#73dae1', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#73dae1' }} />
                  <Area type="monotone" dataKey="Target" stroke="#a5df6a" strokeWidth={2} strokeDasharray="5 4" fill="none" dot={{ r: 3, fill: '#a5df6a', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#a5df6a' }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── ROW 1: Gender Pie + Sector Pie ── */}
          {/* ── PIE CHARTS (left) + SDD BAR (right) ── */}
          <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>

            {/* Left column: Gender + Sector pies stacked */}
            <div className="col-span-1 flex flex-col gap-6">

              {/* Gender Pie */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden flex-1">
                <div className="px-4 pt-4 pb-0">
                  <SectionTitle>Gender Distribution</SectionTitle>
                </div>
                {stats.total === 0 ? (
                  <p className="text-center text-neutral-300 dark:text-neutral-600 text-xs py-6">No data</p>
                ) : (
                  <div className="flex items-center">
                    <div className="flex flex-col gap-4 px-4 pb-4 shrink-0">
                      {stats.genderPie.map(g => (
                        <div key={g.name}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                            <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{g.name}</span>
                          </div>
                          <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100 leading-none">{g.value}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{pct(g.value, stats.total)}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0 aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                          <Pie data={stats.genderPie} dataKey="value" cx="50%" cy="50%" outerRadius="88%" innerRadius="52%" paddingAngle={4} cornerRadius={6} stroke="none">
                            {stats.genderPie.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [`${v} (${pct(v, stats.total)}%)`, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Sector Pie */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden flex-1">
                <div className="px-4 pt-4 pb-0">
                  <SectionTitle>Sector Breakdown</SectionTitle>
                </div>
                {stats.total === 0 ? (
                  <p className="text-center text-neutral-300 dark:text-neutral-600 text-xs py-6">No data</p>
                ) : (
                  <div className="flex items-center">
                    <div className="flex flex-col gap-3 px-4 pb-4 shrink-0">
                      {stats.sectorPie.map(s => (
                        <div key={s.name}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{s.name}</span>
                          </div>
                          <div className="text-xl font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0 aspect-square">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                          <Pie data={stats.sectorPie} dataKey="value" cx="50%" cy="50%" outerRadius="88%" innerRadius="52%" paddingAngle={4} cornerRadius={6} stroke="none">
                            {stats.sectorPie.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [`${v} (${pct(v, stats.total)}%)`, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Top Units */}
            <div className="col-span-2 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col">
              <SectionTitle>Top Units / Colleges</SectionTitle>
              {stats.unitGenderRanking.length === 0 ? (
                <p className="text-center text-neutral-300 dark:text-neutral-600 text-xs py-10">No data</p>
              ) : (
                <>
                  <div className="flex-1 flex flex-col justify-between">
                    {stats.unitGenderRanking.slice(0, 8).map((u) => {
                      const femaleShare = u.total ? u.female / u.total : 0;
                      return (
                        <div key={u.name}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 truncate pr-3">{u.name}</span>
                            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 shrink-0">
                              {u.total} • F {u.female} / M {u.male}
                            </span>
                          </div>
                          <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                            <div className="h-full transition-all" style={{ width: `${femaleShare * 100}%`, backgroundColor: '#a673d8' }} />
                            <div className="h-full transition-all" style={{ width: `${(1 - femaleShare) * 100}%`, backgroundColor: '#73dae1' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Support text */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-3">
                    {(() => {
                      const top = stats.unitGenderRanking[0];
                      const topFemale = [...stats.unitGenderRanking].sort((a, b) => b.female - a.female)[0];
                      const topMale = [...stats.unitGenderRanking].sort((a, b) => b.male - a.male)[0];
                      return (
                        <>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-0.5">Most Participants</p>
                            <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{top?.name}</p>
                            <p className="text-[9px] text-neutral-400 dark:text-neutral-500">{top?.total} total</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#a673d8' }}>Highest Female</p>
                            <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{topFemale?.name}</p>
                            <p className="text-[9px] text-neutral-400 dark:text-neutral-500">{topFemale?.female} F ({pct(topFemale?.female, topFemale?.total)}%)</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#73dae1' }}>Highest Male</p>
                            <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 truncate">{topMale?.name}</p>
                            <p className="text-[9px] text-neutral-400 dark:text-neutral-500">{topMale?.male} M ({pct(topMale?.male, topMale?.total)}%)</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Monthly Trend (Area) ── */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm print-page-break">
            <SectionTitle>Monthly Attendance Trend</SectionTitle>
            {stats.trend.length === 0 ? (
              <p className="text-center text-neutral-300 dark:text-neutral-600 text-xs py-10">No trend data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.trend}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFemale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a673d8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#a673d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                  <Area type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={2} fill="url(#gTotal)" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Male" stroke="#73dae1" strokeWidth={2} fill="none" dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="Female" stroke="#a673d8" strokeWidth={2} fill="url(#gFemale)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {stats.trend.length > 1 && (
              <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                Trend direction (Total):{" "}
                <span className={stats.trendDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {stats.trendDelta >= 0 ? '+' : ''}{stats.trendDelta}
                </span>{' '}
                net change from first to last month
              </p>
            )}
          </div>

          {/* ── ROW 4: Session SDD + Office/College SDD ── */}
          <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>

            {/* Session SDD (Male vs Female) */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <SectionTitle>Session Attendance SDD</SectionTitle>

              {stats.sessionGenderData.length === 0 ? (
                <p className="text-center text-neutral-300 dark:text-neutral-600 text-xs py-10">No session data</p>
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

                  <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                    Top gate: <span className="text-neutral-700 dark:text-neutral-300">{stats.sessionGenderData[0].name}</span> •{" "}
                    {stats.sessionGenderData[0].Female} Female / {stats.sessionGenderData[0].Male} Male
                  </p>
                </>
              )}
            </div>

            {/* SDD by Sector */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <SectionTitle>Sex-Disaggregated Data by Sector</SectionTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.sectorData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="sector" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} formatter={(v, n) => [v, n]} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                  <Bar dataKey="Male" fill={GENDER_COLORS.Male} barSize={24} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Female" fill={GENDER_COLORS.Female} barSize={24} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                Largest sector: <span className="text-neutral-700 dark:text-neutral-300">{stats.topSector}</span> •{" "}
                Female {stats.sectorData.find(s => s.sector === stats.topSector)?.Female ?? 0} / Male{" "}
                {stats.sectorData.find(s => s.sector === stats.topSector)?.Male ?? 0} •{" "}
                {stats.topSectorFemalePct}% female
              </p>
            </div>
          </div>

          {/* ── ROW 5: Additional SDD breakdowns ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age SDD */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
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
              <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                Top age band: <span className="text-neutral-700 dark:text-neutral-300">{stats.topAgeBand}</span>
              </p>
            </div>

            {/* Employment SDD */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
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
              <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                Top status: <span className="text-neutral-700 dark:text-neutral-300">{stats.topEmployment}</span>
              </p>
            </div>

            {/* PWD SDD */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm print-page-break">
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
              <p className="mt-3 text-[9px] font-bold text-neutral-400 dark:text-neutral-500">
                PWD “Yes”: <span className="text-neutral-700 dark:text-neutral-300">{stats.pwdYes}</span> • {stats.pwdYesPct}%
              </p>
            </div>
          </div>

          {/* ── EVENT COMPARISON TABLE ── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden print-page-break">
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Event-by-Event Comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800/60">
                    {['Event', 'Date', 'Status', 'Total', 'Male', 'Female', '% Female', 'Top Unit'].map(h => (
                      <th key={h} className="px-4 py-3 text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {stats.eventTable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-xs text-neutral-300 dark:text-neutral-600 py-10 italic">No events with participants in this filter range</td>
                    </tr>
                  ) : (
                    stats.eventTable.map(ev => (
                      <tr key={ev.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-neutral-800 dark:text-neutral-200 max-w-[180px] truncate">{ev.title}</td>
                        <td className="px-4 py-3 text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">{ev.date}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${ev.status === 'Done'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : ev.status === 'Cancelled'
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>{ev.status || 'Active'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-neutral-900 dark:text-neutral-100">{ev.total}</td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: '#73dae1' }}>{ev.male}</td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: '#a673d8' }}>{ev.female}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${ev.femalePct}%`, backgroundColor: '#a673d8' }} />
                            </div>
                            <span className="text-[10px] font-black text-neutral-700 dark:text-neutral-300">{ev.femalePct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-neutral-500 dark:text-neutral-400 max-w-[140px] truncate">{ev.topUnit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── EXECUTIVE SUMMARY ── */}
          <div className="flex items-start gap-6 pb-4">
            {!compact && (
              <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                <span className="text-5xl font-black leading-none" style={{ color: '#a5df6a' }}>
                  {stats.femalePct}%
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 text-center">Female<br />Composition</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Executive Summary</p>
              <p className="font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed italic text-sm">"{stats.narrative}"</p>
            </div>
          </div>

          {/* ── PRINT FOOTER ── */}
          <div className="hidden print:block mt-8 pt-4 border-t text-[9px] text-slate-400 flex justify-between">
            <span>GAD Event Manager — Confidential</span>
            <span>Page 1</span>
          </div>


        </div>{/* end space-y-6 */}
      </div>{/* end scrollable content */}
    </div>
  );
}