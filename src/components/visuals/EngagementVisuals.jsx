import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Zap, Award, ShieldCheck, BookOpen, Users, GraduationCap, Target, Star, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = {
  Male: '#73DAE1',
  Female: '#DD6E6B',
  palette: ['#73DAE1', '#6366f1', '#d946ef', '#f43f5e', '#f59e0b', '#10b981']
};

const getVal = (row, key1, key2) => {
  const v = row[key1] || row[key2];
  return v ? v.toString().trim() : '';
};

const isActive = (val) => {
  if (!val) return false;
  const lower = val.toLowerCase();
  return !['none', 'paying', 'no', 'n/a', '', ' '].includes(lower);
};

export default function StudentEngagementVisuals({ data = [], recordsCount = 0 }) {
  const [activeChart, setActiveChart] = useState(0);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const scholarshipMap = data.reduce((acc, curr) => {
      const type = getVal(curr, 'scholarship_status', 'Scholarship') || 'Non-Scholar';
      if (!acc[type]) acc[type] = { name: type, Male: 0, Female: 0, total: 0 };
      acc[type][curr.sex === 'Female' ? 'Female' : 'Male']++;
      acc[type].total++;
      return acc;
    }, {});

    const academicMap = data.reduce((acc, curr) => {
      const raw = getVal(curr, 'academic_standing', 'Academic Standing');
      const standing = isActive(raw) ? raw : 'Regular Student';
      if (!acc[standing]) acc[standing] = { name: standing, Male: 0, Female: 0 };
      acc[standing][curr.sex === 'Female' ? 'Female' : 'Male']++;
      return acc;
    }, {});

    const councilMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_council', 'student_council');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      }
      return acc;
    }, {});

    const pubMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_publication', 'publication');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      }
      return acc;
    }, {});

    const orgMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_organization', 'organizations');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
        acc[val].total++;
      }
      return acc;
    }, {});

    const overlap = [
      {
        name: 'Leader & Scholar',
        Female: data.filter(d => isActive(getVal(d, 'student_council')) && isActive(getVal(d, 'scholarship_status')) && d.sex === 'Female').length,
        Male: data.filter(d => isActive(getVal(d, 'student_council')) && isActive(getVal(d, 'scholarship_status')) && d.sex === 'Male').length
      },
      {
        name: 'Leader & Honors',
        Female: data.filter(d => isActive(getVal(d, 'student_council')) && isActive(getVal(d, 'academic_standing')) && d.sex === 'Female').length,
        Male: data.filter(d => isActive(getVal(d, 'student_council')) && isActive(getVal(d, 'academic_standing')) && d.sex === 'Male').length
      }
    ];

    const saturation = [
      { name: 'Highly Active (3+)', value: data.filter(d => [isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].filter(Boolean).length >= 3).length },
      {
        name: 'Active (1–2)', value: data.filter(d => {
          const count = [isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].filter(Boolean).length;
          return count >= 1 && count < 3;
        }).length
      },
      { name: 'Not Engaged', value: data.filter(d => ![isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].some(Boolean)).length }
    ];

    return {
      scholarship: Object.values(scholarshipMap).sort((a, b) => b.total - a.total),
      academic: Object.values(academicMap),
      council: Object.values(councilMap),
      pub: Object.values(pubMap),
      orgs: Object.values(orgMap).sort((a, b) => b.total - a.total).slice(0, 5),
      overlap,
      saturation
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <AlertCircle className="text-neutral-300 dark:text-neutral-600" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">No Engagement Data Loaded</p>
      </div>
    );
  }

  if (!stats) return null;

  const summaryCards = [
    { label: "Total Records", value: data.length, icon: <Zap className="text-amber-500" size={16} />, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Honors", value: data.filter(d => isActive(getVal(d, 'academic_standing'))).length, icon: <Award className="text-pink-500" size={16} />, color: "bg-pink-50 text-pink-700 border-pink-100" },
    { label: "Leaders", value: data.filter(d => isActive(getVal(d, 'student_council'))).length, icon: <ShieldCheck className="text-blue-500" size={16} />, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "Published", value: data.filter(d => isActive(getVal(d, 'student_publication'))).length, icon: <BookOpen className="text-emerald-500" size={16} />, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  ];

  const charts = [
    {
      title: "Scholarship Grant",
      desc: "Distribution of scholarship types across students disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.scholarship}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Academic Standing",
      desc: "Distribution of academic honors and standing disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.academic} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={10} width={110} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={16} />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Student Council Participation",
      desc: "Student council roles and positions disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.council}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Student Publications",
      desc: "Student involvement in campus publications disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stats.pub}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Female" fill={COLORS.Female} stroke={COLORS.Female} fillOpacity={0.4} />
            <Area type="monotone" dataKey="Male" fill={COLORS.Male} stroke={COLORS.Male} fillOpacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Top 5 Organizations",
      desc: "Most popular student organizations disaggregated by sex.",
      render: () => (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.orgs} layout="vertical">
              <YAxis dataKey="name" type="category" fontSize={8} width={130} />
              <XAxis type="number" hide />
              <Tooltip />
              <Legend />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={12} />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 uppercase tracking-tighter text-slate-500">
                  <th className="p-2 font-black">Organization</th>
                  <th className="p-2 font-black text-pink-600">Female</th>
                  <th className="p-2 font-black text-blue-600">Male</th>
                  <th className="p-2 font-black">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.orgs.map((org, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-gia-50/30">
                    <td className="p-2 font-bold">{org.name}</td>
                    <td className="p-2">{org.Female}</td>
                    <td className="p-2">{org.Male}</td>
                    <td className="p-2 font-black">{org.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      title: "Leadership Excellence",
      desc: "Students who are both leaders and scholars, or leaders with academic honors.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.overlap}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Engagement Saturation",
      desc: "Breakdown of students by their level of campus engagement activity.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={stats.saturation} innerRadius={60} outerRadius={100} dataKey="value">
              {stats.saturation.map((_, i) => <Cell key={i} fill={COLORS.palette[i]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Gender Engagement Ratio",
      desc: "Proportion of male vs female students actively involved in organizations.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Female Active', value: data.filter(d => d.sex === 'Female' && isActive(getVal(d, 'student_organization', 'organizations'))).length },
                { name: 'Male Active', value: data.filter(d => d.sex === 'Male' && isActive(getVal(d, 'student_organization', 'organizations'))).length }
              ]}
              dataKey="value" innerRadius={0} outerRadius={100} label
            >
              <Cell fill={COLORS.Female} />
              <Cell fill={COLORS.Male} />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
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
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Student Engagement Visuals</h2>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">Sex-Disaggregated Engagement Report</p>
        </div>
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
          {recordsCount.toLocaleString()} records
        </span>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-neutral-200 dark:border-neutral-700">
        {summaryCards.map((s, i) => (
          <div key={i} className={`px-5 py-4 border-r last:border-r-0 border-neutral-200 dark:border-neutral-700 flex items-center gap-3 ${s.color}`}>
            <div className="p-2 bg-white/60 dark:bg-white/10 rounded">{s.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{s.label}</p>
              <p className="text-2xl font-black leading-none">{s.value}</p>
            </div>
          </div>
        ))}
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
            className="shrink-0 p-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-[#73DAE1]/60 hover:text-[#73DAE1] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
                    ? 'bg-[#73DAE1] text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-[#73DAE1]/10 hover:text-[#73DAE1]'
                }`}
              >
                {i + 1}. {chart.title}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveChart(i => Math.min(charts.length - 1, i + 1))}
            disabled={activeChart === charts.length - 1}
            className="shrink-0 p-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-[#73DAE1]/60 hover:text-[#73DAE1] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
