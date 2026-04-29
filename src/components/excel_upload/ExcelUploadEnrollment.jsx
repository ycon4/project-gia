import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2, FileUp, Calendar, X, AlertCircle } from 'lucide-react';
import { addDocument } from '../../../firebase/services';

export default function ExcelUpload({ activeTab, onUploadSuccess, compact = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAYPicker, setShowAYPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Defaulting to current AY format: e.g., "2024-2025"
  const currentYear = new Date().getFullYear();
  const [targetAY, setTargetAY] = useState(`${currentYear}-${currentYear + 1}`);

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

  // 1. Initial File Selection
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setShowAYPicker(true); // Open the Academic Year assignment popup
  };

  // 2. The Actual Upload Logic
  const handleUploadProcess = async () => {
    // Basic validation for AY format (YYYY-YYYY)
    const ayRegex = /^\d{4}-\d{4}$/;
    if (!ayRegex.test(targetAY)) {
      alert("Please use the format YYYY-YYYY (e.g., 2024-2025)");
      return;
    }

    if (!selectedFile) return;

    setIsUploading(true);
    setShowAYPicker(false);
    setUploadStatus(`Preparing AY ${targetAY} Inbox...`);

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
            academicYear: targetAY, // THE KEY: Matches the 'activeAY' filter in Dashboard
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
              '_solo_parent?': normalizeBoolean(row['_solo_parent?'] || row['Solo Parent'] || row['solo_parent'] || row['Single Parent'] || row['Has Solo Parent']),
              '_ip_member?': normalizeBoolean(row['_ip_member?'] || row['IP Member'] || row['IP'] || row['ip_member'] || row['Lumad'] || row['Indigenous People Member'] || row['IP_member'] || row['is_ip_member']),
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

        setUploadStatus(`Syncing to AY ${targetAY}...`);
        
        // Upload rows to the active sector collection
        await Promise.all(cleanedData.map(doc => addDocument(activeTab, doc)));

        setUploadStatus('Upload Success!');
        if (onUploadSuccess) onUploadSuccess();
        
        // Reset states
        setTimeout(() => {
            setUploadStatus('');
            setSelectedFile(null);
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
          style={(!compact && !isUploading) ? { backgroundColor: '#a673d8', borderColor: '#a673d8' } : {}}
      >
        {isUploading ? <Loader2 className="animate-spin" size={compact ? 13 : 16} /> : <FileUp size={compact ? 13 : 16} />}
        <span>{uploadStatus || `Import Dataset`}</span>
      </label>

      {/* ACADEMIC YEAR INBOX ASSIGNMENT OVERLAY */}
      {showAYPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-sm">
                <Calendar className="text-blue-600" size={18} /> Assign Academic Year
              </h3>
              <button 
                onClick={() => setShowAYPicker(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="p-3 bg-blue-50 rounded-xl flex gap-3 items-start">
                <AlertCircle className="text-blue-600 shrink-0" size={16} />
                <p className="text-[11px] font-medium text-blue-800 leading-relaxed">
                  This will create a separate "Inbox" for this data. Use the format <b>YYYY-YYYY</b>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Target Academic Year
                </label>
                <input 
                  type="text" 
                  value={targetAY}
                  onChange={(e) => setTargetAY(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  placeholder="e.g. 2024-2025"
                />
              </div>

              <button 
                onClick={handleUploadProcess}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
              >
                Confirm & Sync Data
              </button>
              
              <p className="text-center text-[10px] text-slate-400 font-medium">
                File: {selectedFile?.name.substring(0, 30)}...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}