import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, AreaChart, Area
} from 'recharts';
import { Zap, Trophy, Users, BookOpen, Star, GraduationCap, Award, ShieldCheck, Target, AlertCircle } from 'lucide-react';

const COLORS = {
  Male: '#3b82f6', 
  Female: '#ec4899',
  palette: ['#8b5cf6', '#6366f1', '#d946ef', '#f43f5e', '#f59e0b', '#10b981']
};

/** * Bulletproof Helpers (Defined outside useMemo to avoid ReferenceErrors)
 */
const getVal = (row, key1, key2) => {
  const v = row[key1] || row[key2];
  return v ? v.toString().trim() : '';
};

const isActive = (val) => {
  if (!val) return false;
  const lower = val.toLowerCase();
  // Excludes common "empty" indicators found in the dataset
  return !['none', 'paying', 'no', 'n/a', '', ' '].includes(lower);
};

export default function StudentEngagementVisuals({ data = [] }) {
  
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Scholarship Type SDD
    const scholarshipMap = data.reduce((acc, curr) => {
      const type = getVal(curr, 'scholarship_status', 'Scholarship') || 'Non-Scholar';
      if (!acc[type]) acc[type] = { name: type, Male: 0, Female: 0, total: 0 };
      acc[type][curr.sex === 'Female' ? 'Female' : 'Male']++;
      acc[type].total++;
      return acc;
    }, {});

    // 2. Academic Honors SDD
    const academicMap = data.reduce((acc, curr) => {
      const raw = getVal(curr, 'academic_standing', 'Academic Standing');
      const standing = isActive(raw) ? raw : 'Regular Student';
      if (!acc[standing]) acc[standing] = { name: standing, Male: 0, Female: 0 };
      acc[standing][curr.sex === 'Female' ? 'Female' : 'Male']++;
      return acc;
    }, {});

    // 3. Student Council SDD
    const councilMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_council', 'student_council');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      }
      return acc;
    }, {});

    // 4. Publication SDD
    const pubMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_publication', 'publication');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      }
      return acc;
    }, {});

    // 5. Top Organizations
    const orgMap = data.reduce((acc, curr) => {
      const val = getVal(curr, 'student_organization', 'organizations');
      if (isActive(val)) {
        if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
        acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
        acc[val].total++;
      }
      return acc;
    }, {});

    // 6. Leadership Overlap
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

    // 7. Saturation
    const saturation = [
      { name: 'Highly Active (3+)', value: data.filter(d => [isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].filter(Boolean).length >= 3).length },
      { name: 'Active (1-2)', value: data.filter(d => {
          const count = [isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].filter(Boolean).length;
          return count >= 1 && count < 3;
        }).length 
      },
      { name: 'Not Engaged', value: data.filter(d => ![isActive(getVal(d, 'student_publication')), isActive(getVal(d, 'student_council')), isActive(getVal(d, 'student_organization'))].some(Boolean)).length }
    ];

    return { 
      scholarship: Object.values(scholarshipMap).sort((a,b) => b.total - a.total),
      academic: Object.values(academicMap),
      council: Object.values(councilMap),
      pub: Object.values(pubMap),
      orgs: Object.values(orgMap).sort((a,b) => b.total - a.total).slice(0, 5),
      overlap,
      saturation
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
        <AlertCircle className="text-slate-300 mb-4" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Engagement Data Loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={data.length} icon={<Zap className="text-amber-500"/>} />
        <StatCard label="Honors" value={data.filter(d => isActive(getVal(d, 'academic_standing'))).length} icon={<Award className="text-pink-500"/>} />
        <StatCard label="Leaders" value={data.filter(d => isActive(getVal(d, 'student_council'))).length} icon={<ShieldCheck className="text-blue-500"/>} />
        <StatCard label="Published" value={data.filter(d => isActive(getVal(d, 'student_publication'))).length} icon={<BookOpen className="text-emerald-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="1. Scholarship Grant (SDD)" icon={<GraduationCap className="text-purple-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
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
        </ChartBox>

        <ChartBox title="2. Academic Standing (Honors)" icon={<Award className="text-pink-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.academic} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} width={100} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={15} />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="3. Council Participation" icon={<ShieldCheck className="text-blue-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.council}>
              <XAxis dataKey="name" fontSize={9} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} radius={[4,4,0,0]} />
              <Bar dataKey="Male" fill={COLORS.Male} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="4. Publications SDD" icon={<BookOpen className="text-emerald-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.pub}>
              <XAxis dataKey="name" fontSize={9} />
              <Tooltip />
              <Area type="monotone" dataKey="Female" fill={COLORS.Female} stroke={COLORS.Female} fillOpacity={0.4} />
              <Area type="monotone" dataKey="Male" fill={COLORS.Male} stroke={COLORS.Male} fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="5. Top 5 Organizations" icon={<Users className="text-indigo-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.orgs} layout="vertical">
              <YAxis dataKey="name" type="category" fontSize={8} width={120} />
              <XAxis type="number" hide />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={10} />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="6. Leadership Excellence" icon={<Target className="text-amber-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.overlap}>
              <XAxis dataKey="name" fontSize={10} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} />
              <Bar dataKey="Male" fill={COLORS.Male} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="7. Engagement Saturation" icon={<Zap className="text-orange-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.saturation} innerRadius={50} outerRadius={80} dataKey="value">
                {stats.saturation.map((_, i) => <Cell key={i} fill={COLORS.palette[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="8. Gender Engagement Ratio" icon={<Star className="text-pink-500"/>}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={[
                  { name: 'Female Active', value: data.filter(d => d.sex === 'Female' && isActive(getVal(d, 'student_organization', 'organizations'))).length },
                  { name: 'Male Active', value: data.filter(d => d.sex === 'Male' && isActive(getVal(d, 'student_organization', 'organizations'))).length }
                ]} 
                dataKey="value" innerRadius={0} outerRadius={80} label
              >
                <Cell fill={COLORS.Female} />
                <Cell fill={COLORS.Male} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm mb-4">9. Organization SDD Detail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 uppercase tracking-tighter text-slate-500">
                <th className="p-2">Organization</th>
                <th className="p-2 text-pink-600">Female</th>
                <th className="p-2 text-blue-600">Male</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.orgs.map((org, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="p-2 font-bold">{org.name}</td>
                  <td className="p-2">{org.Female}</td>
                  <td className="p-2">{org.Male}</td>
                  <td className="p-2 font-black">{org.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon && React.cloneElement(icon, { size: 16 })}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function ChartBox({ title, icon, children }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-50 rounded-xl">{icon && React.cloneElement(icon, { size: 18 })}</div>
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}