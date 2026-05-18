import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Brush
} from 'recharts';
import {
  Users, TrendingUp, BarChart3, Percent, Building2, Venus, Mars, Target, ChevronDown
} from 'lucide-react';

// ─── INSTITUTIONAL COLOR HARMONY (MSU-IIT THEME) ──────────────────────────────
const MSU_IIT_THEME = {
  Male: '#741112',    // Academic Maroon
  Female: '#D4AF37',  // Academic Gold
  palette: [
    '#530B0C', // Deep Velvet Maroon
    '#741112', // Signature Maroon
    '#9B2A2B', // Terracotta Crimson
    '#D4AF37', // Academic Gold
    '#ECC142', // Sunlit Amber
    '#475569', // Slate Gray
    '#334155', // Charcoal Slate
    '#1E293B'  // Deep Space Dark
  ]
};

const CHART_TABS = [
  { id: 'gender', label: 'Gender Profile' },
  { id: 'office', label: 'Office / College Matrix' },
  { id: 'sector', label: 'Sector Distribution' },
  { id: 'age', label: 'Age Groupings' },
  { id: 'employment', label: 'Employment Status Mix' },
];

// ─── REUSABLE PREMIUM CARD ARCHITECTURE ──────────────────────────────────────
const StatCard = ({ label, value, sub, Icon, colorClass, bgClass }) => (
  <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} shrink-0`}>
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none mb-1">{value}</span>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
      {sub && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate leading-none mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── REUSABLE TRANSPARENT DATA CONTAINER ─────────────────────────────────────
const ChartPanel = ({ title, subtitle, children }) => (
  <div className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col h-[340px]">
    <div className="mb-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">{subtitle}</p>
      <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 tracking-tight">{title}</h3>
    </div>
    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
      {children}
    </div>
  </div>
);

// ─── HOOK FOR DARK MODE IDENTIFICATION ───────────────────────────────────────
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

export default function EventVisuals({ attendanceData = [], filteredAttendance = [], eventTarget = 0, chartsOnly = false }) {
  const [activeChart, setActiveChart] = useState('gender');
  const isDark = useIsDark();

  // ─── CALCULATE UNIQUE PARTICIPANTS (deduplicate by email or id_number) ───────
  const uniqueParticipants = useMemo(() => {
    const seen = new Set();
    const unique = [];

    // Use attendanceData (all sessions) for overall stats, not filteredAttendance
    const dataToUse = chartsOnly ? attendanceData : filteredAttendance;

    dataToUse.forEach(row => {
      // Use email as primary identifier, fallback to id_number, then fullName
      const identifier = row.email || row.id_number || row.fullName;
      if (identifier && !seen.has(identifier)) {
        seen.add(identifier);
        unique.push(row);
      }
    });

    return unique;
  }, [attendanceData, filteredAttendance, chartsOnly]);

  // ─── INTERACTIVE DATA PARSING SWEATER ───────────────────────────────────────
  const stats = useMemo(() => {
    const total = uniqueParticipants.length;
    let female = 0;
    let male = 0;

    const officeGender = {};
    const sectorGender = {};
    const ageGender = {};
    const empGender = {};

    uniqueParticipants.forEach((row) => {
      const sex = row.sex === 'Female' ? 'Female' : row.sex === 'Male' ? 'Male' : null;
      if (sex === 'Female') female++;
      if (sex === 'Male') male++;

      if (sex) {
        // Office Mapping
        const off = row.office_college || 'External / N/A';
        if (!officeGender[off]) officeGender[off] = { name: off, Male: 0, Female: 0, Total: 0 };
        officeGender[off][sex]++;
        officeGender[off].Total++;

        // Sector Mapping
        const sec = row.sector || 'Other Beneficiaries';
        if (!sectorGender[sec]) sectorGender[sec] = { name: sec, Male: 0, Female: 0, Total: 0 };
        sectorGender[sec][sex]++;
        sectorGender[sec].Total++;

        // Age Mapping
        const ageVal = parseInt(row.age, 10);
        let ageBand = 'Unknown';
        if (!isNaN(ageVal)) {
          if (ageVal < 18) ageBand = 'Under 18';
          else if (ageVal <= 24) ageBand = '18–24';
          else if (ageVal <= 34) ageBand = '25–34';
          else if (ageVal <= 44) ageBand = '35–44';
          else if (ageVal <= 54) ageBand = '45–54';
          else ageBand = '55+';
        }
        if (ageBand !== 'Unknown') {
          if (!ageGender[ageBand]) ageGender[ageBand] = { name: ageBand, Male: 0, Female: 0, Total: 0 };
          ageGender[ageBand][sex]++;
          ageGender[ageBand].Total++;
        }

        // Employment Mapping
        const emp = row.employment_status || 'N/A';
        if (!empGender[emp]) empGender[emp] = { name: emp, Male: 0, Female: 0, Total: 0 };
        empGender[emp][sex]++;
        empGender[emp].Total++;
      }
    });

    const targetNum = Number(eventTarget) || 0;
    const progressPct = targetNum > 0 ? ((total / targetNum) * 100).toFixed(1) : '100';

    // Format and Sort Arrays cleanly for Recharts feeding
    const officeArray = Object.values(officeGender).sort((a, b) => b.Total - a.Total);
    const sectorArray = Object.values(sectorGender).sort((a, b) => b.Total - a.Total);

    const ageOrder = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
    const ageArray = ageOrder.map(band => ageGender[band] || { name: band, Male: 0, Female: 0, Total: 0 }).filter(a => a.Total > 0);

    const employmentArray = Object.values(empGender).sort((a, b) => b.Total - a.Total);

    const genderPieData = [
      { name: 'Male', value: male, color: MSU_IIT_THEME.Male },
      { name: 'Female', value: female, color: MSU_IIT_THEME.Female }
    ].filter(g => g.value > 0);

    return {
      total, female, male, progressPct, targetNum,
      officeArray, sectorArray, ageArray, employmentArray, genderPieData
    };
  }, [uniqueParticipants, eventTarget]);

  // ─── GLASSMORPHIC TOOLTIP STYLING PATTERN ───────────────────────────────────
  const tooltipStyle = {
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    borderColor: isDark ? '#2e2e2e' : '#e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    fontSize: '11px',
    fontWeight: '600',
    color: isDark ? '#f5f5f5' : '#1a1a1a'
  };

  const gridLineColor = isDark ? '#262626' : '#f0f0f0';

  return (
    <div className="space-y-6">

      {/* ─── BANNER KPI STRIP BLOCK ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Unique Participants"
          value={stats.total.toLocaleString()}
          sub="Deduplicated attendees"
          Icon={Users}
          bgClass="bg-maroon-50 dark:bg-maroon-950/20"
          colorClass="text-[#741112]"
        />
        <StatCard
          label="Female Ratio"
          value={stats.total > 0 ? `${((stats.female / stats.total) * 100).toFixed(1)}%` : '0%'}
          sub={`${stats.female.toLocaleString()} absolute records`}
          Icon={Venus}
          bgClass="bg-amber-50 dark:bg-amber-950/20"
          colorClass="text-[#D4AF37]"
        />
        <StatCard
          label="Male Ratio"
          value={stats.total > 0 ? `${((stats.male / stats.total) * 100).toFixed(1)}%` : '0%'}
          sub={`${stats.male.toLocaleString()} absolute records`}
          Icon={Mars}
          bgClass="bg-neutral-50 dark:bg-neutral-800"
          colorClass="text-neutral-600 dark:text-neutral-300"
        />
        <StatCard
          label="Target Efficiency"
          value={`${stats.progressPct}%`}
          sub={stats.targetNum > 0 ? `Bound limit: ${stats.targetNum}` : 'No target threshold set'}
          Icon={Target}
          bgClass="bg-emerald-50 dark:bg-emerald-950/10"
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ─── INTERACTIVE TAB SELECTOR BAR ─── */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-px scrollbar-none">
        {CHART_TABS.map((tab) => {
          const isActive = activeChart === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 -mb-px ${isActive
                ? 'border-[#741112] text-[#741112] dark:text-[#ea585c]'
                : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── PROFESSIONAL CHART RENDER INTERFACES ─── */}
      {stats.total === 0 ? (
        <div className="h-64 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center text-neutral-400 p-6">
          <BarChart3 size={24} className="mb-2 text-neutral-300 dark:text-neutral-700 animate-pulse" />
          <p className="text-xs font-bold">No categorical demographic metrics found for this specific event scope</p>
        </div>
      ) : (
        <div className="animate-fade-in">

          {/* GENDER PROFILE PANEL (PIE) */}
          {activeChart === 'gender' && (
            <ChartPanel title="Gender Metric Share" subtitle="Proportional Balance">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genderPieData}
                    cx="50%"
                    cy="48%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.genderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* OFFICE / COLLEGE MATRIX (SCALABLE BAR + BRUSH WINDOW) */}
          {activeChart === 'office' && (
            <ChartPanel title="Campus Units & External Distributions" subtitle="Organizational Demographics">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.officeArray} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridLineColor} strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 9, fontWeight: 600 }} tickLine={false} />
                  <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Male" fill={MSU_IIT_THEME.Male} radius={[4, 4, 0, 0]} maxBarSize={24} name="Male Staff" />
                  <Bar dataKey="Female" fill={MSU_IIT_THEME.Female} radius={[4, 4, 0, 0]} maxBarSize={24} name="Female Staff" />
                  {/* 🚀 THOUSANDS OF RECORDS WINDOW HANDLE: Attaches custom horizontal scroll panning dynamically */}
                  {stats.officeArray.length > 5 && (
                    <Brush dataKey="name" height={16} stroke={MSU_IIT_THEME.Male + '25'} fill={isDark ? '#1a1a1a' : '#f8fafc'} tickFormatter={() => ''} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* SECTOR DISTRIBUTION MATRIX */}
          {activeChart === 'sector' && (
            <ChartPanel title="Institutional Operational Sectors" subtitle="Structural Classifications">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sectorArray} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridLineColor} strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} />
                  <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Male" fill={MSU_IIT_THEME.Male} radius={[4, 4, 0, 0]} maxBarSize={32} name="Male Base" />
                  <Bar dataKey="Female" fill={MSU_IIT_THEME.Female} radius={[4, 4, 0, 0]} maxBarSize={32} name="Female Base" />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* AGE DISTRIBUTION BRACKETS */}
          {activeChart === 'age' && (
            <ChartPanel title="Generational Demographics Spectrum" subtitle="Age Distribution Range">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ageArray} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridLineColor} strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} />
                  <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Male" fill={MSU_IIT_THEME.Male} radius={[4, 4, 0, 0]} maxBarSize={28} name="Male" />
                  <Bar dataKey="Female" fill={MSU_IIT_THEME.Female} radius={[4, 4, 0, 0]} maxBarSize={28} name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* EMPLOYMENT STATUS INFRASTRUCTURE */}
          {activeChart === 'employment' && (
            <ChartPanel title="Employment Tenure Commitments" subtitle="Contract Mix">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.employmentArray} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridLineColor} strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} />
                  <YAxis tick={{ fill: isDark ? '#8c8c8c' : '#6b7280', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Male" fill={MSU_IIT_THEME.Male} radius={[4, 4, 0, 0]} maxBarSize={26} name="Male Assignment" />
                  <Bar dataKey="Female" fill={MSU_IIT_THEME.Female} radius={[4, 4, 0, 0]} maxBarSize={26} name="Female Assignment" />
                  {stats.employmentArray.length > 5 && (
                    <Brush dataKey="name" height={16} stroke={MSU_IIT_THEME.Male + '25'} fill={isDark ? '#1a1a1a' : '#f8fafc'} tickFormatter={() => ''} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

        </div>
      )}

    </div>
  );
}