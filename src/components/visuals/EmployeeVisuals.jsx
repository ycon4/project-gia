import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ShieldAlert, Wallet, Globe, Users, Briefcase, Star } from 'lucide-react';

export default function EmployeeVisuals({ data }) {
  
  // 1. Employee Type Breakdown (Faculty vs Staff vs etc)
  const typeSummary = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const type = curr.employee_type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  // 2. Position Category SDD (Sex-Disaggregated Data)
  const positionSDD = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const pos = curr.plantilla_position || 'General';
      if (!acc[pos]) acc[pos] = { name: pos, Male: 0, Female: 0 };
      const sex = curr.sex === 'Female' ? 'Female' : 'Male';
      acc[pos][sex]++;
      return acc;
    }, {});
    return Object.values(counts).sort((a, b) => (b.Male + b.Female) - (a.Male + a.Female)).slice(0, 8);
  }, [data]);

  // 3. Income Breakdown SDD
  const incomeSDD = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const level = curr.income || 'Not Disclosed';
      if (!acc[level]) acc[level] = { name: level, Male: 0, Female: 0 };
      const sex = curr.sex === 'Female' ? 'Female' : 'Male';
      acc[level][sex]++;
      return acc;
    }, {});
    return Object.values(counts);
  }, [data]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Workforce" value={data.length} icon={<Users className="text-blue-600" size={16}/>} />
        <StatCard label="Male Staff" value={data.filter(d => d.sex === 'Male').length} icon={<Users className="text-blue-400" size={16}/>} />
        <StatCard label="Female Staff" value={data.filter(d => d.sex === 'Female').length} icon={<Users className="text-pink-400" size={16}/>} />
        <StatCard label="Admin Officials" value={data.filter(d => d.administrative_officials?.toLowerCase() === 'yes' || d.administrative_officials === 'Yes').length} icon={<Star className="text-amber-500" size={16}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plantilla Position SDD */}
        <VisualCard title="Top Positions by Sex (SDD)" icon={<Briefcase size={18} className="text-blue-500"/>}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionSDD} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#64748b'}} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Female" stackId="a" fill="#f472b6" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VisualCard>

        {/* Income Distribution */}
        <VisualCard title="Income Range Distribution" icon={<Wallet size={18} className="text-green-500"/>}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeSDD} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" fontSize={10} hide />
                <YAxis dataKey="name" type="category" fontSize={9} width={100} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Female" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Male" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VisualCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Type Pie Chart */}
          <VisualCard title="Employee Category" icon={<Users size={18} className="text-purple-500"/>}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeSummary} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {typeSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </VisualCard>

          {/* Diversity Tags */}
          <div className="lg:col-span-2">
            <VisualCard title="Cultural & Diversity Profile" icon={<Globe size={18} className="text-orange-500"/>}>
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Ethnic Groups</p>
                        <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(data.map(d => d.ethnicity))).filter(Boolean).map(eth => (
                            <div key={eth} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-700">{eth}</span>
                                <span className="text-[10px] font-medium bg-white px-1.5 rounded text-blue-500">{data.filter(d => d.ethnicity === eth).length}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Special Needs/PWD</p>
                        <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(data.map(d => d.special_needs))).filter(Boolean).map(sn => (
                            <div key={sn} className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                                <span className="text-xs font-bold text-red-700">{sn}</span>
                                <span className="text-[10px] font-medium bg-white px-1.5 rounded text-red-500">{data.filter(d => d.special_needs === sn).length}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </VisualCard>
          </div>
      </div>

      {/* Signature Section */}
      <div className="hidden print:grid grid-cols-2 gap-20 mt-16 pt-10 border-t border-gray-300">
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-[10px] font-black uppercase tracking-widest">Generated By HRMS/GADC</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black w-48 mx-auto mb-2"></div>
          <p className="text-[10px] font-black uppercase tracking-widest">Certified Correct</p>
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