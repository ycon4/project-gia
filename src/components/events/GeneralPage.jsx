import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, AreaChart, Area, Brush
} from 'recharts';
import {
  Users, Calendar, Filter, RefreshCcw, BookOpen, Briefcase,
  UserCircle, GraduationCap, ChevronDown, Layers, User, Accessibility, Palette,
  FileText, Send
} from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';

// ─── MSU-IIT PROFESSIONAL SYSTEM COLOR THEMES ──────────────────────────────────
const COLOR_THEMES = {
  original: {
    name: 'MSU-IIT Official (Signature)',
    Male: '#741112',    // Academic Maroon
    Female: '#D4AF37',  // Academic Gold
    palette: [
      '#530B0C', // Deep Velvet Maroon
      '#741112', // Signature Maroon
      '#9B2A2B', // Terracotta Crimson
      '#D4AF37', // Academic Gold
      '#ECC142', // Sunlit Amber
      '#475569', // Slate Gray (Neutral balance)
      '#334155', // Charcoal
      '#1E293B'  // Dark Navy
    ],
  },
  purpleAmber: {
    name: 'GIA Purple',
    Male: '#f59e0b',
    Female: '#c084fc',
    palette: ['#c084fc', '#d8b4fe', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
  ocean: {
    name: 'Ocean Blue',
    Male: '#0ea5e9',
    Female: '#06b6d4',
    palette: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22d3ee', '#3b82f6', '#60a5fa', '#0891b2', '#0284c7'],
  },
  forest: {
    name: 'Forest Green',
    Male: '#10b981',
    Female: '#84cc16',
    palette: ['#10b981', '#84cc16', '#22c55e', '#4ade80', '#059669', '#65a30d', '#16a34a', '#86efac'],
  },
};

const SECTOR_ICONS = {
  Student: GraduationCap,
  Faculty: BookOpen,
  Staff: Briefcase,
  'Other Beneficiaries': UserCircle,
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
  return null;
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
function KPICard({ label, value, sub, accent = '#741112', icon: Icon, change }) {
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
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl transition-all duration-300"
          style={{ backgroundColor: hovered ? accent + '35' : accent + '18' }}>
          {Icon && <Icon size={26} style={{ color: accent }} strokeWidth={1.8} />}
        </div>
        {hasChange && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${isPos ? 'text-emerald-500 dark:text-emerald-400' : isNeg ? 'text-red-500 dark:text-red-400' : 'text-neutral-400'}`}
            style={{ backgroundColor: isPos ? 'rgba(52,211,153,0.12)' : isNeg ? 'rgba(248,113,113,0.12)' : 'rgba(115,115,115,0.10)' }}>
            {isPos ? '▲' : isNeg ? '▼' : '─'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <span className="text-3xl font-black leading-none text-neutral-900 dark:text-neutral-100">{value}</span>
      <div>
        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-neutral-400 dark:text-neutral-600">Analytics</p>
      <h3 className="text-base font-black leading-none text-neutral-900 dark:text-neutral-100">{children}</h3>
    </div>
  );
}

function RankRow({ rank, name, count, total, color = '#741112' }) {
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

// ─── MAIN ECOSYSTEM DASHBOARD ──────────────────────────────────────────────────
export default function GeneralDashboard({ events = [], attendanceData = [], compact = false }) {
  const isDark = useIsDark();

  // ── Filter State ──
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentTheme, setCurrentTheme] = useState('original');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const reportRef = useRef(null);
  const themeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const COLORS = useMemo(() => COLOR_THEMES[currentTheme], [currentTheme]);

  const SECTOR_COLORS = useMemo(() => ({
    Student: COLORS.Female,
    Faculty: COLORS.Male,
    Staff: COLORS.palette[2],
    'Other Beneficiaries': COLORS.palette[3],
  }), [COLORS]);

  const GENDER_COLORS = useMemo(() => ({
    Male: COLORS.Male,
    Female: COLORS.Female,
  }), [COLORS]);

  // ── Filter Data Query ──
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

  // ── Transform Core Metrics ──
  const stats = useMemo(() => {
    const total = filtered.length;
    const male = filtered.reduce((acc, d) => acc + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
    const female = filtered.reduce((acc, d) => acc + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
    const pwdYes = filtered.reduce((acc, d) => acc + ((d.pwd_status ?? '').toString().trim() === 'Yes' ? 1 : 0), 0);

    const sectors = ['Student', 'Faculty', 'Staff', 'Other Beneficiaries'];
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

    const sessionGenderMap = {};
    filtered.forEach((d) => {
      const s = getSessionName(d);
      if (!sessionGenderMap[s]) sessionGenderMap[s] = { name: s, Male: 0, Female: 0, total: 0 };
      sessionGenderMap[s].total += 1;
      const sk = sexKey(d.sex);
      if (sk === 'Male') sessionGenderMap[s].Male += 1;
      if (sk === 'Female') sessionGenderMap[s].Female += 1;
    });
    const sessionGenderData = Object.values(sessionGenderMap).sort((a, b) => b.total - a.total).slice(0, 8);
    const sessionFunnel = sessionGenderData.map((s) => ({ name: s.name, value: s.total })).sort((a, b) => b.value - a.value);

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
    const employmentGenderData = Object.values(employmentGenderMap).sort((a, b) => b.total - a.total).slice(0, 8);
    const topEmployment = employmentGenderData[0]?.name || 'N/A';

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

    const eventTable = events
      .filter((ev) => selectedStatus === 'All' || ev.status === selectedStatus)
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

    const narrative = total === 0 ? 'No data available for the selected filters.' :
      `This reporting period recorded ${total} total participants across ${events.filter((e) => filtered.some((d) => String(d.eventId) === String(e.id))).length} event(s). Top participation came from ${topUnit}. Gender composition is ${femalePct}% female (gender gap: ${genderGap > 0 ? '+' : ''}${genderGap} pts). The largest sector group is ${topSector}, while the most active gate/session is ${topSession}. ${pwdYes > 0 ? `${pwdYes} participant(s) were recorded as PWD.` : 'No PWD participants were recorded in this period.'}`;

    const eventChart = events
      .map(ev => {
        const evData = filtered.filter(d => String(d.eventId) === String(ev.id));
        const m = evData.reduce((a, d) => a + (sexKey(d.sex) === 'Male' ? 1 : 0), 0);
        const f = evData.reduce((a, d) => a + (sexKey(d.sex) === 'Female' ? 1 : 0), 0);
        const label = ev.title.length > 22 ? ev.title.slice(0, 21) + '…' : ev.title;
        const target = ev.targetParticipants ? Number(ev.targetParticipants) : null;
        return { name: label, Total: evData.length, Male: m, Female: f, Target: target, _date: ev.startDate || ev.date || '' };
      })
      .filter(e => e.Total > 0)
      .sort((a, b) => a._date.localeCompare(b._date));

    let changes = { total: null, female: null, male: null, pwd: null };
    if (dateRange.start) {
      const startMs = new Date(dateRange.start).getTime();
      const endMs = dateRange.end ? new Date(new Date(dateRange.end).setHours(23, 59, 59)).getTime() : Date.now();
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
      total, male, female, pwdYes, pwdYesPct, sectorData, genderPie, sectorPie,
      unitRanking, unitGenderRanking, trend, sessionGenderData, sessionFunnel,
      ageGenderData, topAgeBand, employmentGenderData, topEmployment, pwdGenderData,
      eventTable, narrative, femalePct, topSector, topSectorFemalePct, topSession,
      trendDelta, changes, eventChart,
    };
  }, [filtered, events, attendanceData, dateRange, selectedSector, selectedEvent, selectedStatus, GENDER_COLORS, SECTOR_COLORS]);

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedSector('All');
    setSelectedEvent('All');
    setSelectedStatus('All');
  };

  return (
    <div className="flex flex-col h-full">
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

      {/* ── FILTER HEADER CONTROL BAR ── */}
      <div className="print-hide shrink-0 h-12 px-8 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <Calendar size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <input type="date"
            className="bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
          <span className="text-neutral-300 dark:text-neutral-700">—</span>
          <input type="date"
            className="bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        <div className="relative flex items-center gap-1.5">
          <Filter size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4"
            value={selectedSector} onChange={e => setSelectedSector(e.target.value)}>
            <option value="All">All Sectors</option>
            {['Student', 'Faculty', 'Staff', 'Other Beneficiaries'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        <div className="relative flex items-center gap-1.5">
          <Layers size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4 max-w-[200px]"
            value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="All">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        <div className="relative flex items-center gap-1.5">
          <Filter size={11} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <select
            className="appearance-none bg-transparent outline-none text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer pr-4"
            value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <ChevronDown size={10} className="absolute right-0 text-neutral-400 dark:text-neutral-600 pointer-events-none" />
        </div>

        <button onClick={resetFilters} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
          <RefreshCcw size={11} /> Reset
        </button>

        <span className="text-neutral-300 dark:text-neutral-800 select-none">|</span>

        <div className="relative" ref={themeRef}>
          <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">
            <Palette size={11} /> Theme
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[180px]">
              {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => { setCurrentTheme(key); setShowThemeMenu(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${currentTheme === key ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}>
                  <span>{theme.name}</span>
                  {currentTheme === key && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE DASHBOARD ECOLOGY ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8" id="gad-report" ref={reportRef}>
        <div className="hidden print:block mb-6 border-b pb-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gender and Development Office</p>
          <h1 className="text-2xl font-black text-slate-900 uppercase">GAD Event Participation Report</h1>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Generated: {new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}
            {dateRange.start && ` | Period: ${dateRange.start} to ${dateRange.end || 'present'}`}
          </p>
        </div>

        <div className="flex flex-col gap-6 pt-6 pb-20">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-0.5">MSU-IIT GAD Office</p>
            <h1 className="text-2xl font-black leading-none text-neutral-900 dark:text-neutral-100">Events Dashboard</h1>
          </div>

          {/* ── KPI GRID STRIP ── */}
          <div className={`grid gap-6 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
            <KPICard label="Total Participants" value={stats.total.toLocaleString()} icon={Users} accent={COLORS.palette[1]} sub={`${events.length} event(s) total`} change={stats.changes.total} />
            <KPICard label="Female Participants" value={stats.female.toLocaleString()} icon={UserCircle} accent={COLORS.Female} sub={`${stats.femalePct}% of total`} change={stats.changes.female} />
            <KPICard label="Male Participants" value={stats.male.toLocaleString()} icon={User} accent={COLORS.Male} sub={`${pct(stats.male, stats.total)}% of total`} change={stats.changes.male} />
            <KPICard label="PWD Participants" value={stats.pwdYes.toLocaleString()} icon={Accessibility} accent={COLORS.palette[5]} sub={`${stats.pwdYesPct}% of total`} change={stats.changes.pwd} />
          </div>

          {/* ── 1. COMPREHENSIVE PARTICIPATION SCALABLE GRAPH ── */}
          <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212]">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-neutral-400 dark:text-neutral-600">Overview</p>
                <h3 className="text-base font-black leading-none text-neutral-900 dark:text-neutral-100">Participation & Target Analytics</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS.Male }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Male</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS.Female }} /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Female</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 inline-block border-t-2 border-dashed border-neutral-400" /><span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Target Threshold</span></div>
              </div>
            </div>

            <div className="p-4 pt-2">
              {stats.eventChart.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-neutral-400 dark:text-neutral-600 text-xs italic">No event records available</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={stats.eventChart} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gMaroon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.Male} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.Male} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.Female} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.Female} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#262626' : '#f0f0f0'} strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} dy={6} />
                    <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? '#333333' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="Male" stroke={COLORS.Male} strokeWidth={2} fillOpacity={1} fill="url(#gMaroon)" name="Male" />
                    <Area type="monotone" dataKey="Female" stroke={COLORS.Female} strokeWidth={2} fillOpacity={1} fill="url(#gGold)" name="Female" />
                    {stats.eventChart.some(e => e.Target) && (
                      <Area type="monotone" dataKey="Target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Target Base" dot={false} />
                    )}
                    {/* Native multi-record brush control handle to safely view thousands of records */}
                    {stats.eventChart.length > 8 && (
                      <Brush dataKey="name" height={18} stroke={COLORS.Male + '40'} fill={isDark ? '#1f1f1f' : '#f8fafc'} tickFormatter={() => ''} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── 2. SECTOR DISTRIBUTION GRAPH WITH GEOMETRY FIX ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5">
              <SectionTitle>Institutional Sectors Mapping</SectionTitle>
              <div className="mt-4 flex justify-center">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.sectorData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#262626' : '#f0f0f0'} strokeOpacity={0.4} />
                    <XAxis dataKey="sector" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 9, fontWeight: 600 }} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? '#333333' : '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                    {/* Applied radius profile cap to soften layout boxes */}
                    <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} maxBarSize={28} name="Male" />
                    <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} maxBarSize={28} name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── 3. AGE BRACKET POPULATION METRICS ── */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5">
              <SectionTitle>Demographics Bandwidth (Age)</SectionTitle>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.ageGenderData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#262626' : '#f0f0f0'} strokeOpacity={0.4} />
                    <XAxis dataKey="band" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? '#333333' : '#e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} maxBarSize={22} name="Male" />
                    <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} maxBarSize={22} name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── 4. CHANNELS / GATES ACTIVITY SCALABLE ROW ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 md:col-span-2">
              <SectionTitle>Top Performance Units (Colleges/Offices)</SectionTitle>
              <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[250px] overflow-y-auto pr-2">
                {stats.unitGenderRanking.length === 0 ? (
                  <p className="text-xs italic text-neutral-400 p-4">No unit tracking logged</p>
                ) : (
                  stats.unitGenderRanking.slice(0, 15).map((u, i) => (
                    <div key={u.name} className="flex items-center justify-between py-2.5 text-xs">
                      <div className="flex items-center gap-3 truncate max-w-[65%]">
                        <span className="font-mono text-[10px] text-neutral-400 w-4">{i + 1}</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{u.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] text-neutral-400"><span className="text-neutral-600 dark:text-neutral-300 font-medium">{u.male}</span> M</span>
                        <span className="text-[10px] text-neutral-400"><span className="text-neutral-600 dark:text-neutral-300 font-medium">{u.female}</span> F</span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 w-12 text-right">{u.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PWD BREAKDOWN PIE */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5">
              <SectionTitle>Inclusivity Index (PWD)</SectionTitle>
              <div className="mt-2 flex flex-col items-center justify-center h-full pb-6">
                {stats.pwdGenderData.length === 0 ? (
                  <p className="text-xs italic text-neutral-400">No inclusion markers logged</p>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-black text-neutral-800 dark:text-neutral-100">{stats.pwdYesPct}%</span>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Active Vulnerable Sector<br />Involvement Rate</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 5. MASTER INSTITUTIONAL AUDIT DIRECTORY ── */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <SectionTitle>Event Compilation Matrix</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-[#181818] text-neutral-400 text-[10px] font-black uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-6">Event Context</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aggregate</th>
                    <th className="py-3 px-4 text-right">Male</th>
                    <th className="py-3 px-4 text-right">Female</th>
                    <th className="py-3 px-4 text-right">F-Ratio</th>
                    <th className="py-3 px-6">Primary Demographic Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  {stats.eventTable.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-400 italic">No events match the selected criteria</td>
                    </tr>
                  ) : (
                    stats.eventTable.map((ev) => (
                      <tr key={ev.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-neutral-900 dark:text-neutral-100">{ev.title}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">{ev.date || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-wide rounded-full ${ev.status === 'Done' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">{ev.total.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right text-neutral-500">{ev.male}</td>
                        <td className="py-3.5 px-4 text-right text-neutral-500">{ev.female}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-neutral-600 dark:text-neutral-400">{ev.femalePct}%</td>
                        <td className="py-3.5 px-6 truncate max-w-[180px] text-neutral-500 dark:text-neutral-400" title={ev.topUnit}>{ev.topUnit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 6. EXECUTIVE SUMMARY TEXT NARRATIVE ── */}
          <div className="flex items-start gap-6 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-6">
            {!compact && (
              <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                <span className="text-5xl font-black leading-none" style={{ color: COLORS.Female }}>
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

          <div className="hidden print:block mt-8 pt-4 border-t text-[9px] text-slate-400 flex justify-between">
            <span>GAD Event Manager — MSU-IIT Confidential Institutional Data</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}