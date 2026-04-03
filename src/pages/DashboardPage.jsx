import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, AlertCircle,
  RefreshCcw, Trash2, Printer, FileUp, MoreVertical,
  Database, Users, Briefcase, Zap,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';

import { getAllDocuments, deleteAYData } from '../../firebase/services.js';
import ExcelUploadEnrollment from '../components/excel_upload/ExcelUploadEnrollment.jsx';
import ExcelUploadEngagement from '../components/excel_upload/ExcelUploadEngagement.jsx';
import ExcelUploadEmployee from '../components/excel_upload/ExcelUploadEmployment.jsx';
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals.jsx';
import EmployeeVisuals from '../components/visuals/EmployeeVisuals.jsx';
import StudentEngagementVisuals from '../components/visuals/EngagementVisuals.jsx';

const LILAC = '#a673d8';

const SECTORS = {
  student_enrollment: {
    label: 'Student Enrollment',
    icon: <Users size={16} />,
    headers: ['student_id', 'sex', 'income_PSA_category', 'ethnicity', 'college', 'program', 'year_level'],
  },
  employee_information: {
    label: 'Employee Info',
    icon: <Briefcase size={16} />,
    headers: ['employee_id', 'sex', 'employee_type', 'administrative_officials', 'plantilla_position', 'income_order', 'ethnicity', 'religion', 'place_of_birth', 'special_needs'],
  },
  student_engagement: {
    label: 'Student Engagement',
    icon: <Zap size={16} />,
    headers: ['student_id', 'sex', 'scholarship_status', 'academic_standing', 'student_council', 'organizations', 'publication'],
  },
};

const ROWS_OPTIONS = [10, 25, 50];

export default function DashboardPage() {
  const [allSectorData, setAllSectorData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('student_enrollment');
  const [activeAY, setActiveAY]           = useState(null);
  const [viewMode, setViewMode]           = useState('visuals');
  const [searchTerm, setSearchTerm]       = useState('');
  const [isDeleting, setIsDeleting]       = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [datasetOpen, setDatasetOpen]     = useState(false);
  const [ayOpen, setAyOpen]               = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const datasetRef                        = useRef(null);
  const ayRef                             = useRef(null);

  useEffect(() => { loadTabData(); }, [activeTab]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeAY, activeTab, rowsPerPage]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (datasetRef.current && !datasetRef.current.contains(e.target)) setDatasetOpen(false);
      if (ayRef.current && !ayRef.current.contains(e.target)) setAyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadTabData = async () => {
    try {
      setLoading(true);
      const result = await getAllDocuments(activeTab);
      setAllSectorData(result);
      const years = [...new Set(result.map(i => i.academicYear))].sort().reverse();
      setActiveAY(years[0] ?? null);
    } catch (err) {
      console.error(err);
      setAllSectorData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAY = async () => {
    if (!activeAY) return;
    try {
      setIsDeleting(true);
      await deleteAYData(activeTab, activeAY);
      await loadTabData();
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const availableYears = useMemo(() =>
    [...new Set(allSectorData.map(i => i.academicYear))].filter(Boolean).sort().reverse(),
  [allSectorData]);

  const currentInboxData = useMemo(() =>
    allSectorData.filter(i => i.academicYear === activeAY),
  [allSectorData, activeAY]);

  const filteredData = useMemo(() =>
    currentInboxData.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [currentInboxData, searchTerm]);

  const totalPages    = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const s = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(s, s + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const showingFrom = filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingTo   = Math.min(currentPage * rowsPerPage, filteredData.length);
  const sector      = SECTORS[activeTab];

  const UploadButton = activeTab === 'student_engagement'
    ? <ExcelUploadEngagement activeTab={activeTab} onUploadSuccess={loadTabData} compact />
    : activeTab === 'employee_information'
      ? <ExcelUploadEmployee activeTab={activeTab} onUploadSuccess={loadTabData} compact />
      : <ExcelUploadEnrollment activeTab={activeTab} onUploadSuccess={loadTabData} compact />;

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex flex-col font-sans" style={{ height: 'calc(100dvh - 4rem)' }}>

      {/* ── TITLE ROW: Large dataset name + AY selector + actions ── */}
      <div className="flex items-center justify-between pb-3">

        {/* Left: Large title + AY pill */}
        <div className="flex items-center gap-3">

          {/* Dataset dropdown — Firebase "Database" style title */}
          <div className="relative" ref={datasetRef}>
            <button
              onClick={() => setDatasetOpen(o => !o)}
              className="flex items-center gap-2 group"
            >
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
                {sector.label}
              </h1>
              <ChevronDown
                size={18}
                className={`text-neutral-400 transition-transform duration-200 mt-0.5 ${datasetOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {datasetOpen && (
              <div className="absolute top-full left-0 mt-2 z-30 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[210px]">
                {Object.entries(SECTORS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setViewMode('visuals'); setActiveAY(null); setSearchTerm(''); setDatasetOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                    style={activeTab === key
                      ? { color: LILAC, backgroundColor: `${LILAC}12`, fontWeight: 600 }
                      : { color: '#6b7280' }
                    }
                    onMouseEnter={e => { if (activeTab !== key) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (activeTab !== key) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <span style={activeTab === key ? { color: LILAC } : { color: '#9ca3af' }}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AY selector — Firebase "(default) ▼" gray pill style */}
          {availableYears.length > 0 && (
            <div className="relative" ref={ayRef}>
              <button
                onClick={() => setAyOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 text-sm font-medium bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {activeAY ?? '—'}
                <ChevronDown size={13} className={`transition-transform duration-200 ${ayOpen ? 'rotate-180' : ''}`} />
              </button>

              {ayOpen && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[130px]">
                  {availableYears.map(ay => (
                    <button
                      key={ay}
                      onClick={() => { setActiveAY(ay); setAyOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                      style={activeAY === ay
                        ? { color: LILAC, backgroundColor: `${LILAC}12`, fontWeight: 600 }
                        : { color: '#6b7280' }
                      }
                      onMouseEnter={e => { if (activeAY !== ay) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (activeAY !== ay) e.currentTarget.style.backgroundColor = ''; }}
                    >
                      {ay}
                      {activeAY === ay && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── VIEW TABS ── */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex">
          {[
            { id: 'visuals',  label: 'Visuals' },
            { id: 'table',    label: 'Data Sheet' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className="px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={viewMode === tab.id
                ? { borderColor: LILAC, color: LILAC }
                : { borderColor: 'transparent', color: '#9ca3af' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACTION BUTTONS (below the line) ── */}
      <div className="flex items-center justify-end gap-2 py-2.5">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
        >
          <Printer size={13} /> Print
        </button>
        {UploadButton}
        {activeAY && (
          <button
            onClick={() => setClearModalOpen(true)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
          >
            <MoreVertical size={15} />
          </button>
        )}
      </div>

      {/* ── CONTENT BOX ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        {loading ? (
          <LoadingState label={sector.label} />
        ) : !activeAY ? (
          <EmptyState label={sector.label} />
        ) : viewMode === 'table' ? (
          <TableView
            sector={sector}
            paginatedData={paginatedData}
            filteredData={filteredData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeAY={activeAY}
            showingFrom={showingFrom}
            showingTo={showingTo}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            pageNums={pageNums}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'student_enrollment' ? (
              <StudentEnrollmentVisuals data={currentInboxData} recordsCount={currentInboxData.length} />
            ) : activeTab === 'employee_information' ? (
              <EmployeeVisuals data={currentInboxData} recordsCount={currentInboxData.length} />
            ) : activeTab === 'student_engagement' ? (
              <StudentEngagementVisuals data={currentInboxData} recordsCount={currentInboxData.length} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
                <AlertCircle size={32} />
                <p className="text-xs font-medium uppercase tracking-widest">No visuals available for this sector.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CLEAR AY MODAL ── */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setClearModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Clear AY {activeAY}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This will permanently delete all {currentInboxData.length.toLocaleString()} records for Academic Year {activeAY}. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setClearModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setClearModalOpen(false); handleDeleteAY(); }}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? <RefreshCcw className="animate-spin" size={11} /> : <Trash2 size={11} />}
                Clear AY {activeAY}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Table View ── */
function TableView({
  sector, paginatedData, filteredData, searchTerm, setSearchTerm,
  activeAY, showingFrom, showingTo,
  currentPage, setCurrentPage, totalPages,
  rowsPerPage, setRowsPerPage, pageNums,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shrink-0">
        <Search size={13} className="text-neutral-400 shrink-0" />
        <input
          type="text"
          placeholder={`Search within AY ${activeAY}…`}
          className="flex-1 text-sm font-medium bg-transparent outline-none text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <span className="text-[11px] font-medium text-neutral-400 shrink-0">
            {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-neutral-50 dark:bg-neutral-800">
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-r border-neutral-200 dark:border-neutral-700 w-10 text-center">#</th>
              {sector.headers.map(h => (
                <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap last:border-r-0">
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className={`transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/25'}`}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = `${LILAC}0d`}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <td className="px-4 py-2 text-center text-xs font-medium text-neutral-300 dark:text-neutral-600 border-b border-r border-neutral-100 dark:border-neutral-800">{showingFrom + idx}</td>
                {sector.headers.map(h => (
                  <td key={h} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border-b border-r border-neutral-100 dark:border-neutral-800 whitespace-nowrap last:border-r-0">
                    {row[h] ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={sector.headers.length + 1} className="px-4 py-16 text-center text-sm font-medium text-neutral-400 dark:text-neutral-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={e => setRowsPerPage(Number(e.target.value))}
              className="text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 text-neutral-700 dark:text-neutral-300 outline-none cursor-pointer"
            >
              {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Showing{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{showingFrom}–{showingTo}</span>
            {' '}of{' '}
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{filteredData.length}</span>
            {' '}entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          <NavBtn onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={13} /> Prev</NavBtn>

          {pageNums.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1.5 text-xs text-neutral-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                style={currentPage === p ? { backgroundColor: LILAC, color: '#fff' } : { color: '#9ca3af' }}
                onMouseEnter={e => { if (currentPage !== p) { e.currentTarget.style.backgroundColor = `${LILAC}1a`; e.currentTarget.style.color = LILAC; } }}
                onMouseLeave={e => { if (currentPage !== p) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9ca3af'; } }}
              >{p}</button>
            )
          )}

          <NavBtn onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next <ChevronRight size={13} /></NavBtn>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-0.5 px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = `${LILAC}99`; e.currentTarget.style.color = LILAC; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
    >{children}</button>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-neutral-400 dark:text-neutral-600">
      <RefreshCcw className="animate-spin" size={22} />
      <p className="text-xs font-medium uppercase tracking-widest">Loading {label}…</p>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3">
      <Database size={28} className="text-neutral-200 dark:text-neutral-700" />
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">No data in {label}</p>
      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-600 text-center max-w-xs">
        Upload an Excel file and assign it an Academic Year to populate this table.
      </p>
    </div>
  );
}
