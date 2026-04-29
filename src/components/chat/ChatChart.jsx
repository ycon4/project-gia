import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

const SEX_COLORS = {
  Male: '#73DAE1', M: '#73DAE1',
  Female: '#a673d8', F: '#a673d8',
  Unknown: '#9ca3af',
};
const PALETTE = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
const getColor = (key, index) => SEX_COLORS[key] ?? PALETTE[index % PALETTE.length];

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
  if (!chartData || chartData.error) return null;

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
      <div className="mt-4 pt-4 border-t border-purple-100">
        <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Breakdown by College</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={CHART_LABEL} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showKeys.map((k, i) => (
              <Bar
                key={k} dataKey={k} stackId="a" fill={getColor(k, i)}
                radius={i === showKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
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
      <div className="mt-4 pt-4 border-t border-purple-100">
        <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Year-over-Year Trend</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={CHART_LABEL} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={getColor(k, i)} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
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
      <div className="mt-4 pt-4 border-t border-purple-100">
        <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">College Comparison</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={CHART_LABEL} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {showKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={getColor(k, i)} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
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

      return (
        <div className="mt-4 pt-4 border-t border-purple-100">
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
            {abbr(entries[0][0])} — {chartData.collection}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={getColor(entry.name, i)} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_LABEL} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
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
        <div className="mt-4 pt-4 border-t border-purple-100">
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
            {chartData.collection} — {chartData.academicYear}
          </p>
          <ResponsiveContainer width="100%" height={needsRotation ? 300 : 260}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: needsRotation ? 60 : 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={needsRotation ? -30 : 0}
                textAnchor={needsRotation ? 'end' : 'middle'}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={CHART_LABEL} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {showKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={getColor(k, i)} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }

  return null;
}
