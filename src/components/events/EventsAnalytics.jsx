import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, Percent, Building2, Venus, Mars, Target } from 'lucide-react';
import Chart from 'chart.js/auto';

// --- Constants ---
const PALETTE = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea', '#0ea5e9', '#84cc16', '#f43f5e'];

const CHART_TABS = [
  { id: 'gender', label: 'Gender' },
  { id: 'office', label: 'Office / College' },
  { id: 'sector', label: 'Sector' },
  { id: 'age', label: 'Age Distribution' },
  { id: 'employment', label: 'Employment' },
];

// --- Sub-Components ---
const StatCard = ({ label, value, sub, Icon, colorClass, bgClass }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}><Icon size={18} /></div>
    <div className="min-w-0 flex-1">
      <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 truncate">{label}</div>
      <div className="text-xl font-black text-neutral-800 dark:text-neutral-100 leading-tight">{value}</div>
      <div className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium truncate">{sub}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 shadow-sm ${className}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">{title}</p>
    {children}
  </div>
);

const GenderFigure = ({ percent, color, label, Icon }) => {
  const safePct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="flex flex-col items-center group">
      <div
        className="relative w-14 h-28 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.03]"
        aria-label={`${label} ${safePct}%`}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{ height: `${safePct}%`, backgroundColor: color, opacity: 0.18 }}
        />
        <div className="relative">
          <Icon size={34} color={color} />
        </div>
      </div>
      <span className="text-xl font-black mt-2" style={{ color }}>{safePct}%</span>
      <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter">{label}</span>
    </div>
  );
};

// --- Main Component ---
export const EventAnalyticsDashboard = ({ attendanceData = [], filteredAttendance = [], activeEvent = null, selectedSession = '', statsOnly = false, chartsOnly = false }) => {
  const [activeChart, setActiveChart] = useState('gender');
  const canvasRefs = { sector: useRef(null), age: useRef(null), emp: useRef(null) };

  // 1. Unified Data Engine
  const stats = useMemo(() => {
    const selectedData = filteredAttendance || [];
    const allAttendance = attendanceData || [];

    const counts = { female: 0, male: 0, office: {}, sector: {}, age: {}, emp: {}, sessions: {} };
    const sessionSDD = {};
    const AGE_KEYS = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
    const officeGender = {};
    const sectorGender = {};
    const ageGender = {};
    const empGender = {};

    const norm = (v) => (v === null || v === undefined ? '' : String(v)).trim();
    const normLower = (v) => norm(v).toLowerCase();
    const isFemale = (sex) => ['female', 'f'].includes(normLower(sex));
    const isMale = (sex) => ['male', 'm'].includes(normLower(sex));

    // Session-by-gender breakdown across ALL attendance rows.
    const allSessionCounts = {};
    allAttendance.forEach((row) => {
      const sessionName = norm(row.session_name || row.session || 'Unknown');
      const sex = row.sex || row.gender || '';

      if (!sessionSDD[sessionName]) sessionSDD[sessionName] = { female: 0, male: 0, total: 0 };
      if (!allSessionCounts[sessionName]) allSessionCounts[sessionName] = 0;

      sessionSDD[sessionName].total += 1;
      allSessionCounts[sessionName] += 1;

      if (isFemale(sex)) sessionSDD[sessionName].female += 1;
      else if (isMale(sex)) sessionSDD[sessionName].male += 1;
    });

    // Selected-session aggregates for the metric cards.
    selectedData.forEach((d) => {
      const sex = d.sex || d.gender || '';
      const sexKey = isFemale(sex) ? 'female' : isMale(sex) ? 'male' : null;

      if (isFemale(sex)) counts.female += 1;
      else if (isMale(sex)) counts.male += 1;

      const off = norm(d.office_college || 'Unspecified');
      counts.office[off] = (counts.office[off] || 0) + 1;
      if (sexKey) {
        if (!officeGender[off]) officeGender[off] = { female: 0, male: 0 };
        officeGender[off][sexKey] += 1;
      }

      const sector = norm(
        d.sector || (d.pwd_status && d.pwd_status !== 'None' ? 'PWD' : 'General')
      );
      counts.sector[sector] = (counts.sector[sector] || 0) + 1;
      if (sexKey) {
        if (!sectorGender[sector]) sectorGender[sector] = { female: 0, male: 0 };
        sectorGender[sector][sexKey] += 1;
      }

      const age = parseInt(d.age, 10);
      if (!isNaN(age)) {
        const band =
          age < 18 ? 'Under 18'
            : age <= 24 ? '18–24'
              : age <= 34 ? '25–34'
                : age <= 44 ? '35–44'
                  : age <= 54 ? '45–54'
                    : '55+';
        counts.age[band] = (counts.age[band] || 0) + 1;
        if (sexKey) {
          if (!ageGender[band]) ageGender[band] = { female: 0, male: 0 };
          ageGender[band][sexKey] += 1;
        }
      }

      if (d.employment_status) {
        const emp = norm(d.employment_status);
        if (emp) counts.emp[emp] = (counts.emp[emp] || 0) + 1;
        if (emp && sexKey) {
          if (!empGender[emp]) empGender[emp] = { female: 0, male: 0 };
          empGender[emp][sexKey] += 1;
        }
      }

      const sessionName = norm(d.session_name || d.session || 'Unknown');
      counts.sessions[sessionName] = (counts.sessions[sessionName] || 0) + 1;
    });

    const total = selectedData.length;
    const preReg = allSessionCounts['Pre-Registration'] || 0;
    const maxGenderCount = Math.max(
      1,
      ...Object.values(sessionSDD).map((s) => Math.max(s.female, s.male))
    );

    return {
      ...counts,
      total,
      AGE_KEYS,
      femalePct: total ? Math.round((counts.female / total) * 100) : 0,
      malePct: total ? Math.round((counts.male / total) * 100) : 0,
      fidelity: preReg ? Math.round((total / preReg) * 100) : 0,
      preReg,
      officeTop: Object.entries(counts.office).sort((a, b) => b[1] - a[1]).slice(0, 5),
      sessionSDD,
      maxGenderCount,
      officeGender,
      sectorGender,
      ageGender,
      empGender
    };
  }, [filteredAttendance, attendanceData]);

  // 2. Chart Rendering Logic
  useEffect(() => {
    const charts = [];
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    // Sector SDD
    const sectorEntries = Object.entries(stats.sectorGender || {})
      .map(([name, g]) => ({ name, female: g.female || 0, male: g.male || 0, total: (g.female || 0) + (g.male || 0) }))
      .sort((a, b) => b.total - a.total);

    if (canvasRefs.sector.current && sectorEntries.length) {
      const top = sectorEntries.slice(0, 8);
      charts.push(new Chart(canvasRefs.sector.current, {
        type: 'bar',
        data: {
          labels: top.map((x) => x.name),
          datasets: [
            { label: 'Female', data: top.map((x) => x.female), backgroundColor: 'rgba(236, 72, 153, 0.85)', borderRadius: 6 },
            { label: 'Male', data: top.map((x) => x.male), backgroundColor: 'rgba(166, 115, 216, 0.85)', borderRadius: 6 },
          ],
        },
        options: { ...commonOpts, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } },
      }));
    }

    // Age SDD
    const ageEntries = stats.AGE_KEYS || [];
    const hasAge = ageEntries.some((k) => (stats.ageGender?.[k]?.female || 0) + (stats.ageGender?.[k]?.male || 0) > 0);

    if (canvasRefs.age.current && hasAge) {
      charts.push(new Chart(canvasRefs.age.current, {
        type: 'bar',
        data: {
          labels: stats.AGE_KEYS,
          datasets: [
            { label: 'Female', data: stats.AGE_KEYS.map((k) => stats.ageGender?.[k]?.female || 0), backgroundColor: 'rgba(236, 72, 153, 0.85)', borderRadius: 6 },
            { label: 'Male', data: stats.AGE_KEYS.map((k) => stats.ageGender?.[k]?.male || 0), backgroundColor: 'rgba(166, 115, 216, 0.85)', borderRadius: 6 },
          ],
        },
        options: { ...commonOpts, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } },
      }));
    }

    // Employment SDD
    const empEntries = Object.entries(stats.empGender || {})
      .map(([name, g]) => ({ name, female: g.female || 0, male: g.male || 0, total: (g.female || 0) + (g.male || 0) }))
      .sort((a, b) => b.total - a.total);

    if (canvasRefs.emp.current && empEntries.length) {
      const top = empEntries.slice(0, 8);
      charts.push(new Chart(canvasRefs.emp.current, {
        type: 'bar',
        data: {
          labels: top.map((x) => x.name),
          datasets: [
            { label: 'Female', data: top.map((x) => x.female), backgroundColor: 'rgba(236, 72, 153, 0.85)', borderRadius: 6 },
            { label: 'Male', data: top.map((x) => x.male), backgroundColor: 'rgba(166, 115, 216, 0.85)', borderRadius: 6 },
          ],
        },
        options: { ...commonOpts, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } },
      }));
    }

    return () => charts.forEach(c => c.destroy());
  }, [stats, activeChart]);

  const officeMaxKnownTotal = Math.max(
    1,
    ...(stats.officeTop || []).map(([name]) => (stats.officeGender?.[name]?.female || 0) + (stats.officeGender?.[name]?.male || 0))
  );

  const GIA_LILAC = '#a673d8';

  const targetNum = activeEvent?.targetParticipants ? Number(activeEvent.targetParticipants) : null;

  return (
    <div className="space-y-6">
      {/* Stat Cards — grid layout changes based on statsOnly prop */}
      {!chartsOnly && <div className="grid grid-cols-2 gap-3">
        {/* Row 1 */}
        <StatCard label="Total" value={stats.total} sub={selectedSession} Icon={Users} colorClass="text-sky-600" bgClass="bg-sky-50 dark:bg-sky-950/20" />
        {targetNum ? (
          <StatCard
            label="Target"
            value={targetNum}
            sub={stats.total >= targetNum ? '✓ Goal reached' : `${targetNum - stats.total} remaining`}
            Icon={Target}
            colorClass="text-[#a5df6a]"
            bgClass="bg-[#a5df6a]/10"
          />
        ) : (
          <StatCard label="Target" value="—" sub="Not set" Icon={Target} colorClass="text-neutral-400" bgClass="bg-neutral-100 dark:bg-neutral-800" />
        )}
        {/* Row 2 */}
        <StatCard label="Female" value={`${stats.femalePct}%`} sub={`${stats.female} pax`} Icon={Percent} colorClass="text-rose-500" bgClass="bg-rose-50 dark:bg-rose-950/20" />
        <StatCard label="Male" value={`${stats.malePct}%`} sub={`${stats.male} pax`} Icon={Percent} colorClass="text-gia-600 dark:text-gia-400" bgClass="bg-gia-50 dark:bg-gia-950/20" />
      </div>}

      {/* Chart Selector Tabs */}
      {!statsOnly &&
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          {/* Tab bar */}
          <div className="border-b border-neutral-200 dark:border-neutral-700 flex overflow-x-auto">
            {CHART_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className="px-5 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
                style={activeChart === tab.id
                  ? { borderColor: GIA_LILAC, color: GIA_LILAC }
                  : { borderColor: 'transparent', color: '#9ca3af' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chart Content */}
          <div className="p-5">
            {/* GENDER */}
            {activeChart === 'gender' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sex-Disaggregated Pictograph */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Sex-Disaggregated Data</p>
                  <div className="flex justify-around items-center py-6">
                    <GenderFigure percent={stats.femalePct} color="#ec4899" label="Female" Icon={Venus} />
                    <div className="text-center">
                      <div className="text-4xl font-black text-neutral-800 dark:text-neutral-100">{stats.total}</div>
                      <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">TOTAL</div>
                    </div>
                    <GenderFigure percent={stats.malePct} color="#a673d8" label="Male" Icon={Mars} />
                  </div>
                </div>

                {/* Butterfly Plot */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Session Attendance: Gender Split</p>
                  <div className="space-y-4 mt-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-2">
                      <span className="w-1/3 text-right">Female</span>
                      <span className="w-1/3 text-center">Session</span>
                      <span className="w-1/3 text-left">Male</span>
                    </div>
                    {Object.entries(stats.sessionSDD)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([name, counts]) => {
                        const femaleWidth = (counts.female / stats.maxGenderCount) * 100;
                        const maleWidth = (counts.male / stats.maxGenderCount) * 100;
                        return (
                          <div key={name} className="flex items-center group">
                            <div className="w-1/3 flex justify-end items-center gap-2">
                              <span className="text-[10px] font-bold text-neutral-400 group-hover:text-rose-500 transition-colors">{counts.female}</span>
                              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 w-full max-w-[80px] rounded-l-full overflow-hidden flex justify-end">
                                <div className="h-full bg-rose-400 transition-all duration-1000 ease-out" style={{ width: `${femaleWidth}%` }} />
                              </div>
                            </div>
                            <div className="w-1/3 px-2 text-center">
                              <span className="text-[9px] font-black text-neutral-600 dark:text-neutral-400 leading-tight block truncate" title={name}>{name}</span>
                            </div>
                            <div className="w-1/3 flex justify-start items-center gap-2">
                              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 w-full max-w-[80px] rounded-r-full overflow-hidden">
                                <div className="h-full bg-gia-400 transition-all duration-1000 ease-out" style={{ width: `${maleWidth}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-neutral-400 group-hover:text-gia-500 transition-colors">{counts.male}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Female</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gia-400" />
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Male</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OFFICE / COLLEGE */}
            {activeChart === 'office' && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Top 5 Office / College</p>
                <div className="space-y-3">
                  {stats.officeTop.length === 0 && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-8">No office/college data for this session.</p>
                  )}
                  {stats.officeTop.map(([name, val]) => {
                    const g = stats.officeGender?.[name] || { female: 0, male: 0 };
                    const female = g.female || 0;
                    const male = g.male || 0;
                    const knownTotal = female + male;
                    const femaleShare = knownTotal ? (female / knownTotal) * 100 : 0;
                    const barWidth = knownTotal ? (knownTotal / officeMaxKnownTotal) * 100 : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="truncate pr-3 text-neutral-700 dark:text-neutral-300">{name}</span>
                          <span className="text-neutral-500 dark:text-neutral-400 font-black shrink-0">
                            {val} (F {female} / M {male})
                          </span>
                        </div>
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden">
                          <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                            <div className="h-full bg-rose-400" style={{ width: `${femaleShare}%` }} />
                            <div className="h-full bg-gia-400" style={{ width: `${100 - femaleShare}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTOR */}
            {activeChart === 'sector' && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Sector Representation</p>
                <div className="h-48 mb-4"><canvas ref={canvasRefs.sector} /></div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {Object.entries(stats.sectorGender || {})
                    .sort((a, b) => (b[1].female + b[1].male) - (a[1].female + a[1].male))
                    .slice(0, 6)
                    .map(([k, g]) => (
                      <div key={k} className="flex items-center gap-2 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                          <span className="w-2 h-2 rounded-full bg-gia-400 block" />
                        </div>
                        <span className="truncate">{k}: F {g.female || 0} / M {g.male || 0}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* AGE DISTRIBUTION */}
            {activeChart === 'age' && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Age Distribution</p>
                <div className="h-56"><canvas ref={canvasRefs.age} /></div>
                <div className="mt-4 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Female</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gia-400" />
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Male</span>
                  </div>
                </div>
              </div>
            )}

            {/* EMPLOYMENT */}
            {activeChart === 'employment' && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Employment Status Mix</p>
                <div className="h-48 mb-4"><canvas ref={canvasRefs.emp} /></div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(stats.empGender || {})
                    .sort((a, b) => (b[1].female + b[1].male) - (a[1].female + a[1].male))
                    .slice(0, 8)
                    .map(([k, g]) => (
                      <div key={k} className="flex items-center gap-2 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                          <span className="w-2 h-2 rounded-full bg-gia-400 block" />
                        </span>
                        <span className="truncate">{k}: F {g.female || 0} / M {g.male || 0}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
    </div>
  );
};
