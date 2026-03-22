import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];

const SectionTitle = ({ children, desc }) => (
  <div className="mb-4">
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{children}</h3>
    {desc && <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">{desc}</p>}
  </div>
);

export default function EventVisuals({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. Bar Chart: Session SDD */}
      <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <SectionTitle desc="Comparing Male and Female attendance per session">Session SDD Breakdown</SectionTitle>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.sessionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} axisLine={false} />
              <YAxis tick={{fontSize: 9}} axisLine={false} />
              <Tooltip contentStyle={{borderRadius: '20px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{fontSize: 9, fontWeight: 'black', textTransform: 'uppercase', paddingTop: 10}} />
              <Bar dataKey="Male" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="Female" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Doughnut: Sector Distribution */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <SectionTitle desc="Participants by designated sector">Sector Split</SectionTitle>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.sectorData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {stats.sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {stats.sectorData.map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase">
              <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/> {s.name}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Horizontal Bar: Top Offices/Colleges */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <SectionTitle desc="Highest participation by office">Top Units</SectionTitle>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={stats.officeData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{fontSize: 8, fontWeight: 'bold'}} width={60} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Pie Chart: GAD Inclusion */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <SectionTitle desc="Percentage of PWD participants">Inclusion Metric</SectionTitle>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.inclusionData} innerRadius={0} outerRadius={70} dataKey="value" labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#10b981" />
                <Cell fill="#f1f5f9" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}