import React, { useMemo, useRef, useEffect } from 'react';
import { Users, TrendingUp, BarChart3, Percent, Building2, Venus, Mars } from 'lucide-react';
import Chart from 'chart.js/auto';

// --- Constants ---
const PALETTE = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0ea5e9','#84cc16','#f43f5e'];

// --- Sub-Components ---
const StatCard = ({ label, value, sub, Icon, colorClass, bgClass }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}><Icon size={18} /></div>
    <div className="min-w-0 flex-1">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{label}</div>
      <div className="text-xl font-black text-slate-800 leading-tight">{value}</div>
      <div className="text-[9px] text-slate-400 font-medium truncate">{sub}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">{title}</p>
    {children}
  </div>
);

const GenderFigure = ({ percent, color, label, Icon }) => {
  // Clamp to [0, 100] so the pictograph never overflows.
  const safePct = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div className="flex flex-col items-center group">
      <div
        className="relative w-14 h-28 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.03]"
        aria-label={`${label} ${safePct}%`}
      >
        {/* Bottom fill indicates proportion */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{ height: `${safePct}%`, backgroundColor: color, opacity: 0.18 }}
        />

        {/* Icon */}
        <div className="relative">
          <Icon size={34} color={color} />
        </div>
      </div>

      <span className="text-xl font-black mt-2" style={{ color }}>{safePct}%</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
  );
};

// --- Main Component ---
export const EventAnalyticsDashboard = ({ attendanceData = [], filteredAttendance = [], selectedSession = '' }) => {
  const canvasRefs = { sector: useRef(null), age: useRef(null), emp: useRef(null) };

  // 1. Unified Data Engine
  const stats = useMemo(() => {
    const selectedData = filteredAttendance || [];
    const allAttendance = attendanceData || [];

    // Cards + charts should reflect the currently selected session (filteredAttendance),
    // while the "butterfly" breakdown can still show gender per session across allAttendance.
    const counts = { female: 0, male: 0, office: {}, sector: {}, age: {}, emp: {}, sessions: {} };
    const sessionSDD = {};
    const AGE_KEYS = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
    // Sex-disaggregated breakdowns (SDD) for every dimension.
    const officeGender = {};
    const sectorGender = {};
    const ageGender = {};
    const empGender = {};

    const norm = (v) => (v === null || v === undefined ? '' : String(v)).trim();
    const normLower = (v) => norm(v).toLowerCase();
    const isFemale = (sex) => ['female', 'f'].includes(normLower(sex));
    const isMale = (sex) => ['male', 'm'].includes(normLower(sex));

    // 1) Session-by-gender breakdown across ALL attendance rows.
    const allSessionCounts = {};
    allAttendance.forEach((row) => {
      const sessionName = norm(row.session_name || row.session || 'Unknown');
      const sex = row.sex || row.gender || '';

      if (!sessionSDD[sessionName]) sessionSDD[sessionName] = { female: 0, male: 0, total: 0 };
      if (!allSessionCounts[sessionName]) allSessionCounts[sessionName] = 0;

      sessionSDD[sessionName].total += 1; // total attendees per session
      allSessionCounts[sessionName] += 1;

      if (isFemale(sex)) sessionSDD[sessionName].female += 1;
      else if (isMale(sex)) sessionSDD[sessionName].male += 1;
    });

    // 2) Selected-session aggregates for the metric cards.
    selectedData.forEach((d) => {
      const sex = d.sex || d.gender || '';
      const sexKey = isFemale(sex) ? 'female' : isMale(sex) ? 'male' : null;

      if (isFemale(sex)) counts.female += 1;
      else if (isMale(sex)) counts.male += 1;

      // Office
      const off = norm(d.office_college || 'Unspecified');
      counts.office[off] = (counts.office[off] || 0) + 1;
      if (sexKey) {
        if (!officeGender[off]) officeGender[off] = { female: 0, male: 0 };
        officeGender[off][sexKey] += 1;
      }

      // Sector (fallback to PWD/General)
      const sector = norm(
        d.sector || (d.pwd_status && d.pwd_status !== 'None' ? 'PWD' : 'General')
      );
      counts.sector[sector] = (counts.sector[sector] || 0) + 1;
      if (sexKey) {
        if (!sectorGender[sector]) sectorGender[sector] = { female: 0, male: 0 };
        sectorGender[sector][sexKey] += 1;
      }

      // Age
      const age = parseInt(d.age, 10);
      if (!isNaN(age)) {
        const band =
          age < 18
            ? 'Under 18'
            : age <= 24
              ? '18–24'
              : age <= 34
                ? '25–34'
                : age <= 44
                  ? '35–44'
                  : age <= 54
                    ? '45–54'
                    : '55+';
        counts.age[band] = (counts.age[band] || 0) + 1;
        if (sexKey) {
          if (!ageGender[band]) ageGender[band] = { female: 0, male: 0 };
          ageGender[band][sexKey] += 1;
        }
      }

      // Employment
      if (d.employment_status) {
        const emp = norm(d.employment_status);
        if (emp) counts.emp[emp] = (counts.emp[emp] || 0) + 1;
        if (emp && sexKey) {
          if (!empGender[emp]) empGender[emp] = { female: 0, male: 0 };
          empGender[emp][sexKey] += 1;
        }
      }

      // Sessions counts inside the selected set (mostly unused except for debugging / future)
      const sessionName = norm(d.session_name || d.session || 'Unknown');
      counts.sessions[sessionName] = (counts.sessions[sessionName] || 0) + 1;
    });

    const total = selectedData.length;
    const preReg = allSessionCounts['Pre-Registration'] || 0; // conversion vs pre-registration across all sessions

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

    // Sector SDD (female vs male stacked bars)
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
            { label: 'Male', data: top.map((x) => x.male), backgroundColor: 'rgba(99, 102, 241, 0.85)', borderRadius: 6 },
          ],
        },
        options: {
          ...commonOpts,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      }));
    }

    // Age SDD (female vs male stacked bars)
    const ageEntries = stats.AGE_KEYS || [];
    const hasAge = ageEntries.some((k) => (stats.ageGender?.[k]?.female || 0) + (stats.ageGender?.[k]?.male || 0) > 0);

    if (canvasRefs.age.current && hasAge) {
      charts.push(new Chart(canvasRefs.age.current, {
        type: 'bar',
        data: {
          labels: stats.AGE_KEYS,
          datasets: [
            { label: 'Female', data: stats.AGE_KEYS.map((k) => stats.ageGender?.[k]?.female || 0), backgroundColor: 'rgba(236, 72, 153, 0.85)', borderRadius: 6 },
            { label: 'Male', data: stats.AGE_KEYS.map((k) => stats.ageGender?.[k]?.male || 0), backgroundColor: 'rgba(99, 102, 241, 0.85)', borderRadius: 6 },
          ],
        },
        options: {
          ...commonOpts,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      }));
    }

    // Employment SDD (female vs male stacked bars)
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
            { label: 'Male', data: top.map((x) => x.male), backgroundColor: 'rgba(99, 102, 241, 0.85)', borderRadius: 6 },
          ],
        },
        options: {
          ...commonOpts,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      }));
    }

    return () => charts.forEach(c => c.destroy());
  }, [stats]);

  const officeMaxKnownTotal = Math.max(
    1,
    ...(stats.officeTop || []).map(([name]) => (stats.officeGender?.[name]?.female || 0) + (stats.officeGender?.[name]?.male || 0))
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} sub={selectedSession} Icon={Users} colorClass="text-sky-600" bgClass="bg-sky-50" />
        <StatCard label="Female" value={`${stats.femalePct}%`} sub={`${stats.female} pax`} Icon={Percent} colorClass="text-rose-500" bgClass="bg-rose-50" />
        <StatCard label="Male" value={`${stats.malePct}%`} sub={`${stats.male} pax`} Icon={Percent} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatCard label="Turnout" value={`${stats.fidelity}%`} sub={`${stats.preReg} pre-reg`} Icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
      </div>

      {/* Row 1: Gender + Session Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sex-Disaggregated Data">
          <div className="flex justify-around items-center py-6">
            <GenderFigure percent={stats.femalePct} color="#ec4899" label="Female" Icon={Venus} />
            <div className="text-center"><div className="text-4xl font-black text-slate-800">{stats.total}</div><div className="text-[10px] font-bold text-slate-400">TOTAL</div></div>
            <GenderFigure percent={stats.malePct} color="#6366f1" label="Male" Icon={Mars} />
          </div>
        </ChartCard>

        <ChartCard title="Session Attendance: Gender Split (Butterfly Plot)">
          <div className="space-y-4 mt-2">
            {/* Header Labels */}
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 px-2">
              <span className="w-1/3 text-right">Female</span>
              <span className="w-1/3 text-center">Session</span>
              <span className="w-1/3 text-left">Male</span>
            </div>

            {Object.entries(stats.sessionSDD)
              .sort((a, b) => b[1].total - a[1].total) // Sort by largest session
              .map(([name, counts]) => {
                const femaleWidth = (counts.female / stats.maxGenderCount) * 100;
                const maleWidth = (counts.male / stats.maxGenderCount) * 100;

                return (
                  <div key={name} className="flex items-center group">
                    {/* Female Side (Right Aligned Bar) */}
                    <div className="w-1/3 flex justify-end items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-500 transition-colors">
                        {counts.female}
                      </span>
                      <div className="h-4 bg-slate-50 w-full max-w-[80px] rounded-l-full overflow-hidden flex justify-end">
                        <div 
                          className="h-full bg-rose-400 transition-all duration-1000 ease-out"
                          style={{ width: `${femaleWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Center Label */}
                    <div className="w-1/3 px-2 text-center">
                      <span className="text-[9px] font-black text-slate-600 leading-tight block truncate" title={name}>
                        {name}
                      </span>
                    </div>

                    {/* Male Side (Left Aligned Bar) */}
                    <div className="w-1/3 flex justify-start items-center gap-2">
                      <div className="h-4 bg-slate-50 w-full max-w-[80px] rounded-r-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-400 transition-all duration-1000 ease-out"
                          style={{ width: `${maleWidth}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        {counts.male}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Female</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Male</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Office + Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCard title="Top 5 Office/College" className="lg:col-span-3">
          <div className="space-y-3">
            {stats.officeTop.map(([name, val], i) => {
              const g = stats.officeGender?.[name] || { female: 0, male: 0 };
              const female = g.female || 0;
              const male = g.male || 0;
              const knownTotal = female + male;
              const femaleShare = knownTotal ? (female / knownTotal) * 100 : 0;
              const barWidth = knownTotal ? (knownTotal / officeMaxKnownTotal) * 100 : 0;

              return (
              <div key={name}>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="truncate pr-3">{name}</span>
                  <span className="text-slate-500 font-black">
                    {val} (F {female} / M {male})
                  </span>
                </div>
                <div className="h-3 bg-slate-50 rounded-sm overflow-hidden">
                  <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                    <div className="h-full bg-rose-400" style={{ width: `${femaleShare}%` }} />
                    <div className="h-full bg-indigo-400" style={{ width: `${100 - femaleShare}%` }} />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Sector Representation" className="lg:col-span-2">
          <div className="h-40 mb-4"><canvas ref={canvasRefs.sector} /></div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.sectorGender || {})
              .sort((a, b) => (b[1].female + b[1].male) - (a[1].female + a[1].male))
              .slice(0, 6)
              .map(([k, g], i) => (
                <div key={k} className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 block" />
                  </div>
                  <span className="truncate">
                    {k}: F {g.female || 0} / M {g.male || 0}
                  </span>
                </div>
              ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Age + Employment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Age Distribution"><div className="h-48"><canvas ref={canvasRefs.age} /></div></ChartCard>
        <ChartCard title="Employment Status Mix">
          <div className="h-40 mb-4"><canvas ref={canvasRefs.emp} /></div>
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(stats.empGender || {})
              .sort((a, b) => (b[1].female + b[1].male) - (a[1].female + a[1].male))
              .slice(0, 8)
              .map(([k, g], i) => (
                <div key={k} className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 block" />
                  </span>
                  <span className="truncate">
                    {k}: F {g.female || 0} / M {g.male || 0}
                  </span>
                </div>
              ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};