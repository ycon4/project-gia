import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ChevronDown, Palette, Copy, Check, Download, FileText, MoreVertical } from 'lucide-react';
import html2canvas from 'html2canvas';
import ReportGeneratorModal from './ReportGeneratorModal';

// ─── MSU-IIT PROFESSIONAL SYSTEM COLOR THEMES ──────────────────────────────────
const COLOR_THEMES = {
  original: {
    name: 'MSU-IIT Official (Maroon & Gold)',
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
  purpleAmber: {
    name: 'Purple & Amber',
    Male: '#f59e0b',
    Female: '#c084fc',
    palette: ['#c084fc', '#d8b4fe', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899'],
  },
};

const LILAC = '#c084fc';
const LILAC_2 = '#d8b4fe';
const AMBER = '#f59e0b';
const COLORS = {
  Male: AMBER,
  Female: LILAC,
  palette: [LILAC, LILAC_2, AMBER, '#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899'],
};

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
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: 13, margin: '2px 0' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function EmployeeVisuals({ data, recordsCount = 0, academicPeriod = 'Academic Year' }) {
  const [activeChart, setActiveChart] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('original');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const dropdownRef = useRef(null);
  const themeRef = useRef(null);
  const actionsRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowThemeMenu(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActionsMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get colors from current theme
  const COLORS = useMemo(() => COLOR_THEMES[currentTheme], [currentTheme]);

  const captureChart = async () => {
    if (!chartRef.current) return null;

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    return canvas;
  };

  const copyChartAsImage = async () => {
    try {
      const canvas = await captureChart();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (error) {
      console.error('Failed to copy chart:', error);
    }
  };

  const downloadChartAsImage = async () => {
    try {
      const canvas = await captureChart();
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `employee-information-${timestamp}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2000);
        }
      });
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };

  // Capture specific chart by index for report generation
  const captureChartByIndex = async (chartIndex) => {
    // Temporarily switch to the chart
    const originalChart = activeChart;
    setActiveChart(chartIndex);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await captureChart();

    // Switch back
    setActiveChart(originalChart);

    return canvas;
  };

  const processSDD = (key, topN = null, filterFn = () => true) => {
    const counts = data.filter(filterFn).reduce((acc, curr) => {
      const val = curr[key] || 'Not Specified';
      if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
      const gender = curr.empgender === 'Female' ? 'Female' : 'Male';
      acc[val][gender]++;
      acc[val].total++;
      return acc;
    }, {});
    let result = Object.values(counts).sort((a, b) => b.total - a.total);
    return topN ? result.slice(0, topN) : result;
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Employment Status (Plantilla vs Non-Plantilla)
    const plantilla = (() => {
      const cats = {
        'Plantilla': { name: 'Plantilla', Male: 0, Female: 0, total: 0 },
        'Non-Plantilla': { name: 'Non-Plantilla', Male: 0, Female: 0, total: 0 }
      };
      data.forEach(d => {
        const type = (d.emp_plantilla && d.emp_plantilla !== 'N/A' && d.emp_plantilla !== 'None') ? 'Plantilla' : 'Non-Plantilla';
        const gender = d.empgender === 'Female' ? 'Female' : 'Male';
        cats[type][gender]++;
        cats[type].total++;
      });
      return Object.values(cats);
    })();

    // 2. Employee Type (Teaching vs Non-Teaching)
    const employeeType = processSDD('emptype');

    // 3. Salary Grade Distribution
    const salaryGrade = processSDD('empsalary_grade');

    // 4. Department/College Distribution (Teaching staff)
    const departments = processSDD('deptcoll', 10, d => d.emptype?.toLowerCase().includes('teaching'));

    // 5. Administrative Officials (Senior vs Regular)
    const adminLevel = (() => {
      const cats = {
        'Senior/Admin': { name: 'Senior/Admin', Male: 0, Female: 0, total: 0 },
        'Regular': { name: 'Regular', Male: 0, Female: 0, total: 0 }
      };
      data.forEach(d => {
        const type = d.is_emp_senior === 'Yes' ? 'Senior/Admin' : 'Regular';
        const gender = d.empgender === 'Female' ? 'Female' : 'Male';
        cats[type][gender]++;
        cats[type].total++;
      });
      return Object.values(cats);
    })();

    // 6. Ethnicity Distribution
    const ethnicity = processSDD('empethnic', 8);

    // 7. Religion Distribution
    const religion = processSDD('empreligion', 8);

    // 8. PWD Status
    const pwd = (() => {
      const cats = {
        'PWD': { name: 'PWD', Male: 0, Female: 0, total: 0 },
        'Non-PWD': { name: 'Non-PWD', Male: 0, Female: 0, total: 0 }
      };
      data.forEach(d => {
        const type = d.is_emp_pwd === 'Yes' ? 'PWD' : 'Non-PWD';
        const gender = d.empgender === 'Female' ? 'Female' : 'Male';
        cats[type][gender]++;
        cats[type].total++;
      });
      return Object.values(cats);
    })();

    // 9. Gender Distribution Overview
    const genderOverview = (() => {
      const counts = { Male: 0, Female: 0 };
      data.forEach(d => {
        counts[d.empgender === 'Female' ? 'Female' : 'Male']++;
      });
      return [
        { name: 'Male', value: counts.Male },
        { name: 'Female', value: counts.Female }
      ];
    })();

    // 10. Plantilla Positions (Top positions)
    const plantillaPositions = (() => {
      const positions = {};
      data.forEach(d => {
        if (!d.emp_plantilla || d.emp_plantilla === 'N/A' || d.emp_plantilla === 'None') return;
        const pos = d.emp_plantilla;
        const gender = d.empgender === 'Female' ? 'Female' : 'Male';
        if (!positions[pos]) positions[pos] = { name: pos, Male: 0, Female: 0, total: 0 };
        positions[pos][gender]++;
        positions[pos].total++;
      });
      return Object.values(positions).sort((a, b) => b.total - a.total).slice(0, 10);
    })();

    return {
      plantilla,
      employeeType,
      salaryGrade,
      departments,
      adminLevel,
      ethnicity,
      religion,
      pwd,
      genderOverview,
      plantillaPositions
    };
  }, [data]);

  if (!stats) return null;

  const charts = [
    {
      title: "Employment Status",
      desc: "Comparison of permanent (Plantilla) vs contractual roles disaggregated by sex.",
      summary: [
        { label: 'Total Employees', value: data.length.toLocaleString() },
        { label: 'Plantilla', value: data.filter(d => d.emp_plantilla && d.emp_plantilla !== 'N/A' && d.emp_plantilla !== 'None').length },
        { label: 'Non-Plantilla', value: data.filter(d => !d.emp_plantilla || d.emp_plantilla === 'N/A' || d.emp_plantilla === 'None').length },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.plantilla}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={80} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={80} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Employee Category",
      desc: "Distribution of Teaching vs Non-Teaching personnel by sex.",
      summary: [
        { label: 'Total Employees', value: data.length.toLocaleString() },
        { label: 'Female', value: `${data.filter(d => d.empgender === 'Female').length} (${((data.filter(d => d.empgender === 'Female').length / data.length) * 100).toFixed(1)}%)`, color: COLORS.Female },
        { label: 'Male', value: `${data.filter(d => d.empgender === 'Male').length} (${((data.filter(d => d.empgender === 'Male').length / data.length) * 100).toFixed(1)}%)`, color: COLORS.Male },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.employeeType}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[0, 0, 0, 0]} barSize={60} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Salary Grade Distribution",
      desc: "Income distribution across salary grades disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.salaryGrade} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={10} width={120} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: `${COLORS.Female}10` }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={18} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Teaching Faculty by Department",
      desc: "Gender distribution across academic departments (Teaching staff only).",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          {stats.departments.length > 0 ? (
            <BarChart data={stats.departments} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={180} fontSize={9} fontWeight={600} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: `${COLORS.Female}10` }} content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={16} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No teaching staff data with department information</p>
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      title: "Administrative Officials",
      desc: "Leadership positions (Senior/Admin) vs Regular staff disaggregated by sex.",
      summary: [
        { label: 'Total Employees', value: data.length.toLocaleString() },
        { label: 'Senior/Admin', value: data.filter(d => d.is_emp_senior === 'Yes').length },
        { label: 'Regular', value: data.filter(d => d.is_emp_senior !== 'Yes').length },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.adminLevel}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={80} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={80} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Cultural Profile — Ethnicity",
      desc: "Distribution of ethnic groups within the workforce (top 8).",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.ethnicity} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" fontSize={10} width={110} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: `${COLORS.Female}10` }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={16} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Religious Affiliation",
      desc: "Religious affiliation of employees disaggregated by sex (top 8).",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.religion}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "PWD (Persons with Disability)",
      desc: "Support tracking for employees with disabilities disaggregated by sex.",
      summary: [
        { label: 'Total Employees', value: data.length.toLocaleString() },
        { label: 'PWD', value: data.filter(d => d.is_emp_pwd === 'Yes').length },
        { label: 'PWD %', value: `${((data.filter(d => d.is_emp_pwd === 'Yes').length / data.length) * 100).toFixed(1)}%` },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.pwd}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={80} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={80} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Gender Distribution Overview",
      desc: "Overall male vs female ratio in the workforce.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.genderOverview}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {stats.genderOverview.map((entry, i) => (
                <Cell key={i} fill={entry.name === 'Female' ? COLORS.Female : COLORS.Male} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Top Plantilla Positions",
      desc: "Most common permanent positions disaggregated by sex (top 10).",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          {stats.plantillaPositions.length > 0 ? (
            <BarChart data={stats.plantillaPositions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={200} fontSize={9} fontWeight={600} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: `${COLORS.Female}10` }} content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={14} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No plantilla position data available</p>
            </div>
          )}
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
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[280px] max-h-[320px] overflow-y-auto">
                {charts.map((chart, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveChart(i); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                    style={activeChart === i
                      ? { color: '#c084fc', backgroundColor: '#c084fc12', fontWeight: 600 }
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

        {/* Right side: Actions dropdown + Theme selector + Records count */}
        <div className="flex items-center gap-2">
          {/* Actions Dropdown (Report, Copy, Download) */}
          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
              title="Chart actions"
            >
              <MoreVertical size={16} />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  <FileText size={14} />
                  <span>Generate Report</span>
                </button>
                <button
                  onClick={() => {
                    copyChartAsImage();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-500" />
                      <span className="text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Chart</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    downloadChartAsImage();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {downloaded ? (
                    <>
                      <Check size={14} className="text-green-500" />
                      <span className="text-green-500">Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download Chart</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
              title="Change color theme"
            >
              <Palette size={13} />
              <span className="hidden sm:inline">Theme</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentTheme(key);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${currentTheme === key
                      ? 'bg-gia-50 dark:bg-gia-900/20 text-gia-600 dark:text-gia-400 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                  >
                    <span>{theme.name}</span>
                    {currentTheme === key && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Records count */}
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
            {recordsCount.toLocaleString()} records
          </span>
        </div>
      </div>

      {/* ── Chart content area (for capture) ── */}
      <div className="flex-1 flex flex-col min-h-0" ref={chartRef}>
        {/* ── Title ── */}
        <div className="px-6 pt-4 pb-2">
          <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">{current.title}</h3>
        </div>

        {/* ── Description ── */}
        <p className="px-6 pb-2 text-xs text-neutral-400 dark:text-neutral-500 italic">{current.desc}</p>

        {/* ── Summary Stats (if available) ── */}
        {current.summary && (
          <div className="px-6 pb-3">
            <div className="flex flex-wrap gap-3 text-xs">
              {current.summary.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{stat.label}:</span>
                  <span className="font-bold" style={{ color: stat.color || '#6b7280' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Chart fills remaining space ── */}
        <div className="flex-1 px-4 pb-4 pt-2 min-h-0">
          {current.render()}
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        charts={charts}
        academicPeriod={academicPeriod}
        datasetName="Employee Information"
        captureChartFn={captureChartByIndex}
      />

    </div>
  );
}
