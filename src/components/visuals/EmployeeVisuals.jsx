import React, { useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area
} from 'recharts';
import { ShieldAlert, Wallet, Globe, Users, Briefcase, Star, School, Info, Printer, Heart } from 'lucide-react';

export default function EmployeeVisuals({ data }) {
  const reportRef = useRef();

  // --- DATA PROCESSING HELPER ---
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

  // 1. Employment Status
  const plantillaSDD = useMemo(() => {
    const cats = { 'Plantilla': { name: 'Plantilla', Male: 0, Female: 0 }, 'Non-Plantilla': { name: 'Non-Plantilla', Male: 0, Female: 0 } };
    data.forEach(d => {
      const type = (d.plantilla_position && d.plantilla_position !== 'N/A' && d.plantilla_position !== 'None') ? 'Plantilla' : 'Non-Plantilla';
      cats[type][d.sex === 'Female' ? 'Female' : 'Male']++;
    });
    return Object.values(cats);
  }, [data]);

  // 2. Income Category (Sorted by logical order)
  const incomeOrder = ["Low Income", "Lower Middle Income", "Middle Income", "Upper Middle Income", "High Income"];
  const incomeSDD = useMemo(() => {
    const raw = getSDD('income_order');
    return incomeOrder.map(label => raw.find(r => r.name === label) || { name: label, Male: 0, Female: 0 });
  }, [data]);

  // 3. College (Teaching Faculty Only)
  const collegeSDD = useMemo(() => getSDD('college', d => d.employee_type?.toLowerCase().includes('teaching')), [data]);
  
  // 4. Admin Officials vs Staff
  const adminSDD = useMemo(() => {
    const cats = { 'Admin Officials': { name: 'Admin Officials', Male: 0, Female: 0 }, 'Regular Staff': { name: 'Regular Staff', Male: 0, Female: 0 } };
    data.forEach(d => {
      const type = d.administrative_officials === 'Yes' ? 'Admin Officials' : 'Regular Staff';
      cats[type][d.sex === 'Female' ? 'Female' : 'Male']++;
    });
    return Object.values(cats);
  }, [data]);

  // 5. Ethnicity (Top 8)
  const ethnicitySDD = useMemo(() => getSDD('ethnicity').slice(0, 8), [data]);

  // 6. Religion (Top 8)
  const religionSDD = useMemo(() => getSDD('religion').slice(0, 8), [data]);

  // 7. Special Needs / Vulnerability
  const specialSDD = useMemo(() => getSDD('special_needs', d => d.special_needs !== 'None' && d.special_needs !== 'N/A'), [data]);

  // 8. Employee Type (Teaching vs Non-Teaching)
  const typeSDD = useMemo(() => getSDD('employee_type'), [data]);

  const COLORS = { Male: '#4f46e5', Female: '#ec4899' };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 print:space-y-2" ref={reportRef}>
      
      {/* Header & Print Button (Hidden on Print) */}
      <div className="flex justify-between items-center print:hidden bg-indigo-900 p-6 rounded-[32px] text-white">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">Employment GAD Report</h2>
          <p className="text-indigo-200 text-xs font-medium tracking-widest">MSU-IIT SEX-DISAGGREGATED DATA SYSTEM</p>
        </div>
        <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all group">
          <Printer className="group-hover:scale-110 transition-transform text-white" size={24} />
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        <StatCard label="Total Personnel" value={data.length} color="indigo" />
        <StatCard label="Female Ratio" value={`${((data.filter(d => d.sex === 'Female').length / data.length) * 100).toFixed(1)}%`} color="pink" />
        <StatCard label="Plantilla" value={data.filter(d => d.plantilla_position && d.plantilla_position !== 'N/A').length} color="emerald" />
        <StatCard label="IP/Vulnerable" value={data.filter(d => d.special_needs !== 'None' || d.ethnicity !== 'Cebuano').length} color="orange" />
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
        
        <VisualCard title="1. Employment Status" desc="Comparison of permanent (Plantilla) vs contractual roles by sex.">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={plantillaSDD}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
              <YAxis fontSize={10} axisLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Legend iconType="circle" />
              <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="2. Income Category (SDD)" desc="Income distribution across the 5 PSA categories.">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeSDD} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={9} width={100} axisLine={false} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={20} />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="3. Teaching Faculty per College" desc="Gender split across academic units (Teaching only).">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={collegeSDD}>
              <XAxis dataKey="name" fontSize={8} angle={-20} textAnchor="end" interval={0} height={60} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="4. Administrative Officials" desc="Decision-making positions (Leadership) disaggregated by sex.">
          <ResponsiveContainer width="100%" height={250}>
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
        </VisualCard>

        <VisualCard title="5. Cultural Profile (Ethnicity)" desc="Distribution of ethnic groups within the workforce.">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ethnicitySDD} layout="vertical">
              <YAxis dataKey="name" type="category" fontSize={9} width={80} />
              <XAxis type="number" hide />
              <Tooltip />
              <Bar dataKey="Male" fill={COLORS.Male} radius={[0, 4, 4, 0]} />
              <Bar dataKey="Female" fill={COLORS.Female} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="6. Religion & Faith Profile" desc="Religious affiliation mapped against sex.">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={religionSDD}>
              <XAxis dataKey="name" fontSize={9} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="7. Vulnerability/Special Needs" desc="Support tracking for PWD, Solo Parents, and IPs.">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={specialSDD}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" fontSize={9} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="Female" fill={COLORS.Female} barSize={30} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Male" fill={COLORS.Male} barSize={30} radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </VisualCard>

        <VisualCard title="8. Employee Category Split" desc="Balance between Teaching and Non-Teaching personnel.">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeSDD}>
              <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
              <Tooltip />
              <Bar dataKey="Male" fill={COLORS.Male} stackId="a" barSize={50} />
              <Bar dataKey="Female" fill={COLORS.Female} stackId="a" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </VisualCard>

      </div>

      {/* Print-Only Signature Section */}
      <div className="hidden print:flex justify-between mt-20 pt-10 border-t border-slate-300">
        <div className="text-center">
          <div className="w-64 border-b border-black mb-2"></div>
          <p className="text-[10px] font-bold uppercase">Prepared by: GAD Focal Person</p>
        </div>
        <div className="text-center">
          <div className="w-64 border-b border-black mb-2"></div>
          <p className="text-[10px] font-bold uppercase">Approved by: MSU-IIT Chancellor</p>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, value, color }) {
  const colorMap = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    pink: "bg-pink-50 border-pink-100 text-pink-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700"
  };
  return (
    <div className={`p-5 rounded-[24px] border shadow-sm ${colorMap[color]} print:shadow-none print:bg-white print:border-slate-200`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function VisualCard({ title, desc, children }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full break-inside-avoid print:shadow-none print:border-slate-200 print:rounded-none print:p-4">
      <div className="flex items-start gap-3 mb-2">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{title}</h3>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic mb-6">
        {desc}
      </p>
      <div className="flex-1 min-h-[250px]">{children}</div>
    </div>
  );
}