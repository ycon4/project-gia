import { useState, useEffect, useMemo } from 'react';
import {
  Search, Trash2, LayoutDashboard, Table2, AlertCircle,
  RefreshCcw, Database, FolderOpen, Users, Briefcase, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

import { getAllDocuments, deleteAYData } from '../../firebase/services.js';
import ExcelUploadEnrollment from '../components/excel_upload/ExcelUploadEnrollment.jsx';
import ExcelUploadEngagement from '../components/excel_upload/ExcelUploadEngagement.jsx';
import ExcelUploadEmployee from '../components/excel_upload/ExcelUploadEmployment.jsx';
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals.jsx';
import EmployeeVisuals from '../components/visuals/EmployeeVisuals.jsx';
import StudentEngagementVisuals from '../components/visuals/EngagementVisuals.jsx';

const SECTORS = {
  student_enrollment: {
    label: 'Student Enrollment',
    icon: <Users size={14} />,
    headers: ['student_id', 'sex', 'income_PSA_category', 'ethnicity', 'college', 'program', 'year_level'],
  },
  employee_information: {
    label: 'Employee Info',
    icon: <Briefcase size={14} />,
    headers: ['employee_id', 'sex', 'employee_type', 'administrative_officials', 'plantilla_position', 'income_order', 'ethnicity', 'religion', 'place_of_birth', 'special_needs'],
  },
  student_engagement: {
    label: 'Student Engagement',
    icon: <Zap size={14} />,
    headers: ['student_id', 'sex', 'scholarship_status', 'academic_standing', 'student_council', 'organizations', 'publication'],
  },
};

const ROWS_OPTIONS = [10, 25, 50];

// Active accent color: #7cacf8
const A = {
  bg:         'bg-[#7cacf8]',
  bgDark:     'dark:bg-[#7cacf8]',
  text:       'text-[#7cacf8]',
  border:     'border-[#7cacf8]',
  hoverBg:    'hover:bg-[#7cacf8]/10',
  hoverText:  'hover:text-[#7cacf8]',
  hoverBorder:'hover:border-[#7cacf8]/60',
};

export default function DashboardPage() {
  const [allSectorData, setAllSectorData] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('student_enrollment');
  const [activeAY, setActiveAY]           = useState(null);
  const [viewMode, setViewMode]           = useState('table');
  const [searchTerm, setSearchTerm]       = useState('');
  const [isDeleting, setIsDeleting]       = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);

  useEffect(() => { loadTabData(); }, [activeTab]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeAY, activeTab, rowsPerPage]);

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
    if (!window.confirm(`Permanently delete ALL ${currentInboxData.length} records for AY ${activeAY} in ${SECTORS[activeTab].label}? This cannot be undone.`)) return;
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
    ? <ExcelUploadEngagement activeTab={activeTab} onUploadSuccess={loadTabData} />
    : activeTab === 'employee_information'
      ? <ExcelUploadEmployee activeTab={activeTab} onUploadSuccess={loadTabData} />
      : <ExcelUploadEnrollment activeTab={activeTab} onUploadSuccess={loadTabData} />;

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    /* Panel fills from top of padding to bottom of viewport */
    <div
      className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden font-sans"
      style={{ minHeight: 'calc(100dvh - 4rem)' }}
    >
      {/* ── HEADER BAR ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <Database size={15} className="text-[#7cacf8]" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">GADC Data Hub</h1>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 uppercase tracking-wider font-medium">Sector Management</p>
          </div>
        </div>
        <div>{UploadButton}</div>
      </div>

      {/* ── SECTOR TABS ── */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shrink-0">
        {Object.entries(SECTORS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setActiveAY(null); setViewMode('table'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === key
                ? 'border-[#7cacf8] text-[#7cacf8] bg-[#7cacf8]/5'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── AY SELECTOR BAR ── */}
      {availableYears.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
              <FolderOpen size={12} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Inboxes:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {availableYears.map(ay => (
                <button
                  key={ay}
                  onClick={() => setActiveAY(ay)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeAY === ay
                      ? 'bg-[#7cacf8] text-white'
                      : 'border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-[#7cacf8]/60 hover:text-[#7cacf8] bg-white dark:bg-neutral-900'
                  }`}
                >
                  AY {ay}
                </button>
              ))}
            </div>
          </div>
          {activeAY && (
            <button
              onClick={handleDeleteAY}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded border border-transparent hover:border-red-200 dark:hover:border-red-900 disabled:opacity-40 transition-colors"
            >
              {isDeleting ? <RefreshCcw className="animate-spin" size={11} /> : <Trash2 size={11} />}
              Clear AY {activeAY}
            </button>
          )}
        </div>
      )}

      {/* ── VIEW TOGGLE + META ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              viewMode === 'table'
                ? 'bg-[#7cacf8] text-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-[#7cacf8]/10 hover:text-[#7cacf8]'
            }`}
          >
            <Table2 size={13} /> Data Sheet
          </button>
          <button
            onClick={() => setViewMode('visuals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              viewMode === 'visuals'
                ? 'bg-[#7cacf8] text-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-[#7cacf8]/10 hover:text-[#7cacf8]'
            }`}
          >
            <LayoutDashboard size={13} /> Visuals
          </button>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
          <span>AY: <span className="text-[#7cacf8] font-semibold">{activeAY ?? '—'}</span></span>
          <span className="text-neutral-200 dark:text-neutral-700">|</span>
          <span>Records: <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{currentInboxData.length}</span></span>
        </div>
      </div>

      {/* ── CONTENT ── fills remaining height ── */}
      <div className="flex-1 flex flex-col min-h-0">
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
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'student_enrollment' ? (
              <StudentEnrollmentVisuals data={currentInboxData} />
            ) : activeTab === 'employee_information' ? (
              <EmployeeVisuals data={currentInboxData} />
            ) : activeTab === 'student_engagement' ? (
              <StudentEngagementVisuals data={currentInboxData} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
                <AlertCircle size={32} />
                <p className="text-xs font-medium uppercase tracking-widest">No visuals available for this sector.</p>
              </div>
            )}
          </div>
        )}
      </div>
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

      {/* Table — scrollable */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-neutral-50 dark:bg-neutral-800">
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-r border-neutral-200 dark:border-neutral-700 w-10 text-center">
                #
              </th>
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
                className={`transition-colors ${
                  idx % 2 === 0
                    ? 'bg-white dark:bg-neutral-900'
                    : 'bg-neutral-50/50 dark:bg-neutral-800/25'
                } hover:bg-[#7cacf8]/5 dark:hover:bg-[#7cacf8]/10`}
              >
                <td className="px-4 py-2 text-center text-xs font-medium text-neutral-300 dark:text-neutral-600 border-b border-r border-neutral-100 dark:border-neutral-800">
                  {showingFrom + idx}
                </td>
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
              className="text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 text-neutral-700 dark:text-neutral-300 outline-none focus:border-[#7cacf8] cursor-pointer"
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
          <NavBtn onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={13} /> Prev
          </NavBtn>

          {pageNums.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1.5 text-xs text-neutral-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  currentPage === p
                    ? 'bg-[#7cacf8] text-white'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-[#7cacf8]/10 hover:text-[#7cacf8]'
                }`}
              >
                {p}
              </button>
            )
          )}

          <NavBtn onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
            Next <ChevronRight size={13} />
          </NavBtn>
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
      className="flex items-center gap-0.5 px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:border-[#7cacf8]/60 hover:text-[#7cacf8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
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
