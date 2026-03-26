import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, SlidersHorizontal, Users, AlertTriangle } from 'lucide-react';

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
  } catch {
    return null;
  }
};

const formatTimestamp = (row, showDate) => {
  const ts = row?.createdAt ?? row?.timestamp ?? row?.created_at ?? row?.time ?? null;
  if (!ts) return 'Pending...';

  const d =
    ts.seconds
      ? new Date(ts.seconds * 1000)
      : ts.toDate
        ? ts.toDate()
        : new Date(ts);

  if (Number.isNaN(d.getTime())) return 'Pending...';

  return d.toLocaleString([], showDate
    ? { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' }
  );
};

export const AttendanceTable = ({ data = [], title = "Records", onExport }) => {
  const [sortKey, setSortKey] = useState('time'); // name | sex | office | gate | time
  const [sortDir, setSortDir] = useState('desc'); // asc | desc
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [showDate, setShowDate] = useState(false);

  const [filters, setFilters] = useState({ sex: 'All', office: '' });
  const [visible, setVisible] = useState({
    name: true,
    sex: true,
    office: true,
    gate: true,
    time: true
  });

  const visibleColumnsCount = Object.values(visible).filter(Boolean).length;

  const sexOptions = useMemo(() => {
    const set = new Set();
    data.forEach((row) => {
      const s = normalize(row.sex || row.gender);
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    const officeNeedle = normalize(filters.office).toLowerCase();
    const sexNeedle = normalize(filters.sex);

    return data.filter((row) => {
      if (sexNeedle !== 'All') {
        const rowSex = normalize(row.sex || row.gender);
        if (rowSex !== sexNeedle) return false;
      }

      if (officeNeedle) {
        const office = normalize(row.office_college);
        if (!office.toLowerCase().includes(officeNeedle)) return false;
      }

      return true;
    });
  }, [data, filters]);

  const duplicates = useMemo(() => {
    const idCounts = {};
    const emailCounts = {};

    filtered.forEach((row) => {
      const idNumber = normalize(row.id_number);
      if (idNumber) idCounts[idNumber] = (idCounts[idNumber] || 0) + 1;

      const email = normalize(row.email);
      if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    return { id: idCounts, email: emailCounts };
  }, [filtered]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;

    const getSortVal = (row) => {
      if (sortKey === 'time') {
        const ms = getTimeMs(row);
        // Ensure missing timestamps ("Pending...") are always last.
        return ms === null ? (sortDir === 'asc' ? Infinity : -Infinity) : ms;
      }
      if (sortKey === 'name') return normalize(row.fullName).toLowerCase();
      if (sortKey === 'sex') return normalize(row.sex || row.gender).toLowerCase();
      if (sortKey === 'office') return normalize(row.office_college).toLowerCase();
      if (sortKey === 'gate') return normalize(row.session_name || row.session).toLowerCase();
      return '';
    };

    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getSortVal(a);
      const bv = getSortVal(b);

      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });

    return copy;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize, data.length]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'desc' : 'asc');
    }
  };

  const headerCell = (label, key) => {
    const isActive = sortKey === key;

    return (
      <th
        key={label}
        className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] select-none cursor-pointer"
        onClick={() => toggleSort(key)}
        title="Sort"
      >
        <span className="inline-flex items-center gap-2">
          {label}
          {isActive && <ArrowUpDown size={12} className="text-indigo-500" />}
        </span>
      </th>
    );
  };

  const transformRowForExport = (row) => {
    const fullName = normalize(row.fullName);
    const sex = normalize(row.sex || row.gender) || 'N/A';
    const office = normalize(row.office_college) || 'N/A';
    const gate = normalize(row.session_name || row.session) || 'General';
    const time = formatTimestamp(row, showDate);

    const out = {};
    if (visible.name) out['Name'] = fullName;
    if (visible.sex) out['Sex'] = sex;
    if (visible.office) out['Office/College'] = office;
    if (visible.gate) out['Gate'] = gate;
    if (visible.time) out['Time'] = time;
    return out;
  };

  const handleExport = () => {
    const exportRows = sorted.map(transformRowForExport);
    onExport?.(exportRows);
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            {title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Total Entries: {data.length} • Showing: {sorted.length}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch lg:items-center">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
              value={filters.sex}
              onChange={(e) => setFilters((p) => ({ ...p, sex: e.target.value }))}
              aria-label="Filter by sex"
            >
              <option value="All">All Sex</option>
              {sexOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search Office/College..."
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
              value={filters.office}
              onChange={(e) => setFilters((p) => ({ ...p, office: e.target.value }))}
              aria-label="Filter by office"
            />
          </div>

          <div className="flex items-center gap-2 justify-between">
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <input
                type="checkbox"
                checked={showDate}
                onChange={(e) => setShowDate(e.target.checked)}
              />
              Show Date
            </label>

            {/* Column visibility */}
            <details className="relative">
              <summary className="list-none cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                <SlidersHorizontal size={14} />
                Columns
              </summary>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-20">
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'sex', label: 'Sex' },
                  { key: 'office', label: 'Office/College' },
                  { key: 'gate', label: 'Gate' },
                  { key: 'time', label: 'Time' },
                ].map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center justify-between gap-3 py-1.5 text-[10px] font-black text-slate-600 uppercase tracking-widest"
                  >
                    <span className="text-slate-600">{c.label}</span>
                    <input
                      type="checkbox"
                      checked={visible[c.key]}
                      onChange={(e) => setVisible((p) => ({ ...p, [c.key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            </details>

            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* The Actual Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {visible.name && headerCell('Name', 'name')}
              {visible.sex && headerCell('Sex', 'sex')}
              {visible.office && headerCell('Office/College', 'office')}
              {visible.gate && headerCell('Gate', 'gate')}
              {visible.time && headerCell('Time', 'time')}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {pageRows.length > 0 ? pageRows.map((row) => {
              const idNumber = normalize(row.id_number);
              const email = normalize(row.email);
              const idDup = idNumber && (duplicates.id[idNumber] || 0) > 1;
              const emailDup = email && (duplicates.email[email] || 0) > 1;

              return (
                <tr
                  key={row.id || row.fullName || JSON.stringify(row).slice(0, 24)}
                  className="hover:bg-indigo-50/30 transition-colors group"
                >
                  {visible.name && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {row.fullName}
                        </span>
                        {(idDup || emailDup) && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 border border-amber-200 text-amber-600"
                            title="Duplicate detected in this view (by ID number or email)"
                          >
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {visible.sex && (
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {normalize(row.sex || row.gender) || 'N/A'}
                    </td>
                  )}

                  {visible.office && (
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {normalize(row.office_college) || 'N/A'}
                      </span>
                    </td>
                  )}

                  {visible.gate && (
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">
                        {normalize(row.session_name || row.session) || 'General'}
                      </span>
                    </td>
                  )}

                  {visible.time && (
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {formatTimestamp(row, showDate)}
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td
                  colSpan={Math.max(1, visibleColumnsCount)}
                  className="px-6 py-20 text-center text-slate-400 font-medium italic"
                >
                  No records found for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Page {safePage} of {pageCount} • Showing{' '}
          {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
          {Math.min(sorted.length, safePage * pageSize)} of {sorted.length}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <select
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            aria-label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          <button
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;