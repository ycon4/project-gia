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
  palette: [LILAC, LILAC_2, AMBER, '#10b981', '#f43f5e', '#3b82f6'],
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
          {entry.name} : {entry.value}
        </p>
      ))}
    </div>
  );
}

const nb = v => (v === 'Yes' || v === true || v === 'yes' || v === 'true' || v === '1' || v === 1) ? 'Yes' : 'No';

// Normalizes a single record so both old (pre-2026) and new field names work.
const normalizeEnrollmentRecord = (r) => ({
  ...r,
  stud_college: r.stud_college || r.college || 'Not Specified',
  stud_program: r.stud_program || r.program || 'Not Specified',
  stud_yrlevel: r.stud_yrlevel || r.year_level || 'Not Specified',
  studethnic: r.studethnic || r.ethnicity || 'Not Specified',
  studreligion: r.studreligion || r.religion || 'Not Specified',
  studid: r.studid || r.student_id || 'N/A',
  studgender: r.studgender || r.sex || 'Unknown',
  currentadd_prov: r.currentadd_prov || r.place_of_origin || 'Not Specified',
  is_first_gen_learner: nb(r.is_first_gen_learner ?? r['_first_generation?']),
  '_pwd?': nb(r['_pwd?'] ?? r.is_pwd),
  '_solo_parent?': nb(r['_solo_parent?'] ?? r.is_solo_parent),
  '_ip_member?': nb(r['_ip_member?'] ?? r.is_ip_member),
  '_working_student?': nb(r['_working_student?'] ?? r.is_working_student),
});

export default function StudentEnrollmentVisuals({ data, recordsCount = 0, academicPeriod = 'Academic Year', isPublic = false }) {
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
  const chartRefs = useRef([]);

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
          link.download = `student-enrollment-${timestamp}.png`;
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
    const college = processSDD('stud_college');
    const yearLevel = processSDD('stud_yrlevel').sort((a, b) => a.name.localeCompare(b.name));
    const vulnerabilities = [
      { id: '_pwd?', label: 'PWD' },
      { id: '_solo_parent?', label: 'Solo Parent' },
      { id: '_ip_member?', label: 'IP Member' },
      { id: '_working_student?', label: 'Working' },
      { id: 'is_child_lgbtq', label: 'Child of LGBTQ+' },
      { id: 'is_child_pdl', label: 'Child of PDL' },
      { id: 'is_child_solo_parent', label: 'Child of Solo Parent' },
    ].map(v => {
      const filtered = normalizedData.filter(d => d[v.id] === 'Yes');
      return { name: v.label, Female: filtered.filter(d => d.studgender === 'Female').length, Male: filtered.filter(d => d.studgender === 'Male').length };
    });
    const programs = processSDD('stud_program', 10);
    const ethnicity = processSDD('studethnic', 5);
    const religion = processSDD('studreligion', 5);
    const origin = processSDD('currentadd_prov', 5);
    const firstGen = processSDD('is_first_gen_learner');

    // NEW CHARTS DATA
    // 1. Socioeconomic Status - Income Brackets (More balanced ranges)
    const socioeconomic = (() => {
      const brackets = {
        'Below 50k': { name: 'Below ₱50k', Male: 0, Female: 0, total: 0 },
        '50k-100k': { name: '₱50k - ₱100k', Male: 0, Female: 0, total: 0 },
        '100k-200k': { name: '₱100k - ₱200k', Male: 0, Female: 0, total: 0 },
        '200k-300k': { name: '₱200k - ₱300k', Male: 0, Female: 0, total: 0 },
        '300k-500k': { name: '₱300k - ₱500k', Male: 0, Female: 0, total: 0 },
        '500k-1M': { name: '₱500k - ₱1M', Male: 0, Female: 0, total: 0 },
        'Above 1M': { name: 'Above ₱1M', Male: 0, Female: 0, total: 0 },
        'Not Specified': { name: 'Not Specified', Male: 0, Female: 0, total: 0 },
      };

      normalizedData.forEach(d => {
        const mother = parseFloat(d.mother_yrgross_income) || 0;
        const father = parseFloat(d.father_yrgross_income) || 0;
        const total = mother + father;
        const gender = d.studgender === 'Female' ? 'Female' : 'Male';

        let bracket = 'Not Specified';
        if (total > 0) {
          if (total < 50000) bracket = 'Below 50k';
          else if (total < 100000) bracket = '50k-100k';
          else if (total < 200000) bracket = '100k-200k';
          else if (total < 300000) bracket = '200k-300k';
          else if (total < 500000) bracket = '300k-500k';
          else if (total < 1000000) bracket = '500k-1M';
          else bracket = 'Above 1M';
        }

        brackets[bracket][gender]++;
        brackets[bracket].total++;
      });

      return Object.values(brackets).filter(b => b.total > 0);
    })();

    // 2. Disability Types Breakdown
    const disabilityTypes = (() => {
      const types = {};
      normalizedData.forEach(d => {
        const isPWD = d['_pwd?'] === 'Yes' || d.is_pwd === 'Yes';
        if (!isPWD) return;

        const aspect = d.pwd_aspect || 'Not Specified';
        const gender = d.studgender === 'Female' ? 'Female' : 'Male';

        if (!types[aspect]) types[aspect] = { name: aspect, Male: 0, Female: 0, total: 0 };
        types[aspect][gender]++;
        types[aspect].total++;
      });

      return Object.values(types).sort((a, b) => b.total - a.total);
    })();

    // 3. Indigenous Communities
    const indigenousCommunities = (() => {
      const communities = {};
      normalizedData.forEach(d => {
        const isIP = d['_ip_member?'] === 'Yes' || d.is_indigenous === 'Yes';
        if (!isIP) return;

        const group = d.indigenous_group || d.studethnic || 'Not Specified';
        const gender = d.studgender === 'Female' ? 'Female' : 'Male';

        if (!communities[group]) communities[group] = { name: group, Male: 0, Female: 0, total: 0 };
        communities[group][gender]++;
        communities[group].total++;
      });

      return Object.values(communities).sort((a, b) => b.total - a.total).slice(0, 8);
    })();

    return { college, yearLevel, vulnerabilities, programs, ethnicity, religion, origin, firstGen, socioeconomic, disabilityTypes, indigenousCommunities };
  }, [normalizedData]);

  if (!stats) return null;

  const charts = [
    {
      title: "Enrollment by College",
      desc: "Total student population distribution across colleges disaggregated by sex.",
      summary: [
        { label: 'Total Students', value: normalizedData.length.toLocaleString() },
        { label: 'Female', value: `${normalizedData.filter(d => d.studgender === 'Female').length.toLocaleString()} (${((normalizedData.filter(d => d.studgender === 'Female').length / normalizedData.length) * 100).toFixed(1)}%)`, color: COLORS.Female },
        { label: 'Male', value: `${normalizedData.filter(d => d.studgender === 'Male').length.toLocaleString()} (${((normalizedData.filter(d => d.studgender === 'Male').length / normalizedData.length) * 100).toFixed(1)}%)`, color: COLORS.Male },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.college} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={150} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: `${LILAC}10` }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={18} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Year Level Distribution",
      desc: "Progress of male vs female students per academic year level.",
      summary: [
        { label: 'Total Students', value: normalizedData.length.toLocaleString() },
        { label: 'Year Levels', value: stats.yearLevel.length },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.yearLevel}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Vulnerability & Support Tracking",
      desc: "Sex representation across specific support groups (PWD, 4Ps, Solo Parent, etc.).",
      summary: [
        { label: 'PWD', value: normalizedData.filter(d => d['_pwd?'] === 'Yes').length },
        { label: 'Solo Parent', value: normalizedData.filter(d => d['_solo_parent?'] === 'Yes').length },
        { label: 'IP Member', value: normalizedData.filter(d => d['_ip_member?'] === 'Yes').length },
        { label: 'Working Student', value: normalizedData.filter(d => d['_working_student?'] === 'Yes').length },
      ],
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.vulnerabilities}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} fontWeight="black" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Top 10 Degree Programs",
      desc: "Most populated academic programs disaggregated by gender.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.programs} layout="vertical">
            <YAxis dataKey="name" type="category" width={160} fontSize={8} />
            <XAxis type="number" hide />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={12} />
            <Bar dataKey="Female" stackId="a" fill={COLORS.Female} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Cultural Profile — Ethnicity",
      desc: "Top 5 ethnic groups represented in the student body.",
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
      desc: "Top 5 religious groups recorded in the data.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.religion}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={9} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "First Generation Students",
      desc: "Students who are the first in their families to attend college.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.firstGen}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Regional Origin",
      desc: "Top provinces where students are currently residing.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.origin} layout="vertical">
            <YAxis dataKey="name" type="category" fontSize={9} width={90} />
            <XAxis type="number" hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill={LILAC} radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Socioeconomic Distribution",
      desc: "Combined parental annual income brackets showing household economic status by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.socioeconomic}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={10} fontWeight="bold" angle={-15} textAnchor="end" height={60} />
            <YAxis fontSize={10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Female" fill={COLORS.Female} stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Disability Types & Aspects",
      desc: "Breakdown of specific disability types among PWD students disaggregated by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          {stats.disabilityTypes.length > 0 ? (
            <BarChart data={stats.disabilityTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={140} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: `${LILAC}10` }} content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={16} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No PWD data with specified disability types</p>
            </div>
          )}
        </ResponsiveContainer>
      ),
    },
    {
      title: "Indigenous Communities",
      desc: "Representation of specific indigenous peoples and cultural groups by sex.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          {stats.indigenousCommunities.length > 0 ? (
            <BarChart data={stats.indigenousCommunities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: `${LILAC}10` }} content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={16} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No indigenous community data specified</p>
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

        {/* Right side: Actions dropdown + Theme selector + Records count */}
        <div className="flex items-center gap-2">
          {/* Actions Dropdown (Report, Copy, Download) - Hidden in public mode */}
          {!isPublic && (
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
          )}

          {/* Theme Selector - Hidden in public mode */}
          {!isPublic && (
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
          )}

          {/* Records count */}
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">
            {recordsCount.toLocaleString()} records
          </span>
        </div>
      </div>

      {/* ── Chart content area (for capture) ── */}
      <div className="flex-1 flex flex-col min-h-0" ref={chartRef}>
        {/* ── Title ── */}
        <div className="px-6 pt-2 pb-1">
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

      {/* Report Generator Modal - Hidden in public mode */}
      {!isPublic && (
        <ReportGeneratorModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          charts={charts}
          academicPeriod={academicPeriod}
          datasetName="Student Enrollment"
          captureChartFn={captureChartByIndex}
        />
      )}

    </div>
  );
}
