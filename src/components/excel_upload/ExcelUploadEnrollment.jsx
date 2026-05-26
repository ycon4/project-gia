import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2, FileUp, Calendar, X, AlertCircle } from 'lucide-react';
import { addDocument } from '../../../firebase/services';

export default function ExcelUpload({ activeTab, onUploadSuccess, compact = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAYPicker, setShowAYPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('append'); // 'append' or 'replace'
  const [existingRecordCount, setExistingRecordCount] = useState(0);
  const [duplicateStudents, setDuplicateStudents] = useState([]);

  // Semester-based period selection
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Auto-detect semester based on current month
  const getDefaultSemester = () => {
    if (currentMonth >= 8 && currentMonth <= 12) return '1st Semester';
    return '2nd Semester'; // January to July
  };

  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 1);
  const [semester, setSemester] = useState(getDefaultSemester());

  // Generate year options (last 5 years to next 2 years)
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  // --- Normalization Helpers ---
  const normalizeBoolean = (val) => {
    if (!val) return 'No';
    const s = String(val).toLowerCase().trim();
    return (s === 'yes' || s === 'y' || s === 'true' || s === '1') ? 'Yes' : 'No';
  };

  const normalizeSex = (val) => {
    if (!val) return 'Unknown';
    const s = String(val).toLowerCase().trim();
    if (s.startsWith('f')) return 'Female';
    if (s.startsWith('m')) return 'Male';
    return 'Other';
  };

  // Auto-update end year when start year changes
  const handleStartYearChange = (year) => {
    setStartYear(year);
    setEndYear(year + 1);
  };

  // Generate period string
  const getPeriodString = () => `${startYear}-${endYear} ${semester}`;

  // 1. Initial File Selection
  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    // Validate Excel columns before proceeding
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const worksheet = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
          alert('❌ Empty File\n\nThe Excel file contains no data. Please upload a file with student records.');
          setSelectedFile(null);
          return;
        }

        // Get column headers from first row
        const headers = Object.keys(rawData[0]).map(h => h.toLowerCase().trim());

        // Define required columns (case-insensitive)
        const requiredColumns = [
          'studid',
          'studgender',
          'preferred_pronouns',
          'studlegstatus',
          'studreligion',
          'studethnic',
          'currentadd_country',
          'is_child_solo_parent',
          'is_indigenous',
          'indigenous_group',
          'is_child_pdl',
          'is_child_lgbtq',
          'is_first_gen_learner',
          'is_pwd',
          'pwd_aspect',
          'stud_program',
          'stud_college',
          'stud_yrlevel',
        ];

        // Check for missing columns
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          // Block upload and show error
          alert(
            `❌ INVALID EXCEL FORMAT\n\n` +
            `Missing Required Columns (${missingColumns.length}):\n` +
            `${missingColumns.map(col => `• ${col}`).join('\n')}\n\n` +
            `Please ensure your Excel file contains ALL required columns.\n\n` +
            `Upload blocked for data integrity.`
          );
          setSelectedFile(null);
          e.target.value = ''; // Reset file input
          return;
        }

        // All columns present - proceed to period selection
        const period = getPeriodString();
        const { getAllDocuments } = await import('../../../firebase/services.js');
        const existingData = await getAllDocuments(activeTab);
        const periodData = existingData.filter(record => record.academicYear === period);
        setExistingRecordCount(periodData.length);
        setShowAYPicker(true);

      } catch (err) {
        console.error('Error validating file:', err);
        alert('❌ Error reading file. Please ensure it is a valid Excel file (.xlsx or .xls).');
        setSelectedFile(null);
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Check for duplicate student IDs
  const checkDuplicates = async (newData, period) => {
    try {
      const { getAllDocuments } = await import('../../../firebase/services.js');
      const existingData = await getAllDocuments(activeTab);
      const periodData = existingData.filter(record => record.academicYear === period);

      const existingIds = new Set(periodData.map(r => r.studid));
      const newIds = newData.map(r => r.studid);
      const duplicates = newIds.filter(id => existingIds.has(id));

      return duplicates;
    } catch (err) {
      console.error('Error checking duplicates:', err);
      return [];
    }
  };

  // 2. The Actual Upload Logic
  const handleUploadProcess = async () => {
    if (!selectedFile) return;

    const period = getPeriodString();

    // If replace mode and data exists, confirm
    if (uploadMode === 'replace' && existingRecordCount > 0) {
      const confirmed = window.confirm(
        `⚠️ REPLACE MODE\n\nThis will DELETE ${existingRecordCount} existing records in "${period}" and replace them with new data.\n\nThis action cannot be undone. Continue?`
      );
      if (!confirmed) return;
    }

    setIsUploading(true);
    setShowAYPicker(false);
    setUploadStatus(`Preparing ${period}...`);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const worksheet = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) throw new Error("File is empty");

        const cleanedData = rawData.map(row => {
          const baseData = {
            ...row,
            sex: normalizeSex(row.sex || row['Sex'] || row['Gender']),
            studgender: normalizeSex(row.studgender || row['Gender'] || row.sex || row['Sex']),
            academicYear: period,
            uploadTimestamp: new Date().toISOString(),
            sourceFile: selectedFile.name
          };

          // Sector-specific normalization
          if (activeTab === 'student_enrollment') {
            return {
              ...baseData,
              studid: row.studid || row.student_id || row['Student ID'] || 'N/A',
              income_PSA_category: row.income_PSA_category || row['Income Category'] || 'Not Specified',
              '_pwd?': normalizeBoolean(row['_pwd?'] || row['PWD'] || row['pwd'] || row['Person with Disability'] || row['Disability'] || row['is_pwd']),
              '_working_student?': normalizeBoolean(row['_working_student?'] || row['Working Student'] || row['working_student'] || row['Working'] || row['is_working_student']),
              is_first_gen_learner: normalizeBoolean(row.is_first_gen_learner || row['_first_generation?'] || row['First Gen'] || row['1st Gen'] || row['First Generation'] || row['1st Generation'] || row['First Gen Learner'] || row['1st Gen Learner'] || row['First Generation Learner'] || row['1st Generation Learner'] || row['first_gen_learner']),
              is_indigenous: normalizeBoolean(row.is_indigenous || row['Indigenous'] || row['is_indigenous']),
              is_pwd: normalizeBoolean(row.is_pwd || row['PWD']),
              is_child_lgbtq: normalizeBoolean(row.is_child_lgbtq || row['Child LGBTQ+']),
              is_child_pdl: normalizeBoolean(row.is_child_pdl || row['Child PDL']),
              is_child_solo_parent: normalizeBoolean(row.is_child_solo_parent || row['Child Solo Parent']),
            };
          }
          return baseData;
        });

        // Check for duplicates in append mode
        if (uploadMode === 'append') {
          const duplicates = await checkDuplicates(cleanedData, period);
          if (duplicates.length > 0) {
            const proceed = window.confirm(
              `⚠️ DUPLICATE STUDENT IDs FOUND\n\n${duplicates.length} student(s) already exist in "${period}":\n${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}\n\nThese records will be skipped. Continue?`
            );
            if (!proceed) {
              setIsUploading(false);
              setShowAYPicker(true);
              return;
            }
            setDuplicateStudents(duplicates);
          }
        }

        // If replace mode, delete existing data first
        if (uploadMode === 'replace' && existingRecordCount > 0) {
          setUploadStatus(`Removing old data from ${period}...`);
          const { deleteAYData } = await import('../../../firebase/services.js');
          await deleteAYData(activeTab, period);
        }

        setUploadStatus(`Syncing to ${period}...`);

        // Filter out duplicates in append mode
        let dataToUpload = cleanedData;
        if (uploadMode === 'append' && duplicateStudents.length > 0) {
          dataToUpload = cleanedData.filter(doc => !duplicateStudents.includes(doc.studid));
        }

        // Upload rows to the active sector collection
        await Promise.all(dataToUpload.map(doc => addDocument(activeTab, doc)));

        const skippedCount = cleanedData.length - dataToUpload.length;
        setUploadStatus(
          skippedCount > 0
            ? `Success! ${dataToUpload.length} added, ${skippedCount} skipped`
            : 'Upload Success!'
        );
        if (onUploadSuccess) onUploadSuccess();

        // Reset states
        setTimeout(() => {
          setUploadStatus('');
          setSelectedFile(null);
          setDuplicateStudents([]);
          setUploadMode('append');
        }, 3000);

      } catch (error) {
        console.error("Upload failed:", error);
        setUploadStatus('Upload Error');
        alert(`Critical error uploading to ${activeTab}. Check file format.`);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={onFileChange}
        className="hidden"
        id="sector-excel-upload"
        disabled={isUploading}
      />

      <label
        htmlFor="sector-excel-upload"
        className={compact
          ? `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isUploading ? 'border-neutral-200 text-neutral-400 dark:border-neutral-700' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500'}`
          : `flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm border ${isUploading ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'text-white hover:opacity-90 hover:shadow-lg'}`}
        style={(!compact && !isUploading) ? { backgroundColor: '#741112', borderColor: '#741112' } : {}}
      >
        {isUploading ? <Loader2 className="animate-spin" size={compact ? 13 : 16} /> : <FileUp size={compact ? 13 : 16} />}
        <span>{uploadStatus || `Import Dataset`}</span>
      </label>

      {/* ACADEMIC PERIOD ASSIGNMENT OVERLAY */}
      {showAYPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-sm">
                <Calendar className="text-blue-600" size={18} /> Assign Academic Period
              </h3>
              <button
                onClick={() => { setShowAYPicker(false); setSelectedFile(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Existing Data Warning */}
              {existingRecordCount > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl flex gap-3 items-start border border-amber-200">
                  <AlertCircle className="text-amber-600 shrink-0" size={16} />
                  <div className="text-[11px] font-medium text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1">Period already has data!</p>
                    <p>{existingRecordCount} records exist in "{getPeriodString()}"</p>
                  </div>
                </div>
              )}

              {/* Academic Year Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Academic Year
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={startYear}
                    onChange={(e) => handleStartYearChange(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">—</span>
                  <select
                    value={endYear}
                    disabled
                    className="flex-1 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 cursor-not-allowed"
                  >
                    <option value={endYear}>{endYear}</option>
                  </select>
                </div>
              </div>

              {/* Semester Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Semester
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['1st Semester', '2nd Semester'].map(sem => (
                    <button
                      key={sem}
                      onClick={() => setSemester(sem)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${semester === sem
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {sem === '1st Semester' ? '1st Sem' : '2nd Sem'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Preview</p>
                <p className="text-lg font-black text-blue-900">{getPeriodString()}</p>
              </div>

              {/* Upload Mode Selection */}
              {existingRecordCount > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                    Upload Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                      style={{ borderColor: uploadMode === 'append' ? '#3b82f6' : '#e2e8f0' }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        value="append"
                        checked={uploadMode === 'append'}
                        onChange={(e) => setUploadMode(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Append to existing data</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Add new records, skip duplicates</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-50"
                      style={{ borderColor: uploadMode === 'replace' ? '#3b82f6' : '#e2e8f0' }}>
                      <input
                        type="radio"
                        name="uploadMode"
                        value="replace"
                        checked={uploadMode === 'replace'}
                        onChange={(e) => setUploadMode(e.target.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Replace all data</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Delete {existingRecordCount} records and upload new</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <button
                onClick={handleUploadProcess}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
              >
                {uploadMode === 'replace' && existingRecordCount > 0 ? 'Replace & Upload' : 'Confirm & Upload'}
              </button>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                File: {selectedFile?.name.substring(0, 40)}{selectedFile?.name.length > 40 ? '...' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}