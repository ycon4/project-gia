import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2, FileUp, Calendar, X, AlertCircle } from 'lucide-react';
import { addDocument } from '../../../firebase/services';

export default function ExcelUploadEngagement({ activeTab, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAYPicker, setShowAYPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const [targetAY, setTargetAY] = useState(`${currentYear}-${currentYear + 1}`);

  // --- Normalization Helpers ---
  const normalizeEngagementValue = (val) => {
  // 1. Check if it's truly empty, null, undefined, or just whitespace
  if (val === undefined || val === null || String(val).trim() === '' || val === 0) {
    return 'N/A';
  }
  
  // 2. If it's not blank, return the actual text from the Excel
  return String(val).trim();
};

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
    const ayRegex = /^\d{4}-\d{4}$/;
    if (!ayRegex.test(targetAY)) {
      alert("Please use the format YYYY-YYYY (e.g., 2024-2025)");
      return;
    }

    if (!selectedFile) return;

    setIsUploading(true);
    setShowAYPicker(false);
    setUploadStatus(`Processing Engagement Data...`);

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
          student_id: row.student_id || row['Student ID'] || 'N/A',
          sex: normalizeSex(row.sex || row['Sex']),
          academicYear: targetAY,
          uploadTimestamp: new Date().toISOString(),
          sourceFile: selectedFile.name
        };

        return {
          ...baseData,
          // Using the new helper to keep your actual text inputs!
          scholarship_status: row.scholarship_status || row['Scholarship'],
          academic_standing: normalizeEngagementValue(row.academic_standing || row['Academic Standing']),
          publication: normalizeEngagementValue(row.student_publication || row['Publication']),
          student_council: normalizeEngagementValue(row.student_council || row['Student Council']),
          organizations: normalizeEngagementValue(row.student_organization || row['Organizations']),
        };
      });

        setUploadStatus(`Syncing to AY ${targetAY}...`);
        
        // Upload rows to the active sector collection (student_engagement)
        await Promise.all(cleanedData.map(doc => addDocument(activeTab, doc)));

        setUploadStatus('Upload Success!');
        if (onUploadSuccess) onUploadSuccess();
        
        setTimeout(() => {
            setUploadStatus('');
            setSelectedFile(null);
        }, 3000);

      } catch (error) {
        console.error("Engagement Upload failed:", error);
        setUploadStatus('Upload Error');
        alert(`Error: Ensure your Excel has student_id, sex, student_council, organizations, and publication columns.`);
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
        id="engagement-excel-upload" 
        disabled={isUploading}
      />
      
      <label 
        htmlFor="engagement-excel-upload" 
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm border ${isUploading ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'text-white hover:opacity-90 hover:shadow-lg'}`}
        style={!isUploading ? { backgroundColor: '#a680cf', borderColor: '#a680cf' } : {}}
      >
        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
        <span>{uploadStatus || `Import Dataset`}</span>
      </label>

      {/* MODAL POPUP */}
      {showAYPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-sm">
                <Calendar className="text-indigo-600" size={18} /> Engagement Period
              </h3>
              <button onClick={() => setShowAYPicker(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="p-3 bg-indigo-50 rounded-xl flex gap-3 items-start">
                <AlertCircle className="text-indigo-600 shrink-0" size={16} />
                <p className="text-[11px] font-medium text-indigo-800 leading-relaxed">
                  Assigning engagement data to Academic Year <b>{targetAY}</b>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Academic Year</label>
                <input 
                  type="text" 
                  value={targetAY}
                  onChange={(e) => setTargetAY(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
                  placeholder="e.g. 2024-2025"
                />
              </div>

              <button 
                onClick={handleUploadProcess}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]"
              >
                Confirm & Sync Engagement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}