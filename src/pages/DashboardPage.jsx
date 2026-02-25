import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Trash2, LayoutDashboard, Table, AlertCircle, 
  RefreshCcw, Calendar, FolderOpen, Users, Briefcase, Zap 
} from 'lucide-react';

// Import Services
import { getAllDocuments, deleteAYData } from '../../firebase/services.js';

// Import Uploaders
import ExcelUploadEnrollment from '../components/excel_upload/ExcelUploadEnrollment.jsx'; 
import ExcelUploadEngagement from '../components/excel_upload/ExcelUploadEngagement.jsx';
import ExcelUploadEmployee from '../components/excel_upload/ExcelUploadEmployment.jsx';

// Import Visuals
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals.jsx';
import EmployeeVisuals from '../components/visuals/EmployeeVisuals.jsx';
import StudentEngagementVisuals from '../components/visuals/EngagementVisuals.jsx';

const SECTORS = {
  student_enrollment: {
    label: "Student Enrollment",
    icon: <Users size={18} />,
    color: "purple",
    headers: ["student_id", "sex", "income_PSA_category", "ethnicity", "college", "program", "year_level"]
  },
    employee_information: {
    label: "Employee Info",
    icon: <Briefcase size={18} />,
    color: "blue",
    headers: [
      "employee_id", "sex", "employee_type", "administrative_officials", 
      "plantilla_position", "income", "ethnicity", "religion", 
      "place_of_birth", "special_needs"
    ]
  },
  student_engagement: {
    label: "Student Engagement",
    icon: <Zap size={18} />,
    color: "amber",
    headers: ["student_id", "sex", "scholarship_status", "student_council", "organizations", "publication"]
  }
};

export default function DashboardPage() {
  const [allSectorData, setAllSectorData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student_enrollment'); 
  const [activeAY, setActiveAY] = useState(null); 
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { 
    loadTabData(); 
  }, [activeTab]);

  const loadTabData = async () => {
    try {
      setLoading(true);
      const result = await getAllDocuments(activeTab);
      setAllSectorData(result);
      
      const years = [...new Set(result.map(item => item.academicYear))].sort().reverse();
      if (years.length > 0) {
        setActiveAY(years[0]);
      } else {
        setActiveAY(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setAllSectorData([]);
    } finally { 
      setLoading(false); 
    }
  };

  // --- Delete AY Logic ---
  const handleDeleteAY = async () => {
    if (!activeAY) return;

    const confirmDelete = window.confirm(
      `CRITICAL: This will permanently delete ALL ${currentInboxData.length} records for AY ${activeAY} in the ${SECTORS[activeTab].label} sector. This cannot be undone. Continue?`
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteAYData(activeTab, activeAY);
      alert(`Successfully cleared AY ${activeAY} data.`);
      await loadTabData(); // Refresh page and available years
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete data. Check console for details.");
    } finally {
      setIsDeleting(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = [...new Set(allSectorData.map(item => item.academicYear))];
    return years.filter(Boolean).sort().reverse(); 
  }, [allSectorData]);

  const currentInboxData = useMemo(() => {
    return allSectorData.filter(item => item.academicYear === activeAY);
  }, [allSectorData, activeAY]);

  const filteredData = useMemo(() => {
    return currentInboxData.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [currentInboxData, searchTerm]);

  const activeSector = SECTORS[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">GADC Data Hub</h1>
            <p className="text-slate-500 font-medium tracking-tight">Designated Sector Management</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'student_engagement' ? (
              <ExcelUploadEngagement activeTab={activeTab} onUploadSuccess={loadTabData} />
            ) : activeTab === 'employee_information' ? (
              <ExcelUploadEmployee activeTab={activeTab} onUploadSuccess={loadTabData} />
            ) : (
              <ExcelUploadEnrollment activeTab={activeTab} onUploadSuccess={loadTabData} />
            )}
          </div>
        </div>

        {/* SECTOR TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(SECTORS).map(([key, sector]) => (
            <button
              key={key}
              onClick={() => { 
                setActiveTab(key); 
                setActiveAY(null); 
                setViewMode('table'); 
                setSearchTerm('');
              }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${
                activeTab === key 
                ? `bg-white border-slate-900 text-slate-900 shadow-md` 
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100'
              }`}
            >
              {sector.icon}
              {sector.label}
            </button>
          ))}
        </div>

        {/* YEAR INBOX SELECTOR & DELETE ACTION */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-200/50 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="px-3 flex items-center gap-2 text-slate-500">
                <FolderOpen size={14} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Inboxes:</span>
              </div>
              {availableYears.map(ay => (
                <button
                  key={ay}
                  onClick={() => setActiveAY(ay)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeAY === ay 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-300' 
                    : 'text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  AY {ay}
                </button>
              ))}
            </div>

            {activeAY && (
              <button 
                onClick={handleDeleteAY}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-100 disabled:opacity-50 mr-2"
              >
                {isDeleting ? <RefreshCcw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                Clear AY {activeAY}
              </button>
            )}
          </div>
        )}

        {/* VIEW TOGGLE */}
        <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('table')} 
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Table size={16} /> Data Sheet
            </button>
            <button 
              onClick={() => setViewMode('visuals')} 
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'visuals' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={16} /> Visuals
            </button>
          </div>

          <div className="hidden md:block px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                AY: <span className="text-slate-900">{activeAY || '---'}</span> | Records: <span className="text-slate-900">{currentInboxData.length}</span>
              </p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="mt-6">
          {loading ? (
            <LoadingState label={activeSector.label} />
          ) : !activeAY ? (
            <NoDataFound label={activeSector.label} />
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
               <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                 <Search size={18} className="text-slate-400" />
                 <input 
                    type="text" 
                    placeholder={`Search within AY ${activeAY}...`}
                    className="bg-transparent outline-none text-sm w-full font-medium text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        {activeSector.headers.map(h => (
                          <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            {h.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                          {activeSector.headers.map(h => (
                            <td key={h} className="px-8 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                              {row[h] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          ) : (
            /* MAIN CONTENT AREA - VISUALS BRANCH */
            <div className="mt-6">
              {activeTab === 'student_enrollment' ? (
                <StudentEnrollmentVisuals data={currentInboxData} />
              ) : activeTab === 'employee_information' ? (
                <EmployeeVisuals data={currentInboxData} />
              ) : activeTab === 'student_engagement' ? (
                <StudentEngagementVisuals data={currentInboxData} />
              ) : (
                /* Final Fallback for undefined sectors */
                <div className="bg-white p-20 rounded-[32px] text-center border border-slate-100 shadow-sm animate-in fade-in duration-500">
                  <AlertCircle size={48} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Data Hub
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Select a specific sector to view analytical reports.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function LoadingState({ label }) {
  return (
    <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
      <RefreshCcw className="animate-spin text-slate-300 mb-4" size={40} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading {label}...</p>
    </div>
  );
}

function NoDataFound({ label }) {
  return (
    <div className="bg-white rounded-[32px] border border-dashed border-slate-200 p-32 flex flex-col items-center justify-center text-center">
        <Calendar size={48} className="text-slate-200 mb-4" />
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Inbox Empty</h3>
        <p className="text-slate-300 text-sm mt-1 max-w-xs">No data found for this sector. Upload an Excel file and assign it an Academic Year to begin.</p>
    </div>
  );
}