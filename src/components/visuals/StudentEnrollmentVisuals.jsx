import React, { useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area
} from 'recharts';
import { Printer, Users, Heart, ShieldCheck, Landmark, BookOpen, Globe, School, Wallet } from 'lucide-react';

const COLORS = {
  Male: '#3b82f6', // Blue
  Female: '#ec4899', // Pink
  palette: ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981']
};

export default function StudentEnrollmentVisuals({ data }) {
  const printRef = useRef();

  // --- DATA PROCESSING HELPER ---
  const processSDD = (key, topN = null) => {
    const counts = data.reduce((acc, curr) => {
      const val = curr[key] || 'Not Specified';
      if (!acc[val]) acc[val] = { name: val, Male: 0, Female: 0, total: 0 };
      acc[val][curr.sex === 'Female' ? 'Female' : 'Male']++;
      acc[val].total++;
      return acc;
    }, {});
    let result = Object.values(counts).sort((a, b) => b.total - a.total);
    return topN ? result.slice(0, topN) : result;
  };

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. College SDD
    const college = processSDD('college');
    
    // 2. Year Level SDD
    const yearLevel = processSDD('year_level').sort((a, b) => a.name.localeCompare(b.name));

    // 3. Income PSA SDD
    const incomeOrder = ["low income", "lower-middle", "middle", "upper-middle", "high income"];
    const incomeRaw = processSDD('income_PSA_category');
    const income = incomeOrder.map(label => incomeRaw.find(r => r.name === label) || { name: label, Male: 0, Female: 0 });

    // 4. Vulnerability Comparison (Binary Fields)
    const vulnerabilities = [
      { id: '_pwd?', label: 'PWD' },
      { id: '_solo_parent?', label: 'Solo Parent' },
      { id: '_ip_member?', label: 'IP Member' },
      { id: '_working_student?', label: 'Working' },
      { id: '_4ps_beneficiary?', label: '4Ps' },
      { id: '_ofw_dependent?', label: 'OFW Dep' }
    ].map(v => {
      const filtered = data.filter(d => d[v.id] === 'Yes');
      return {
        name: v.label,
        Female: filtered.filter(d => d.sex === 'Female').length,
        Male: filtered.filter(d => d.sex === 'Male').length
      };
    });

    // 5. Program SDD (Top 10)
    const programs = processSDD('program', 10);

    // 6. Ethnicity (Top 5)
    const ethnicity = processSDD('ethnicity', 5);

    // 7. Religion (Top 5)
    const religion = processSDD('religion', 5);

    // 8. Origin (Top 5)
    const origin = processSDD('place_of_origin', 5);

    // 9. First Generation Students
    const firstGen = processSDD('_first_generation?');

    return { college, yearLevel, income, vulnerabilities, programs, ethnicity, religion, origin, firstGen };
  }, [data]);

  const handlePrint = () => window.print();

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Print Control & Header (Hidden on print) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Student GAD Visuals</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sex-Disaggregated Data Report</p>
        </div>
        <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-all shadow-lg active:scale-95">
          <Printer size={16} /> Print Official Report
        </button>
      </div>

      {/* PRINTABLE CONTAINER */}
      <div ref={printRef} className="space-y-8 print:p-0 print:m-0 print:w-full">
        
        {/* Title for Print Only */}
        <div className="hidden print:block text-center space-y-2 mb-10 pt-10">
          <h1 className="text-3xl font-black uppercase tracking-tighter">MSU-IIT Student Enrollment GAD Report</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Sex-Disaggregated Data Summary</p>
          <div className="w-24 h-1 bg-indigo-600 mx-auto mt-4"></div>
        </div>

        {/* 1. College Distribution */}
        <GraphCard title="1. Enrollment by College (SDD)" desc="Total student population distribution across colleges disaggregated by sex.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.college} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={140} fontSize={10} fontWeight={800} axisLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={18} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </GraphCard>

        {/* 2. Year Level & 3. Income (2 Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
          <GraphCard title="2. Year Level Distribution" desc="Progress of male vs female students per academic year.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.yearLevel}>
                <XAxis dataKey="name" fontSize={11} fontWeight="bold" />
                <Tooltip />
                <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="3. Income PSA Category" desc="Economic clustering using the PSA classification.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.income} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={9} width={80} />
                <Tooltip />
                <Bar dataKey="Male" stackId="a" fill={COLORS.Male} />
                <Bar dataKey="Female" stackId="a" fill={COLORS.Female} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>
        </div>

        {/* 4. Vulnerability Profiles */}
        <GraphCard title="4. Vulnerability & Support Tracking" desc="Comparison of sex representation across specific support groups (PWD, 4Ps, Solo Parent).">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.vulnerabilities}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={10} fontWeight="black" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Male" fill={COLORS.Male} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Female" fill={COLORS.Female} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GraphCard>

        {/* 5. Top 10 Programs */}
        <GraphCard title="5. Top 10 Degree Programs" desc="Most populated academic programs disaggregated by gender.">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.programs} layout="vertical">
              <YAxis dataKey="name" type="category" width={150} fontSize={8} />
              <XAxis type="number" hide />
              <Tooltip />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} barSize={12} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </GraphCard>

        {/* 6. Ethnicity & 7. Religion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
          <GraphCard title="6. Cultural Profile (Ethnicity)" desc="Top 5 ethnic groups represented in the student body.">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.ethnicity} dataKey="total" nameKey="name" innerRadius={60} outerRadius={80}>
                  {stats.ethnicity.map((_, i) => <Cell key={i} fill={COLORS.palette[i % COLORS.palette.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="7. Religious Affiliation" desc="Top 5 religious groups recorded in the data.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.religion}>
                <XAxis dataKey="name" fontSize={9} />
                <Tooltip />
                <Bar dataKey="Female" fill={COLORS.Female} stackId="a" />
                <Bar dataKey="Male" fill={COLORS.Male} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>
        </div>

        {/* 8. First Gen & 9. Origin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
          <GraphCard title="8. First Generation Students" desc="Students who are the first in their families to attend college.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.firstGen}>
                <XAxis dataKey="name" fontSize={11} />
                <Tooltip />
                <Bar dataKey="Male" fill={COLORS.Male} stackId="a" />
                <Bar dataKey="Female" fill={COLORS.Female} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>

          <GraphCard title="9. Regional Origin" desc="Top provinces/cities where students are currently originating.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.origin} layout="vertical">
                <YAxis dataKey="name" type="category" fontSize={9} width={80} />
                <XAxis type="number" hide />
                <Tooltip />
                <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </GraphCard>
        </div>

        {/* Print-Only Footer */}
        <div className="hidden print:flex justify-between mt-20 pt-10 border-t border-slate-300 px-10">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-1 mx-auto"></div>
            <p className="text-[10px] font-bold uppercase">Certified Accurate: GAD Officer</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-1 mx-auto"></div>
            <p className="text-[10px] font-bold uppercase">Noted by: Registrar's Office</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          /* Custom styles for centered printing */
          .print-card {
            break-inside: avoid;
            margin-bottom: 20px;
            width: 90% !important;
            border: 1px solid #e2e8f0 !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENT ---
function GraphCard({ title, desc, children }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full print-card">
      <div className="mb-4">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{title}</h3>
        <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic mt-1">
          {desc}
        </p>
      </div>
      <div className="flex-1 min-h-[250px]">{children}</div>
    </div>
  );
}