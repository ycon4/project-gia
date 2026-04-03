import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = { Male: '#73DAE1', Female: '#DD6E6B' };

export default function EmployeeVisuals({ data, recordsCount = 0 }) {
  const [activeChart, setActiveChart] = useState(0);

  const getSDD = (key, filterFn = () => true) => {
    const counts = data.filter(filterFn).reduce((acc, curr) => {
      const val = curr[key] || 'Not Specified';
      if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
      const sex = curr.sex === 'Female' ? 'Female' : 'Male';
      acc[val][sex]++;
      acc[val].total++;
      return acc;
    }, {});
    return Object.values(counts).sort((a, b) => b.total - a.total);
  };

  const plantillaSDD = useMemo(() => {
    const cats = { 'Plantilla': { name: 'Plantilla', Male: 0, Female: 0 }, 'Non-Plantilla': { name: 'Non-Plantilla', Male: 0, Female: 0 } };
    data.forEach(d => {
      const type = (d.plantilla_position && d.plantilla_position !== 'N/A' && d.plantilla_position !== 'None') ? 'Plantilla' : 'Non-Plantilla';
      cats[type][d.sex === 'Female' ? 'Female' : 'Male']++;
    });
    return Object.values(cats);
  }, [data]);

  const incomeOrder = ["Low Income", "Lower Middle Income", "Middle Income", "Upper Middle Income", "High Income"];
  const incomeSDD = useMemo(() => {
    const raw = getSDD('income_order');
    return incomeOrder.map(label => raw.find(r => r.name === label) || { name: label, Male: 0, Female: 0 });
  }, [data]);

  const collegeSDD = useMemo(() => getSDD('college', d => d.employee_type?.toLowerCase().includes('teaching')), [data]);

  const adminSDD = useMemo(() => {
    const cats = { 'Admin Officials': { name: 'Admin Officials', Male: 0, Female: 0 }, 'Regular Staff': { name: 'Regular Staff', Male: 0, Female: 0 } };
    data.forEach(d => {
      const type = d.administrative_officials === 'Yes' ? 'Admin Officials' : 'Regular Staff';
      cats[type][d.sex === 'Female' ? 'Female' : 'Male']++;
    });
    return Object.values(cats);
  }, [data]);

  const ethnicitySDD = useMemo(() => getSDD('ethnicity').slice(0, 8), [data]);
  const religionSDD = useMemo(() => getSDD('religion').slice(0, 8), [data]);
  const specialSDD = useMemo(() => getSDD('special_needs', d => d.special_needs !== 'None' && d.special_needs !== 'N/A'), [data]);
  const typeSDD = useMemo(() => getSDD('employee_type'), [data]);

  const summaryStats = [
    { label: "Total Personnel", value: data.length, color: "bg-gia-50 text-gia-700 border-gia-100" },
    { label: "Female Ratio", value: `${((data.filter(d => d.sex === 'Female').length / data.length) * 100).toFixed(1)}%`, color: "bg-pink-50 text-pink-700 border-pink-100" },
    { label: "Plantilla", value: data.filter(d => d.plantilla_position && d.plantilla_position !== 'N/A').length, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "IP / Vulnerable", value: data.filter(d => d.special_needs !== 'None' || d.ethnicity !== 'Cebuano').length, color: "bg-orange-50 text-orange-700 border-orange-100" },
  ];

  const charts = [
    {
      title: "Employment Status",
      desc: "Comparison of permanent (Plantilla) vs contractual roles by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={plantillaSDD}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} axisLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Legend iconType="circle" />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={50} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Income Category",
      desc: "Income distribution across the 5 PSA categories disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeSDD} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={9} width={110} axisLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={22} />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Teaching Faculty per College",
      desc: "Gender split across academic units (Teaching staff only).",
      render: () => (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={collegeSDD}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={8} angle={-20} textAnchor="end" interval={0} height={60} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Administrative Officials",
      desc: "Decision-making positions (leadership roles) disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={adminSDD} innerRadius={60} outerRadius={80} dataKey="Female" nameKey="name">
              <Cell fill={COLORS.Female} />
              <Cell fill="#fdf2f8" />
            </Pie>
            <Pie data={adminSDD} innerRadius={40} outerRadius={55} dataKey="Male" nameKey="name">
              <Cell fill={COLORS.Male} />
              <Cell fill="#eef2ff" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Cultural Profile — Ethnicity",
      desc: "Distribution of ethnic groups within the workforce (top 8).",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ethnicitySDD} layout="vertical">
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <XAxis type="number" hide />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[0, 4, 4, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Religion & Faith Profile",
      desc: "Religious affiliation of employees mapped against sex (top 8).",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={religionSDD}>
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
      title: "Vulnerability / Special Needs",
      desc: "Support tracking for PWD, Solo Parents, and Persons with Special Needs.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={specialSDD}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} barSize={32} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill={COLORS.Male} barSize={32} radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Employee Category Split",
      desc: "Balance between Teaching and Non-Teaching personnel by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={typeSDD}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={60} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={60} />
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
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Employment GAD Report</h2>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-0.5">Sex-Disaggregated Data System · MSU-IIT</p>
        </div>
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
          {recordsCount.toLocaleString()} records
        </span>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 dark:border-neutral-700">
        {summaryStats.map((s, i) => (
          <div key={i} className={`px-5 py-4 border-r last:border-r-0 border-neutral-200 dark:border-neutral-700 ${s.color}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
            <p className="text-2xl font-black">{s.value}</p>
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
