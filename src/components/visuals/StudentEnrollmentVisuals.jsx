import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = {
  Male: '#7cacf8',
  Female: '#ec4899',
  palette: ['#7cacf8', '#6366f1', '#d946ef', '#f43f5e', '#f59e0b', '#10b981']
};

export default function StudentEnrollmentVisuals({ data }) {
  const [activeChart, setActiveChart] = useState(0);

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

    const college = processSDD('college');
    const yearLevel = processSDD('year_level').sort((a, b) => a.name.localeCompare(b.name));

    const incomeOrder = ["low income", "lower-middle", "middle", "upper-middle", "high income"];
    const incomeRaw = processSDD('income_PSA_category');
    const income = incomeOrder.map(label => incomeRaw.find(r => r.name === label) || { name: label, Male: 0, Female: 0 });

    const vulnerabilities = [
      { id: '_pwd?', label: 'PWD' },
      { id: '_solo_parent?', label: 'Solo Parent' },
      { id: '_ip_member?', label: 'IP Member' },
      { id: '_working_student?', label: 'Working' },
      { id: '_4ps_beneficiary?', label: '4Ps' },
      { id: '_ofw_dependent?', label: 'OFW Dep' }
    ].map(v => {
      const filtered = data.filter(d => d[v.id] === 'Yes');
      return {
        name: v.label,
        Female: filtered.filter(d => d.sex === 'Female').length,
        Male: filtered.filter(d => d.sex === 'Male').length
      };
    });

    const programs = processSDD('program', 10);
    const ethnicity = processSDD('ethnicity', 5);
    const religion = processSDD('religion', 5);
    const origin = processSDD('place_of_origin', 5);
    const firstGen = processSDD('_first_generation?');

    return { college, yearLevel, income, vulnerabilities, programs, ethnicity, religion, origin, firstGen };
  }, [data]);

  if (!stats) return null;

  const charts = [
    {
      title: "Enrollment by College",
      desc: "Total student population distribution across colleges disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={stats.college} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={140} fontSize={10} fontWeight={800} axisLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Legend verticalAlign="top" align="right" />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={18} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Year Level Distribution",
      desc: "Progress of male vs female students per academic year level.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.yearLevel}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Income PSA Category",
      desc: "Economic clustering using the PSA classification.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.income} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Vulnerability & Support Tracking",
      desc: "Sex representation across specific support groups (PWD, 4Ps, Solo Parent, etc.).",
      render: () => (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stats.vulnerabilities}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} fontWeight="black" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Top 10 Degree Programs",
      desc: "Most populated academic programs disaggregated by gender.",
      render: () => (
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={stats.programs} layout="vertical">
            <YAxis dataKey="name" type="category" width={160} fontSize={8} />
            <XAxis type="number" hide />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={12} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Cultural Profile — Ethnicity",
      desc: "Top 5 ethnic groups represented in the student body.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={stats.ethnicity} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110}>
              {stats.ethnicity.map((_, i) => <Cell key={i} fill={COLORS.palette[i % COLORS.palette.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Religious Affiliation",
      desc: "Top 5 religious groups recorded in the data.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.religion}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "First Generation Students",
      desc: "Students who are the first in their families to attend college.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.firstGen}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Regional Origin",
      desc: "Top provinces/cities where students are currently originating from.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.origin} layout="vertical">
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <XAxis type="number" hide />
            <Tooltip />
            <Bar dataKey="total" fill={COLORS.palette[0]} radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
  ];

  const current = charts[activeChart];

  return (
    <div className="space-y-0 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Student GAD Visuals</h2>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">Sex-Disaggregated Data Report</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:border-gia-400 hover:text-gia-600 dark:hover:text-gia-400 transition-colors"
        >
          <Printer size={13} /> Print Report
        </button>
      </div>

      {/* Chart Selector */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Chart:</span>
          <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600">{activeChart + 1} / {charts.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveChart(i => Math.max(0, i - 1))}
            disabled={activeChart === 0}
            className="shrink-0 p-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-[#7cacf8]/60 hover:text-[#7cacf8] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {charts.map((chart, i) => (
              <button
                key={i}
                onClick={() => setActiveChart(i)}
                className={`shrink-0 px-3 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  activeChart === i
                    ? 'bg-[#7cacf8] text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-[#7cacf8]/10 hover:text-[#7cacf8]'
                }`}
              >
                {i + 1}. {chart.title}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveChart(i => Math.min(charts.length - 1, i + 1))}
            disabled={activeChart === charts.length - 1}
            className="shrink-0 p-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-[#7cacf8]/60 hover:text-[#7cacf8] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Active Chart */}
      <div className="p-6 bg-white dark:bg-neutral-900">
        <div className="mb-4">
          <h3 className="font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide text-sm">{current.title}</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 italic">{current.desc}</p>
        </div>
        <div className="min-h-[280px]">
          {current.render()}
        </div>
      </div>
    </div>
  );
}
