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

  const processSDD = (key, topN = null) => {
    const counts = data.reduce((acc, curr) => {
      const val = curr[key] || 'Not Specified';
      if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
      acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      acc[val].total++;
      return acc;
    }, {});
    let result = Object.values(counts).sort((a, b) => b.total - a.total);
    return topN ? result.slice(0, topN) : result;
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const college   = processSDD('college');
    const yearLevel = processSDD('year_level').sort((a, b) => a.name.localeCompare(b.name));
    const incomeOrder = ["low income", "lower-middle", "middle", "upper-middle", "high income"];
    const incomeRaw   = processSDD('income_PSA_category');
    const income      = incomeOrder.map(label => incomeRaw.find(r => r.name === label) || { name: label, Male: 0, Female: 0 });
    const vulnerabilities = [
      { id: '_pwd?',             label: 'PWD'        },
      { id: '_solo_parent?',     label: 'Solo Parent' },
      { id: '_ip_member?',       label: 'IP Member'   },
      { id: '_working_student?', label: 'Working'     },
      { id: '_4ps_beneficiary?', label: '4Ps'         },
      { id: '_ofw_dependent?',   label: 'OFW Dep'     },
    ].map(v => {
      const filtered = data.filter(d => d[v.id] === 'Yes');
      return { name: v.label, Female: filtered.filter(d => d.sex === 'Female').length, Male: filtered.filter(d => d.sex === 'Male').length };
    });
    const programs  = processSDD('program', 10);
    const ethnicity = processSDD('ethnicity', 5);
    const religion  = processSDD('religion', 5);
    const origin    = processSDD('place_of_origin', 5);
    const firstGen  = processSDD('_first_generation?');
    return { college, yearLevel, income, vulnerabilities, programs, ethnicity, religion, origin, firstGen };
  }, [data]);

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
            <Tooltip cursor={{ fill: `${LILAC}10` }} />
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
            <Tooltip />
            <Legend />
            <Bar dataKey="Male"   fill={COLORS.Male}   radius={[4,4,0,0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Income PSA Category",
      desc:  "Economic clustering using the PSA classification.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.income} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male"   stackId="a" fill={COLORS.Male}   />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0,4,4,0]} />
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
            <Tooltip />
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
            <Tooltip />
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
            <Tooltip />
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
            <Tooltip />
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
            <Tooltip />
            <Legend />
            <Bar dataKey="Male"   fill={COLORS.Male}   stackId="a" radius={[4,4,0,0]} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Regional Origin",
      desc:  "Top provinces/cities where students are currently originating from.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.origin} layout="vertical">
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <XAxis type="number" hide />
            <Tooltip />
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
