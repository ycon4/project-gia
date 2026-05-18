import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, Users, AlertTriangle, Printer } from 'lucide-react';
import PrintAttendanceModal from './PrintAttendanceModal';

const normalize = (v) => (v === null || v === undefined ? '' : String(v)).trim();

const getTimeMs = (row) => {
  const ts = row?.createdAt ?? row?.timestamp ?? row?.created_at ?? row?.time ?? null;
  if (!ts) return null;
  try {
    if (ts.seconds) return ts.seconds * 1000;
    if (ts.toDate) return ts.toDate().getTime();
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime();
  } catch { return null; }
};

const formatTimestamp = (row, showDate) => {
  const ts = row?.createdAt ?? row?.timestamp ?? row?.created_at ?? row?.time ?? null;
  if (!ts) return 'Pending...';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return 'Pending...';
  return d.toLocaleString([], showDate
    ? { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' }
  );
};

export const AttendanceTable = ({ data = [], title = 'Records', event, sessions }) => {
  const [sortKey, setSortKey] = useState('time');
  const [sortDir, setSortDir] = useState('desc');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [showDate, setShowDate] = useState(false);
  const [filters, setFilters] = useState({ sex: 'All', office: '' });
  const [visible, setVisible] = useState({ name: true, sex: true, office: true, gate: true, time: true });
  const [showPrintModal, setShowPrintModal] = useState(false);

  const visibleColumnsCount = Object.values(visible).filter(Boolean).length;

  const sexOptions = useMemo(() => {
    const set = new Set();
    data.forEach(row => { const s = normalize(row.sex || row.gender); if (s) set.add(s); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    const officeNeedle = normalize(filters.office).toLowerCase();
    const sexNeedle = normalize(filters.sex);
    return data.filter(row => {
      if (sexNeedle !== 'All' && normalize(row.sex || row.gender) !== sexNeedle) return false;
      if (officeNeedle && !normalize(row.office_college).toLowerCase().includes(officeNeedle)) return false;
      return true;
    });
  }, [data, filters]);

  const duplicates = useMemo(() => {
    const idC = {}, emailC = {};
    filtered.forEach(row => {
      const id = normalize(row.id_number);
      if (id) idC[id] = (idC[id] || 0) + 1;
      const em = normalize(row.email);
      if (em) emailC[em] = (emailC[em] || 0) + 1;
    });
    return { id: idC, email: emailC };
  }, [filtered]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const val = (row) => {
      if (sortKey === 'time') { const ms = getTimeMs(row); return ms === null ? (sortDir === 'asc' ? Infinity : -Infinity) : ms; }
      if (sortKey === 'name') return normalize(row.fullName).toLowerCase();
      if (sortKey === 'sex') return normalize(row.sex || row.gender).toLowerCase();
      if (sortKey === 'office') return normalize(row.office_college).toLowerCase();
      if (sortKey === 'gate') return normalize(row.session_name || row.session).toLowerCase();
      return '';
    };
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b);
      return (typeof av === 'number' && typeof bv === 'number')
        ? (av - bv) * dir
        : String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => sorted.slice((safePage - 1) * pageSize, safePage * pageSize), [sorted, safePage, pageSize]);

  useEffect(() => { setPage(1); }, [filters, pageSize, data.length]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'time' ? 'desc' : 'asc'); }
  };

  const Th = ({ label, sortK }) => (
    <th
      className="px-6 py-4 text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest select-none cursor-pointer whitespace-nowrap"
      onClick={() => toggleSort(sortK)}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        {sortKey === sortK && <ArrowUpDown size={12} className="text-gia-500" />}
      </span>
    </th>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <Users size={16} className="text-gia-600 dark:text-gia-400" />
            {title}
          </h3>
          <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-1">
            Total: {data.length} · Showing: {sorted.length}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch lg:items-center">
          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-gia-500/30"
              value={filters.sex}
              onChange={e => setFilters(p => ({ ...p, sex: e.target.value }))}
            >
              <option value="All">All Sex</option>
              {sexOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Filter office..."
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-gia-500/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              value={filters.office}
              onChange={e => setFilters(p => ({ ...p, office: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[9px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest cursor-pointer">
              <input type="checkbox" checked={showDate} onChange={e => setShowDate(e.target.checked)} />
              Show Date
            </label>

            {/* Column visibility */}
            <details className="relative">
              <summary className="list-none cursor-pointer flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <SlidersHorizontal size={13} /> Columns
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-3 z-20">
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'sex', label: 'Sex' },
                  { key: 'office', label: 'Office/College' },
                  { key: 'gate', label: 'Gate' },
                  { key: 'time', label: 'Time' },
                ].map(c => (
                  <label key={c.key} className="flex items-center justify-between gap-3 py-1.5 text-[9px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest cursor-pointer">
                    {c.label}
                    <input type="checkbox" checked={visible[c.key]} onChange={e => setVisible(p => ({ ...p, [c.key]: e.target.checked }))} />
                  </label>
                ))}
              </div>
            </details>

            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Printer size={14} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && event && (
        <PrintAttendanceModal
          event={event}
          attendanceData={sorted}
          sessions={sessions}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 dark:bg-neutral-800/60">
              {visible.name && <Th label="Name" sortK="name" />}
              {visible.sex && <Th label="Sex" sortK="sex" />}
              {visible.office && <Th label="Office/College" sortK="office" />}
              {visible.gate && <Th label="Gate" sortK="gate" />}
              {visible.time && <Th label="Time" sortK="time" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pageRows.length > 0 ? pageRows.map(row => {
              const idDup = normalize(row.id_number) && (duplicates.id[normalize(row.id_number)] || 0) > 1;
              const emailDup = normalize(row.email) && (duplicates.email[normalize(row.email)] || 0) > 1;
              return (
                <tr key={row.id || row.fullName || JSON.stringify(row).slice(0, 24)}
                  className="hover:bg-gia-50/20 dark:hover:bg-gia-950/10 transition-colors group">
                  {visible.name && (
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-gia-600 dark:group-hover:text-gia-400 transition-colors">
                          {row.fullName}
                        </span>
                        {(idDup || emailDup) && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                            title="Duplicate detected (by ID or email)">
                            <AlertTriangle size={11} />
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {visible.sex && (
                    <td className="px-6 py-3.5 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                      {normalize(row.sex || row.gender) || 'N/A'}
                    </td>
                  )}
                  {visible.office && (
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {normalize(row.office_college) || 'N/A'}
                      </span>
                    </td>
                  )}
                  {visible.gate && (
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-bold text-gia-600 dark:text-gia-400 bg-gia-50 dark:bg-gia-950/20 px-2 py-1 rounded-md uppercase">
                        {normalize(row.session_name || row.session) || 'General'}
                      </span>
                    </td>
                  )}
                  {visible.time && (
                    <td className="px-6 py-3.5 text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                      {formatTimestamp(row, showDate)}
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={Math.max(1, visibleColumnsCount)}
                  className="px-6 py-16 text-center text-neutral-400 dark:text-neutral-500 font-medium italic text-sm">
                  No records found for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
          Page {safePage} of {pageCount} · {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(sorted.length, safePage * pageSize)} of {sorted.length}
        </p>
        <div className="flex items-center gap-2">
          <select
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-gia-500/30"
            value={pageSize}
            onChange={e => setPageSize(parseInt(e.target.value, 10))}
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button
            className="p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
            disabled={safePage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          ><ChevronLeft size={15} /></button>
          <button
            className="p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
            disabled={safePage >= pageCount}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          ><ChevronRight size={15} /></button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;
