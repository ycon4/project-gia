import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, ComposedChart, Area
} from 'recharts';
import { Users, Globe, Wallet, ShieldCheck, Heart, MapPin, Landmark, BookOpen } from 'lucide-react';

const THEME = {
  primary: '#4f46e5', // Indigo
  secondary: '#0ea5e9', // Sky
  accent: '#ec4899', // Pink
  neutral: '#64748b', // Slate
  grid: '#f1f5f9',
  colors: ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4']
};

export default function StudentEnrollmentVisuals({ data }) {
  
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const total = data.length;

    const maps = { college: {}, intl: {}, income: {}, ethnicity: {}, religion: {}, origin: {}, occupation: {} };
    const binary = { pwd: 0, solo: 0, ip: 0, '4ps': 0, working: 0, first_gen: 0, ofw: 0 };

    data.forEach(item => {
      // Basic Distributions
      const col = item.college || 'Unassigned';
      if (!maps.college[col]) maps.college[col] = { name: col, Male: 0, Female: 0, count: 0 };
      maps.college[col][item.sex === 'Female' ? 'Female' : 'Male']++;
      maps.college[col].count++;

      // Socio-demographics
      [ 'income_PSA_category', 'ethnicity', 'religion', 'place_of_origin', 'occupation_household_head' ].forEach(key => {
        const val = item[key] || 'Not Specified';
        const mapKey = key === 'income_PSA_category' ? 'income' : key.replace('place_of_', '').replace('_household_head', '');
        maps[mapKey][val] = (maps[mapKey][val] || 0) + 1;
      });

      if (item['_international_student?'] === 'Yes') {
        const prog = item.program || 'Other';
        maps.intl[prog] = (maps.intl[prog] || 0) + 1;
      }

      // Percentage Counters
      if (item['_pwd?'] === 'Yes') binary.pwd++;
      if (item['_solo_parent?'] === 'Yes') binary.solo++;
      if (item['_ip_member?'] === 'Yes') binary.ip++;
      if (item['_4ps_beneficiary?'] === 'Yes') binary['4ps']++;
      if (item['_working_student?'] === 'Yes') binary.working++;
      if (item['_first_generation?'] === 'Yes') binary.first_gen++;
      if (item['_ofw_dependent?'] === 'Yes') binary.ofw++;
    });

    const getPerc = (val) => ((val / total) * 100).toFixed(1);
    const getTop = (obj) => Object.entries(obj).sort((a,b) => b[1]-a[1])[0]?.[0] || "N/A";

    return {
      total,
      collegeData: Object.values(maps.college).map(v => ({ ...v, perc: getPerc(v.count) })).sort((a,b) => b.count - a.count),
      incomeData: Object.entries(maps.income).map(([name, value]) => ({ name, value, perc: getPerc(value) })),
      ethnicityData: Object.entries(maps.ethnicity).map(([name, value]) => ({ name, value, perc: getPerc(value) })),
      originData: Object.entries(maps.origin).map(([name, value]) => ({ name, value, perc: getPerc(value) })),
      intlData: Object.entries(maps.intl).map(([name, value]) => ({ name, value })),
      radialData: [
        { name: 'Working Student', value: parseFloat(getPerc(binary.working)), fill: '#06b6d4' },
        { name: '4Ps Beneficiary', value: parseFloat(getPerc(binary['4ps'])), fill: '#10b981' },
        { name: 'IP Member', value: parseFloat(getPerc(binary.ip)), fill: '#ec4899' },
        { name: 'OFW Dependent', value: parseFloat(getPerc(binary.ofw)), fill: '#f59e0b' },
        { name: 'First Gen', value: parseFloat(getPerc(binary.first_gen)), fill: '#f43f5e' },
      ],
      occupationData: Object.entries(maps.occupation).sort((a,b) => b[1]-a[1]).slice(0, 5),
      indicators: binary,
      insights: {
        college: `${getTop(Object.fromEntries(Object.values(maps.college).map(v => [v.name, v.count])))} represents the largest share of the student body.`,
        income: `Economic data indicates that ${getPerc(maps.income[getTop(maps.income)])}% of students identify with the ${getTop(maps.income)} bracket.`,
        intl: `International enrollment is currently dominated by the ${getTop(maps.intl)} program.`
      }
    };
  }, [data]);

  if (!stats) return null;

  const StatCard = ({ label, count, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800">{((count/stats.total)*100).toFixed(1)}%</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* TOP STATS CARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="PWD Students" count={stats.indicators.pwd} icon={ShieldCheck} color="bg-indigo-500" />
        <StatCard label="Solo Parents" count={stats.indicators.solo} icon={Heart} color="bg-rose-500" />
        <StatCard label="IP Members" count={stats.indicators.ip} icon={Landmark} color="bg-pink-500" />
        <StatCard label="Working Students" count={stats.indicators.working} icon={BookOpen} color="bg-sky-500" />
      </div>

      {/* MAIN ENROLLMENT COMPARISON */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Enrollment Rate per College</h3>
          <p className="text-[11px] text-slate-500 italic mt-1">{stats.insights.college}</p>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer>
            <ComposedChart data={stats.collegeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={THEME.grid} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={140} fontSize={10} fontWeight={800} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px'}} />
              <Bar dataKey="Male" stackId="a" fill="#3b82f6" barSize={18} />
              <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={18} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SOCIO-DEMOGRAPHIC RADIAL */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Demographic Saturation (%)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={10} data={stats.radialData}>
                <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" />
                <Tooltip formatter={(value) => `${value}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INCOME DISTRIBUTION */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">PSA Income Breakdown</h3>
          <p className="text-[11px] text-slate-500 italic mb-6">{stats.insights.income}</p>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.incomeData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {stats.incomeData.map((_, i) => <Cell key={i} fill={THEME.colors[i % THEME.colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} Students (${props.payload.perc}%)`, 'Count']} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* INTERNATIONAL & OCCUPATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <Globe size={14} className="text-indigo-500" /> International Enrollment
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <BarChart data={stats.intlData}>
                <XAxis dataKey="name" fontSize={9} fontWeight={700} interval={0} angle={-15} textAnchor="end" height={50} />
                <Tooltip />
                <Bar dataKey="value" fill={THEME.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed tracking-tight uppercase font-bold">Insight: {stats.insights.intl}</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Household Head Occupation</h3>
          <div className="space-y-5">
            {stats.occupationData.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-[10px] font-black mb-1 uppercase tracking-tighter">
                  <span className="text-slate-500">{name}</span>
                  <span className="text-indigo-600">{((count/stats.total)*100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-50 h-2 rounded-full border border-slate-100 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(count/stats.total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}