import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const LILAC   = '#a673d8';
const LILAC_2 = '#b07ade';
const BLUE    = '#73DAE1';
const COLORS  = {
  Male:    BLUE,
  Female:  '#DD6E6B',
  palette: [LILAC, LILAC_2, BLUE, '#f43f5e', '#f59e0b', '#10b981'],
};

// Darker cyan used only for Male text in light-mode tooltips (original is too bright to read)
const MALE_TEXT_LIGHT = '#0e7490';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <div style={{
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      {label && (
        <p style={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => {
        const textColor = entry.dataKey === 'Male' && !isDark ? MALE_TEXT_LIGHT : entry.color;
        return (
          <p key={i} style={{ color: textColor, fontSize: 13, margin: '2px 0' }}>
            {entry.name} : {entry.value}
          </p>
        );
      })}
    </div>
  );
}

const nb = v => (v === 'Yes' || v === true || v === 'yes' || v === 'true' || v === '1' || v === 1) ? 'Yes' : 'No';

// Normalizes a single record so both old (pre-2026) and new field names work.
const normalizeEnrollmentRecord = (r) => ({
  ...r,
  stud_college:         r.stud_college         || r.college         || 'Not Specified',
  stud_program:         r.stud_program          || r.program         || 'Not Specified',
  stud_yrlevel:         r.stud_yrlevel          || r.year_level      || 'Not Specified',
  studethnic:           r.studethnic            || r.ethnicity       || 'Not Specified',
  studreligion:         r.studreligion          || r.religion        || 'Not Specified',
  studid:               r.studid                || r.student_id      || 'N/A',
  studgender:           r.studgender            || r.sex             || 'Unknown',
  currentadd_prov:      r.currentadd_prov       || r.place_of_origin || 'Not Specified',
  is_first_gen_learner: nb(r.is_first_gen_learner ?? r['_first_generation?']),
  '_pwd?':              nb(r['_pwd?'] ?? r.is_pwd),
  '_solo_parent?':      nb(r['_solo_parent?'] ?? r.is_solo_parent),
  '_ip_member?':        nb(r['_ip_member?'] ?? r.is_ip_member),
  '_working_student?':  nb(r['_working_student?'] ?? r.is_working_student),
});

export default function StudentEnrollmentVisuals({ data, recordsCount = 0 }) {
  const [activeChart, setActiveChart] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Normalize all records once so old and new schemas both work
  const normalizedData = useMemo(() => (data || []).map(normalizeEnrollmentRecord), [data]);

  const processSDD = (key, topN = null) => {
    const counts = normalizedData.reduce((acc, curr) => {
      const val = curr[key] || 'Not Specified';
      if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
      const gender = curr.studgender || '';
      acc[val][gender === 'Female' ? 'Female' : 'Male']++;
      acc[val].total++;
      return acc;
    }, {});
    let result = Object.values(counts).sort((a, b) => b.total - a.total);
    return topN ? result.slice(0, topN) : result;
  };

  const stats = useMemo(() => {
    if (!normalizedData || normalizedData.length === 0) return null;
    const college   = processSDD('stud_college');
    const yearLevel = processSDD('stud_yrlevel').sort((a, b) => a.name.localeCompare(b.name));
    const vulnerabilities = [
      { id: '_pwd?',                label: 'PWD'                  },
      { id: '_solo_parent?',        label: 'Solo Parent'          },
      { id: '_ip_member?',          label: 'IP Member'            },
      { id: '_working_student?',    label: 'Working'              },
      { id: 'is_child_lgbtq',       label: 'Child of LGBTQ+'      },
      { id: 'is_child_pdl',         label: 'Child of PDL'         },
      { id: 'is_child_solo_parent', label: 'Child of Solo Parent' },
    ].map(v => {
      const filtered = normalizedData.filter(d => d[v.id] === 'Yes');
      return { name: v.label, Female: filtered.filter(d => d.studgender === 'Female').length, Male: filtered.filter(d => d.studgender === 'Male').length };
    });
    const programs  = processSDD('stud_program', 10);
    const ethnicity = processSDD('studethnic', 5);
    const religion  = processSDD('studreligion', 5);
    const origin    = processSDD('currentadd_prov', 5);
    const firstGen  = processSDD('is_first_gen_learner');
    return { college, yearLevel, vulnerabilities, programs, ethnicity, religion, origin, firstGen };
  }, [normalizedData]);

  if (!stats) return null;

  const charts = [
    {
      title: "Enrollment by College",
      desc:  "Total student population distribution across colleges disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.college} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={150} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: `${LILAC}10` }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" />
            <Bar dataKey="Male"   stackId="a" fill={COLORS.Male}   barSize={18} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0,4,4,0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Year Level Distribution",
      desc:  "Progress of male vs female students per academic year level.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.yearLevel}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male"   fill={COLORS.Male}   radius={[4,4,0,0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Vulnerability & Support Tracking",
      desc:  "Sex representation across specific support groups (PWD, 4Ps, Solo Parent, etc.).",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.vulnerabilities}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} fontWeight="black" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male"   fill={COLORS.Male}   radius={[4,4,0,0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Top 10 Degree Programs",
      desc:  "Most populated academic programs disaggregated by gender.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.programs} layout="vertical">
            <YAxis dataKey="name" type="category" width={160} fontSize={8} />
            <XAxis type="number" hide />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male"   stackId="a" fill={COLORS.Male}   barSize={12} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Cultural Profile — Ethnicity",
      desc:  "Top 5 ethnic groups represented in the student body.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={stats.ethnicity} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110}>
              {stats.ethnicity.map((_, i) => <Cell key={i} fill={COLORS.palette[i % COLORS.palette.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Religious Affiliation",
      desc:  "Top 5 religious groups recorded in the data.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.religion}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4,4,0,0]} />
            <Bar dataKey="Male"   fill={COLORS.Male}   stackId="a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "First Generation Students",
      desc:  "Students who are the first in their families to attend college.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.firstGen}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male"   fill={COLORS.Male}   stackId="a" radius={[4,4,0,0]} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Regional Origin",
      desc:  "Top provinces where students are currently residing.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.origin} layout="vertical">
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <XAxis type="number" hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill={LILAC} radius={[0,4,4,0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ];

  const current = charts[activeChart];

  return (
    <div className="flex flex-col h-full">

      {/* ── Selector bar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-700 shrink-0">

        {/* Chart dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 group"
            >
              <span className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{current.title}</span>
              <ChevronDown
                size={15}
                className={`text-neutral-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[260px] max-h-[320px] overflow-y-auto">
                {charts.map((chart, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveChart(i); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                    style={activeChart === i
                      ? { color: LILAC, backgroundColor: `${LILAC}12`, fontWeight: 600 }
                      : { color: '#6b7280' }
                    }
                    onMouseEnter={e => { if (activeChart !== i) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (activeChart !== i) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <span>{i + 1}. {chart.title}</span>
                    {activeChart === i && <span className="text-xs shrink-0">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{activeChart + 1} / {charts.length}</span>
        </div>

        {/* Records count */}
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
          {recordsCount.toLocaleString()} records
        </span>
      </div>

      {/* ── Description ── */}
      <p className="px-6 pt-4 pb-1 text-xs text-neutral-400 dark:text-neutral-500 italic shrink-0">{current.desc}</p>

      {/* ── Chart fills remaining space ── */}
      <div className="flex-1 px-4 pb-4 pt-2 min-h-0">
        {current.render()}
      </div>

    </div>
  );
}
