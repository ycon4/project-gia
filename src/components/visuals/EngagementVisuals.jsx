import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Zap, Trophy, Users, BookOpen, Star, GraduationCap } from 'lucide-react';

export default function StudentEngagementVisuals({ data }) {
  
  // 1. Scholarship Status SDD
  const scholarshipSDD = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const status = curr.scholarship_status || 'Non-Scholar';
      if (!acc[status]) acc[status] = { name: status, Male: 0, Female: 0 };
      const sex = curr.sex === 'Female' ? 'Female' : 'Male';
      acc[status][sex]++;
      return acc;
    }, {});
    return Object.values(counts);
  }, [data]);

  // 2. Leadership SDD (Student Council)
  const leadershipSDD = useMemo(() => {
    const councilMembers = data.filter(d => 
      d.student_council?.toLowerCase() === 'yes' || d.student_council === 'Yes'
    );
    const counts = { name: 'Student Council', Male: 0, Female: 0 };
    councilMembers.forEach(d => {
      const sex = d.sex === 'Female' ? 'Female' : 'Male';
      counts[sex]++;
    });
    return [counts];
  }, [data]);

  // 3. Organization Membership Distribution
  const orgSummary = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const org = curr.organizations || 'None';
      acc[org] = (acc[org] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 Orgs
  }, [data]);

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Engaged" value={data.length} icon={<Zap className="text-amber-500" size={16}/>} />
        <StatCard 
          label="Scholars" 
          value={data.filter(d => d.scholarship_status && d.scholarship_status !== 'None').length} 
          icon={<GraduationCap className="text-purple-500" size={16}/>} 
        />
        <StatCard 
          label="Student Leaders" 
          value={data.filter(d => d.student_council?.toLowerCase() === 'yes').length} 
          icon={<Star className="text-blue-500" size={16}/>} 
        />
        <StatCard 
          label="Researchers" 
          value={data.filter(d => d.publication?.toLowerCase() === 'yes').length} 
          icon={<BookOpen className="text-emerald-500" size={16}/>} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scholarship SDD Chart */}
        <VisualCard title="Scholarship Distribution by Sex" icon={<Trophy size={18} className="text-purple-500"/>}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scholarshipSDD}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Female" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Male" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VisualCard>

        {/* Organization Participation Pie */}
        <VisualCard title="Top Student Organizations" icon={<Users size={18} className="text-blue-500"/>}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={orgSummary} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {orgSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </VisualCard>
      </div>

      {/* Leadership & Research SDD Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <VisualCard title="Student Council" icon={<Star size={18} className="text-amber-500"/>}>
                <div className="flex flex-col justify-center h-48">
                    {leadershipSDD.map(item => (
                        <div key={item.name} className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-slate-500">Female Leaders</span>
                                <span className="text-xl font-black text-pink-500">{item.Female}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-pink-500 h-full" 
                                  style={{ width: `${(item.Female / (item.Female + item.Male || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-slate-500">Male Leaders</span>
                                <span className="text-xl font-black text-blue-500">{item.Male}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-blue-500 h-full" 
                                  style={{ width: `${(item.Male / (item.Female + item.Male || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </VisualCard>
          </div>

          <div className="lg:col-span-2">
            <VisualCard title="Research Publication Participation" icon={<BookOpen size={18} className="text-emerald-500"/>}>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                    <p className="text-xs text-emerald-800 font-medium">
                        Tracking student involvement in academic publications as part of GAD research objectives.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female Published</p>
                        <p className="text-3xl font-black text-emerald-600">
                            {data.filter(d => d.publication?.toLowerCase() === 'yes' && d.sex === 'Female').length}
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male Published</p>
                        <p className="text-3xl font-black text-emerald-600">
                            {data.filter(d => d.publication?.toLowerCase() === 'yes' && d.sex === 'Male').length}
                        </p>
                    </div>
                </div>
            </VisualCard>
          </div>
      </div>

      {/* Signature Section */}
      <div className="hidden print:grid grid-cols-2 gap-20 mt-16 pt-10 border-t border-gray-300">
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-[10px] font-black uppercase">Prepared By: GADC Coordinator</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-[10px] font-black uppercase">Noted By: Dean of Student Affairs</p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function VisualCard({ title, icon, children }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}