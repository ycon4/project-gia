import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, FileUp, Calendar, X, AlertCircle } from 'lucide-react';
import { addDocument } from '../../../firebase/services';

export default function ExcelUploadEmployee({ activeTab, onUploadSuccess, compact = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAYPicker, setShowAYPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const currentYear = new Date().getFullYear();
  const [targetAY, setTargetAY] = useState(`${currentYear}-${currentYear + 1}`);

  // Generate Academic Year options (10 years back to 5 years forward)
  const generateAYOptions = () => {
    const options = [];
    for (let i = -10; i <= 5; i++) {
      const startYear = currentYear + i;
      options.push(`${startYear}-${startYear + 1}`);
    }
    return options.reverse(); // Most recent first
  };

  const ayOptions = generateAYOptions();

  const normalizeSex = (val) => {
    if (!val) return 'Unknown';
    const s = String(val).toLowerCase().trim();
    if (s.startsWith('f')) return 'Female';
    if (s.startsWith('m')) return 'Male';
    return 'Other';
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setShowAYPicker(true);
  };

  const handleUploadProcess = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setShowAYPicker(false);
    setUploadStatus(`Processing...`);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const worksheet = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) throw new Error("File is empty");

        // 1. Define Expected Headers
        const expected = [
          "empId", "empgender", "preferred_pronouns", "emptype", "emp_plantilla",
          "empsalary_grade", "empethnic", "empreligion", "is_emp_senior",
          "is_emp_pwd", "deptcoll", "deptcode"
        ];

        // Optional headers (can be present but not required)
        const optional = ["emp_designation"];

        // 2. Validate Headers against the first row
        const firstRowKeys = Object.keys(rawData[0]);
        const missing = expected.filter(header => !firstRowKeys.includes(header));

        if (missing.length > 0) {
          throw new Error(`MISSING COLUMNS: ${missing.join(", ")}`);
        }

        const cleanedData = rawData.map(row => {
          return {
            // Direct Mapping from your new column names
            empId: row.empId,
            empgender: normalizeSex(row.empgender),
            preferred_pronouns: row.preferred_pronouns,
            emptype: row.emptype,
            emp_designation: row.emp_designation || null, // Optional field
            emp_plantilla: row.emp_plantilla,
            empsalary_grade: row.empsalary_grade,
            empethnic: row.empethnic,
            empreligion: row.empreligion,
            is_emp_senior: row.is_emp_senior,
            is_emp_pwd: row.is_emp_pwd,
            deptcoll: row.deptcoll,
            deptcode: row.deptcode,

            // System Metadata
            academicYear: targetAY,
            uploadTimestamp: new Date().toISOString(),
            sourceFile: selectedFile.name
          };
        });

        setUploadStatus(`Syncing ${cleanedData.length} Records...`);
        await Promise.all(cleanedData.map(doc => addDocument(activeTab, doc)));

        setUploadStatus('Upload Success!');
        if (onUploadSuccess) onUploadSuccess();

        setTimeout(() => {
          setUploadStatus('');
          setSelectedFile(null);
        }, 3000);

      } catch (error) {
        console.error("Employee Upload failed:", error);
        setUploadStatus('Upload Error');

        // Detailed Alert for the user
        alert(
          `UPLOAD FAILED\n\n${error.message}\n\n` +
          `Please ensure your Excel uses these EXACT headers (lowercase):\n` +
          `empId, empgender, preferred_pronouns, emptype, emp_plantilla, empsalary_grade, empethnic, empreligion, is_emp_senior, is_emp_pwd, deptcoll, deptcode`
        );
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  return (
    <div className="relative">
      <input type="file" accept=".xlsx, .xls" onChange={onFileChange} className="hidden" id="emp-upload" disabled={isUploading} />

      <label
        htmlFor="emp-upload"
        className={compact
          ? `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isUploading ? 'border-neutral-200 text-neutral-400 dark:border-neutral-700' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500'}`
          : `flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm border ${isUploading ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'text-white hover:opacity-90 hover:shadow-lg'}`}
        style={(!compact && !isUploading) ? { backgroundColor: '#a673d8', borderColor: '#a673d8' } : {}}
      >
        {isUploading ? <Loader2 className="animate-spin" size={compact ? 13 : 16} /> : <FileUp size={compact ? 13 : 16} />}
        <span>{uploadStatus || `Import Dataset`}</span>
      </label>

      {showAYPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-800/50">
              <h3 className="font-black text-slate-900 dark:text-neutral-100 uppercase tracking-tighter flex items-center gap-2 text-sm">
                <Calendar className="text-blue-600 dark:text-blue-400" size={18} /> Academic Year
              </h3>
              <button onClick={() => setShowAYPicker(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                Select the academic year for this employee dataset:
              </p>

              {/* Academic Year Dropdown */}
              <div className="relative">
                <select
                  value={targetAY}
                  onChange={(e) => setTargetAY(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3 pr-10 font-bold text-slate-700 dark:text-neutral-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {ayOptions.map((ay) => (
                    <option key={ay} value={ay}>
                      {ay === `${currentYear}-${currentYear + 1}` ? `${ay} (Current)` : ay}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-neutral-500">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <button
                onClick={handleUploadProcess}
                disabled={!targetAY}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-neutral-700 disabled:text-slate-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
              >
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}