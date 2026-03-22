import React from 'react';
import { Download, Search, Users } from 'lucide-react';

export const AttendanceTable = ({ data = [], title = "Records", onExport }) => {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            {title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Total Entries: {data.length}
          </p>
        </div>
        
        <button 
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* The Actual Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {['Name', 'Sex', 'Office/College', 'Gate', 'Time'].map((head) => (
                <th key={head} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length > 0 ? data.map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                {/* 1. NAME */}
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {row.fullName}
                  </span>
                </td>

                {/* 2. SEX */}
                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                  {row.sex}
                </td>

                {/* 3. OFFICE/COLLEGE */}
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                    {row.office_college || 'N/A'}
                  </span>
                </td>

                {/* 4. GATE (SESSION) */}
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">
                    {row.session_name || 'General'}
                  </span>
                </td>

                {/* 5. TIME (TIMESTAMP) */}
                <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                  {(() => {
                    if (row.timestamp?.seconds) {
                      return new Date(row.timestamp.seconds * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    if (row.timestamp) {
                      return new Date(row.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    return 'Pending...';
                  })()}
                </td>
              </tr>
            )) : (
              <tr>
                {/* Updated colSpan to 5 to match the 5 headers */}
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-medium italic">
                  No records found for this session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;