import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, AlertCircle,
  RefreshCcw, Trash2, Printer, FileUp, MoreVertical,
  Database, Users, Briefcase, Zap,
  ChevronLeft, ChevronRight, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, Edit3, Calendar,
} from 'lucide-react';

import { getAllDocuments, deleteAYData, updateDocument } from '../../firebase/services.js';
import ExcelUploadEnrollment from '../components/excel_upload/ExcelUploadEnrollment.jsx';
import ExcelUploadEmployee from '../components/excel_upload/ExcelUploadEmployment.jsx';
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals.jsx';
import EmployeeVisuals from '../components/visuals/EmployeeVisuals.jsx';

const LILAC = '#a673d8';

// Human-readable column labels (keyed by field name)
const HEADER_LABELS = {
  studid: 'Student ID',
  studgender: 'Sex',
  stud_college: 'College',
  stud_program: 'Program',
  stud_yrlevel: 'Year Level',
  studethnic: 'Ethnicity',
  studreligion: 'Religion',
  currentadd_prov: 'Province',
  income_PSA_category: 'Income Category',
  is_first_gen_learner: '1st Gen Learner',
  '_pwd?': 'PWD',
  '_solo_parent?': 'Has Solo Parent',
  '_ip_member?': 'IP Member',
  '_working_student?': 'Working Student',
  is_indigenous: 'Indigenous',
  is_child_lgbtq: 'Child of LGBTQ+',
  is_child_pdl: 'Child of PDL',
  is_child_solo_parent: 'Child of Solo Parent',
  // New Employee Headers
  empId: 'Employee ID',
  empgender: 'Sex',
  preferred_pronouns: 'Preferred Pronouns',
  emptype: 'Employee Type',
  emp_plantilla: 'Plantilla Position',
  empsalary_grade: 'Salary Grade',
  empethnic: 'Ethnicity',
  empreligion: 'Religion',
  is_emp_senior: 'Senior/Admin Official',
  is_emp_pwd: 'PWD Status',
  deptcoll: 'Department/College',
  deptcode: 'Department Code',
  // Old Employee Headers (for backward compatibility)
  employee_id: 'Employee ID',
  sex: 'Sex',
  employee_type: 'Employee Type',
  administrative_officials: 'Admin Official',
  plantilla_position: 'Plantilla Position',
  income_order: 'Income Order',
  ethnicity: 'Ethnicity',
  religion: 'Religion',
  place_of_birth: 'Place of Birth',
  special_needs: 'Special Needs',
  student_id: 'Student ID',
  scholarship_status: 'Scholarship',
  academic_standing: 'Academic Standing',
  student_council: 'Student Council',
  organizations: 'Organizations',
  publication: 'Publication',
};

const SECTORS = {
  student_enrollment: {
    label: 'Student Enrollment',
    icon: <Users size={16} />,
    headers: [
      'studid', 'studgender', 'stud_college', 'stud_program', 'stud_yrlevel',
      'studethnic', 'studreligion', 'currentadd_prov', 'income_PSA_category',
      'is_first_gen_learner', '_pwd?', '_solo_parent?', '_ip_member?',
      '_working_student?', 'is_indigenous', 'is_child_lgbtq', 'is_child_pdl',
      'is_child_solo_parent',
    ],
  },
  employee_information: {
    label: 'Employee Info',
    icon: <Briefcase size={16} />,
    headers: ['empId', 'empgender', 'preferred_pronouns', 'emptype', 'emp_plantilla', 'empsalary_grade', 'empethnic', 'empreligion', 'is_emp_senior', 'is_emp_pwd', 'deptcoll', 'deptcode'],
  },
};

// Sort comparator — numeric-aware (handles "1st Year" → 1, etc.)
const smartCompare = (a, b) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a ?? '').localeCompare(String(b ?? ''));
};

const ROWS_OPTIONS = [20, 50, 100, 'All'];

export default function DistributionPage() {
  const [allSectorData, setAllSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student_enrollment');
  const [activeAY, setActiveAY] = useState(null);
  const [viewMode, setViewMode] = useState('visuals');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [datasetOpen, setDatasetOpen] = useState(false);
  const [ayOpen, setAyOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [modifyPeriodOpen, setModifyPeriodOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const datasetRef = useRef(null);
  const ayRef = useRef(null);

  useEffect(() => { loadTabData(); }, [activeTab]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeAY, activeTab, rowsPerPage]);
  useEffect(() => { setSortCol(null); setSortDir('asc'); }, [activeTab]);

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
      setClearModalOpen(false); // Close modal after successful deletion
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModifyPeriod = async () => {
    if (!activeAY || !newPeriod || newPeriod === activeAY) return;

    try {
      setIsModifying(true);

      // Get all records for the current period
      const recordsToUpdate = currentInboxData;

      // Update each record's academicYear field
      await Promise.all(
        recordsToUpdate.map(record =>
          updateDocument(activeTab, record.id, { academicYear: newPeriod })
        )
      );

      // Reload data and close modal
      await loadTabData();
      setModifyPeriodOpen(false);
      setNewPeriod('');
    } catch (err) {
      console.error('Modify period failed:', err);
      alert('Failed to modify period. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  // Sort periods intelligently (most recent first)
  const availableYears = useMemo(() => {
    const periods = [...new Set(allSectorData.map(i => i.academicYear))].filter(Boolean);

    // Sort by year first, then by semester
    return periods.sort((a, b) => {
      // Extract start year from "2024-2025" or "2024-2025 1st Semester"
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);

      if (yearA !== yearB) return yearB - yearA; // Most recent year first

      // Same year, sort by semester
      const semesterOrder = { '1st Semester': 1, '2nd Semester': 2, 'Summer': 3 };
      const semA = a.includes('1st Semester') ? 1 : a.includes('2nd Semester') ? 2 : a.includes('Summer') ? 3 : 0;
      const semB = b.includes('1st Semester') ? 1 : b.includes('2nd Semester') ? 2 : b.includes('Summer') ? 3 : 0;

      // If both have semesters, sort by semester order (1st, 2nd, Summer)
      if (semA && semB) return semA - semB;

      // If one has semester and other doesn't, prioritize the one with semester
      if (semA && !semB) return -1;
      if (!semA && semB) return 1;

      return 0;
    });
  }, [allSectorData]);

  const currentInboxData = useMemo(() => {
    const filtered = allSectorData.filter(i => i.academicYear === activeAY);
    if (activeTab !== 'student_enrollment') return filtered;
    const nb = v => (v === 'Yes' || v === true || v === 'yes' || v === 'true' || v === '1' || v === 1) ? 'Yes' : 'No';
    // Normalize old field names to new schema so both old and new AY records display correctly
    return filtered.map(r => ({
      ...r,
      studid: r.studid || r.student_id || 'N/A',
      studgender: r.studgender || r.sex || 'Unknown',
      studethnic: r.studethnic || r.ethnicity || 'Not Specified',
      stud_college: r.stud_college || r.college || 'Not Specified',
      stud_program: r.stud_program || r.program || 'Not Specified',
      stud_yrlevel: r.stud_yrlevel || r.year_level || 'Not Specified',
      currentadd_prov: r.currentadd_prov || r.place_of_origin || 'Not Specified',
      is_first_gen_learner: nb(r.is_first_gen_learner ?? r['_first_generation?']),
      '_pwd?': nb(r['_pwd?'] ?? r.is_pwd),
      '_solo_parent?': nb(r['_solo_parent?'] ?? r.is_solo_parent),
      '_ip_member?': nb(r['_ip_member?'] ?? r.is_ip_member),
      '_working_student?': nb(r['_working_student?'] ?? r.is_working_student),
    }));
  }, [allSectorData, activeAY, activeTab]);

  const filteredData = useMemo(() =>
    currentInboxData.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [currentInboxData, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const cmp = smartCompare(a[sortCol], b[sortCol]);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortCol, sortDir]);

  const effectiveRows = rowsPerPage === 'All' ? sortedData.length || 1 : rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(sortedData.length / effectiveRows));
  const paginatedData = useMemo(() => {
    if (rowsPerPage === 'All') return sortedData;
    const s = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(s, s + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const showingFrom = sortedData.length === 0 ? 0 : (currentPage - 1) * effectiveRows + 1;
  const showingTo = Math.min(currentPage * effectiveRows, sortedData.length);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setCurrentPage(1);
  };
  const sector = SECTORS[activeTab];

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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 text-sm font-medium bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors max-w-[280px]"
              >
                <span className="truncate">{activeAY ?? '—'}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${ayOpen ? 'rotate-180' : ''}`} />
              </button>

              {ayOpen && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[200px] max-h-[400px] overflow-y-auto">
                  {availableYears.map(ay => {
                    // Check if this is a semester-based period
                    const isSemesterBased = ay.includes('Semester') || ay.includes('Summer');
                    const displayText = isSemesterBased ? ay : `${ay} (Full Year)`;

                    return (
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
                        <span className="truncate">{displayText}</span>
                        {activeAY === ay && <span className="text-xs shrink-0">✓</span>}
                      </button>
                    );
                  })}
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
            { id: 'visuals', label: 'Visuals' },
            { id: 'table', label: 'Data Sheet' },
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
          <>
            <button
              onClick={() => { setNewPeriod(''); setModifyPeriodOpen(true); }}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
              title="Modify Period"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setClearModalOpen(true)}
              className="p-2 rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete Period"
            >
              <Trash2 size={16} />
            </button>
          </>
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
            filteredData={sortedData}
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
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'student_enrollment' ? (
              <StudentEnrollmentVisuals data={currentInboxData} recordsCount={currentInboxData.length} academicPeriod={activeAY || 'All Years'} />
            ) : activeTab === 'employee_information' ? (
              <EmployeeVisuals data={currentInboxData} recordsCount={currentInboxData.length} academicPeriod={activeAY || 'All Years'} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { if (!isDeleting) { setClearModalOpen(false); setDeleteConfirmText(''); } }}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-96 flex flex-col gap-4 border-2 border-red-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">Delete Dataset Confirmation</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  You are about to permanently delete <span className="font-bold text-red-600 dark:text-red-400">{currentInboxData.length.toLocaleString()} records</span> from <span className="font-bold">{sector.label}</span> for period <span className="font-bold">{activeAY}</span>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-xs text-red-700 dark:text-red-400">All student records, analytics, and historical data for this period will be permanently lost.</p>
            </div>

            {/* Progress Bar - Shows during deletion */}
            {isDeleting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Deleting records...</span>
                  <span className="text-neutral-500 dark:text-neutral-400">Please wait</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic text-center">
                  Do not close this window
                </p>
              </div>
            )}

            {/* Confirmation Input - Hidden during deletion */}
            {!isDeleting && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                  Type <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono text-red-600 dark:text-red-400">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-sm font-mono focus:border-red-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setClearModalOpen(false); setDeleteConfirmText(''); }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmText === 'DELETE') {
                    setDeleteConfirmText('');
                    handleDeleteAY();
                  }
                }}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <>
                    <RefreshCcw className="animate-spin" size={14} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete {currentInboxData.length.toLocaleString()} Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODIFY PERIOD MODAL ── */}
      {modifyPeriodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { if (!isModifying) { setModifyPeriodOpen(false); setNewPeriod(''); } }}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-[480px] flex flex-col gap-4 border-2 border-blue-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">Modify Academic Period</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Change the academic period for <span className="font-bold text-blue-600 dark:text-blue-400">{currentInboxData.length.toLocaleString()} records</span> in <span className="font-bold">{sector.label}</span>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Current Period:</p>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200">{activeAY}</p>
            </div>

            {/* Progress Bar - Shows during modification */}
            {isModifying && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Updating {currentInboxData.length} records...</span>
                  <span className="text-neutral-500 dark:text-neutral-400">Please wait</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            {/* Input Field - Hidden during modification */}
            {!isModifying && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                  New Academic Period:
                </label>
                {activeTab === 'student_enrollment' ? (
                  // Semester-based dropdown for Student Enrollment
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                    autoFocus
                  >
                    <option value="">Select a period...</option>
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const options = [];
                      // Generate from 2022-2023 to current year + 2
                      for (let year = 2022; year <= currentYear + 2; year++) {
                        const nextYear = year + 1;
                        options.push(
                          <option key={`${year}-1st`} value={`${year}-${nextYear} 1st Semester`}>
                            {year}-{nextYear} 1st Semester
                          </option>,
                          <option key={`${year}-2nd`} value={`${year}-${nextYear} 2nd Semester`}>
                            {year}-{nextYear} 2nd Semester
                          </option>
                        );
                      }
                      return options;
                    })()}
                  </select>
                ) : (
                  // Year-based dropdown for other datasets
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                    autoFocus
                  >
                    <option value="">Select a period...</option>
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const options = [];
                      // Generate from 2022-2023 to current year + 2
                      for (let year = 2022; year <= currentYear + 2; year++) {
                        const nextYear = year + 1;
                        options.push(
                          <option key={year} value={`${year}-${nextYear}`}>
                            {year}-{nextYear}
                          </option>
                        );
                      }
                      return options;
                    })()}
                  </select>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {activeTab === 'student_enrollment'
                    ? 'Select the semester period for these records'
                    : 'Select the academic year for these records'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setModifyPeriodOpen(false); setNewPeriod(''); }}
                disabled={isModifying}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyPeriod}
                disabled={isModifying || !newPeriod || newPeriod === activeAY}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isModifying ? (
                  <>
                    <RefreshCcw className="animate-spin" size={14} />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 size={14} />
                    Update Period
                  </>
                )}
              </button>
            </div>
          </div>
        </div >
      )
      }
    </div >
  );
}

/* ─── Table View ── */
function TableView({
  sector, paginatedData, filteredData, searchTerm, setSearchTerm,
  activeAY, showingFrom, showingTo,
  currentPage, setCurrentPage, totalPages,
  rowsPerPage, setRowsPerPage, pageNums,
  sortCol, sortDir, onSort,
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
              {sector.headers.map(h => {
                const active = sortCol === h;
                const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={h}
                    onClick={() => onSort(h)}
                    className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest border-b border-r border-neutral-200 dark:border-neutral-700 whitespace-nowrap last:border-r-0 cursor-pointer select-none group"
                    style={{ color: active ? LILAC : undefined }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={active ? '' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors'}>
                        {HEADER_LABELS[h] || h.replace(/_/g, ' ')}
                      </span>
                      <Icon size={10} className={active ? '' : 'text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 transition-colors'} style={active ? { color: LILAC } : {}} />
                    </span>
                  </th>
                );
              })}
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
              onChange={e => setRowsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))}
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
