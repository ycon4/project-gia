import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useState, useRef } from 'react';
import { Copy, Check, Palette, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const COLLEGE_ABBR = {
  'College of Science and Mathematics': 'CSM',
  'College of Engineering': 'COE',
  'College of Computer Studies': 'CCS',
  'College of Health Sciences': 'CHS',
  'College of Arts and Social Sciences': 'CASS',
  'College of Economics, Business, and Accountancy': 'CEBA',
  'College of Education': 'CED',
};

const abbr = (name) => COLLEGE_ABBR[name] || name;

// Color theme definitions
const COLOR_THEMES = {
  default: {
    name: 'GIA Purple',
    sex: {
      Male: '#c084fc', M: '#c084fc',      // Lilac
      Female: '#f59e0b', F: '#f59e0b',    // Amber
      Unknown: '#9ca3af',
    },
    palette: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
  },
  ocean: {
    name: 'Ocean Blue',
    sex: {
      Male: '#0ea5e9', M: '#0ea5e9',      // Sky blue
      Female: '#06b6d4', F: '#06b6d4',    // Cyan
      Unknown: '#9ca3af',
    },
    palette: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22d3ee', '#3b82f6', '#60a5fa'],
  },
  forest: {
    name: 'Forest Green',
    sex: {
      Male: '#10b981', M: '#10b981',      // Emerald
      Female: '#84cc16', F: '#84cc16',    // Lime
      Unknown: '#9ca3af',
    },
    palette: ['#10b981', '#84cc16', '#22c55e', '#4ade80', '#059669', '#65a30d'],
  },
  sunset: {
    name: 'Sunset Warm',
    sex: {
      Male: '#f59e0b', M: '#f59e0b',      // Amber
      Female: '#ef4444', F: '#ef4444',    // Red
      Unknown: '#9ca3af',
    },
    palette: ['#f59e0b', '#ef4444', '#f97316', '#fb923c', '#dc2626', '#fbbf24'],
  },
  berry: {
    name: 'Berry Mix',
    sex: {
      Male: '#ec4899', M: '#ec4899',      // Pink
      Female: '#a855f7', F: '#a855f7',    // Purple
      Unknown: '#9ca3af',
    },
    palette: ['#ec4899', '#a855f7', '#d946ef', '#f472b6', '#c026d3', '#e879f9'],
  },
  professional: {
    name: 'Professional',
    sex: {
      Male: '#3b82f6', M: '#3b82f6',      // Blue
      Female: '#8b5cf6', F: '#8b5cf6',    // Violet
      Unknown: '#9ca3af',
    },
    palette: ['#3b82f6', '#8b5cf6', '#6366f1', '#60a5fa', '#7c3aed', '#a78bfa'],
  },
  msuiit: {
    name: 'MSU-IIT',
    sex: {
      Male: '#7c2529', M: '#7c2529',      // MSU Maroon
      Female: '#d4af37', F: '#d4af37',    // MSU Gold
      Unknown: '#9ca3af',
    },
    palette: ['#7c2529', '#d4af37', '#9b2c2c', '#ecc94b', '#5a1a1d', '#b8941f'],
  },
};

// Returns non-Total, non-percentage keys (i.e. sex/category keys)
const getSexKeys = (counts) =>
  Object.keys(counts).filter(k => k !== 'Total' && !k.endsWith(' %'));

// Sum a key's value across all groups in a data object
const sumAcrossGroups = (data, key) =>
  Object.values(data).reduce((sum, counts) => sum + (counts[key] || 0), 0);

const CHART_LABEL = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

export default function ChatChart({ chartData }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const chartRef = useRef(null);

  // Get color function based on current theme
  const getColor = (key, index) => {
    const theme = COLOR_THEMES[currentTheme];
    return theme.sex[key] ?? theme.palette[index % theme.palette.length];
  };

  const captureChart = async () => {
    if (!chartRef.current) return null;

    // Temporarily force white background and dark text for capturing
    const originalBg = chartRef.current.style.backgroundColor;
    const originalColor = chartRef.current.querySelector('p')?.style.color;

    chartRef.current.style.backgroundColor = '#ffffff';
    const titleElement = chartRef.current.querySelector('p');
    if (titleElement) {
      titleElement.style.color = '#6b7280';
    }

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    // Restore original styles
    chartRef.current.style.backgroundColor = originalBg;
    if (titleElement && originalColor) {
      titleElement.style.color = originalColor;
    }

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
          link.download = `chart-${timestamp}.png`;
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

  if (!chartData || chartData.error) return null;

  // Reusable chart actions JSX
  const chartActionsJSX = (
    <div className="flex justify-end items-center gap-2 mb-2">
      {/* Theme Selector */}
      <div className="relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
          title="Change color theme"
        >
          <Palette size={12} />
          <span>Theme</span>
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
                {currentTheme === key && <span className="text-gia-600 dark:text-gia-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={downloadChartAsImage}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
        title="Download chart as PNG"
      >
        {downloaded ? (
          <>
            <Check size={12} className="text-green-500" />
            <span className="text-green-500">Downloaded!</span>
          </>
        ) : (
          <>
            <Download size={12} />
            <span>Download</span>
          </>
        )}
      </button>

      {/* Copy Button */}
      <button
        onClick={copyChartAsImage}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
        title="Copy chart as image"
      >
        {copied ? (
          <>
            <Check size={12} className="text-green-500" />
            <span className="text-green-500">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={12} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );

  // ── Multi-filter grouped by college → Stacked bar chart ───
  if (chartData.isMultiFilter && chartData.isGroupedByCollege && chartData.collegeResults) {
    const entries = Object.entries(chartData.collegeResults)
      .sort(([, a], [, b]) => b.totalRecords - a.totalRecords);
    if (entries.length === 0) return null;

    // Union sex keys across ALL colleges — a college with only Male students
    // would otherwise hide Female bars that appear in other colleges.
    const allSexKeys = new Set();
    entries.forEach(([, res]) => {
      getSexKeys(Object.values(res.data)[0] || {}).forEach(k => allSexKeys.add(k));
    });
    const sexKeys = [...allSexKeys];
    const showKeys = sexKeys.length > 0 ? sexKeys : ['Total'];

    const data = entries.map(([college, res]) => {
      const counts = Object.values(res.data)[0] || {};
      const point = { name: abbr(college), Total: res.totalRecords };
      sexKeys.forEach(k => { point[k] = counts[k] || 0; });
      return point;
    });

    return (
      <div className="mt-4 pt-4 border-t border-purple-100 relative">
        {chartActionsJSX}
        <div ref={chartRef} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">Breakdown by College</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              {showKeys.map((k, i) => (
                <Bar
                  key={k} dataKey={k} stackId="a" fill={getColor(k, i)}
                  radius={i === showKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div >
    );
  }

  // ── Year comparison → Line chart ──────────────────────────
  if (chartData.isComparison && !chartData.isCollegeComparison && chartData.yearResults) {
    const years = Object.entries(chartData.yearResults);
    if (years.length < 2) return null;

    const firstValues = Object.values(years[0][1].data);
    const sexKeys = firstValues.length > 0 ? getSexKeys(firstValues[0]) : [];
    const showKeys = sexKeys.length > 0 ? sexKeys : ['Total'];

    const data = years.map(([year, res]) => {
      const point = { name: year, Total: sumAcrossGroups(res.data, 'Total') };
      sexKeys.forEach(k => { point[k] = sumAcrossGroups(res.data, k); });
      return point;
    });

    return (
      <div className="mt-4 pt-4 border-t border-purple-100 relative">
        {chartActionsJSX}
        <div ref={chartRef} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">Year-over-Year Trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              {showKeys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={getColor(k, i)} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── College comparison → Grouped bar chart ─────────────────
  if (chartData.isComparison && chartData.isCollegeComparison && chartData.collegeResults) {
    const colleges = Object.entries(chartData.collegeResults);
    if (colleges.length < 2) return null;

    const allCollegeSexKeys = new Set();
    colleges.forEach(([, res]) => getSexKeys(Object.values(res.data)[0] || {}).forEach(k => allCollegeSexKeys.add(k)));
    const sexKeys = [...allCollegeSexKeys];
    const showKeys = sexKeys.length > 0 ? sexKeys : ['Total'];

    const data = colleges
      .map(([college, res]) => {
        const point = { name: abbr(college), Total: sumAcrossGroups(res.data, 'Total') };
        sexKeys.forEach(k => { point[k] = sumAcrossGroups(res.data, k); });
        return point;
      })
      .sort((a, b) => b.Total - a.Total);

    return (
      <div className="mt-4 pt-4 border-t border-purple-100 relative">
        {chartActionsJSX}
        <div ref={chartRef} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">College Comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                iconType="circle"
              />
              {showKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={getColor(k, i)} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── Single query ────────────────────────────────────────────
  if (!chartData.isComparison && chartData.data) {
    const entries = Object.entries(chartData.data);
    if (entries.length === 0) return null;

    const sexKeys = getSexKeys(entries[0][1]);

    // 1 group with sex breakdown → Pie chart
    if (entries.length === 1 && sexKeys.length >= 2) {
      const counts = entries[0][1];
      const pieData = sexKeys.map(k => ({ name: k, value: counts[k] || 0 }));
      if (pieData.every(d => d.value === 0)) return null;

      // Custom label renderer to prevent overflow
      const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
        const RADIAN = Math.PI / 180;
        // Position labels outside the pie with some padding
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        // Determine text anchor based on which side of the pie
        const textAnchor = x > cx ? 'start' : 'end';

        return (
          <text
            x={x}
            y={y}
            fill="#6b7280"
            textAnchor={textAnchor}
            dominantBaseline="central"
            fontSize={12}
            fontWeight={500}
          >
            {`${name} ${(percent * 100).toFixed(1)}%`}
          </text>
        );
      };

      return (
        <div className="mt-4 pt-4 border-t border-purple-100 relative">
          {chartActionsJSX}
          <div ref={chartRef} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">
              {abbr(entries[0][0])} — {chartData.collection}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="45%"
                  outerRadius={85}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={getColor(entry.name, i)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // 2+ groups → Bar chart
    if (entries.length >= 2) {
      const showKeys = sexKeys.length > 0 ? sexKeys : ['Total'];
      const needsRotation = entries.length > 4;

      const data = entries
        .map(([group, counts]) => {
          const point = { name: abbr(group), Total: counts.Total || 0 };
          sexKeys.forEach(k => { point[k] = counts[k] || 0; });
          return point;
        })
        .sort((a, b) => b.Total - a.Total);

      return (
        <div className="mt-4 pt-4 border-t border-purple-100 relative">
          {chartActionsJSX}
          <div ref={chartRef} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-4">
              {chartData.collection} — {chartData.academicYear}
            </p>
            <ResponsiveContainer width="100%" height={needsRotation ? 340 : 300}>
              <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: needsRotation ? 80 : 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  angle={needsRotation ? -35 : 0}
                  textAnchor={needsRotation ? 'end' : 'middle'}
                  interval={0}
                  height={needsRotation ? 80 : 30}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  iconType="circle"
                />
                {showKeys.map((k, i) => (
                  <Bar key={k} dataKey={k} fill={getColor(k, i)} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
  }

  return null;
}

