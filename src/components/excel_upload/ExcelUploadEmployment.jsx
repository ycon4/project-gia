import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, FileUp, Calendar, X, AlertCircle } from 'lucide-react';
import { addDocument } from '../../../firebase/services';

export default function ExcelUploadEmployee({ activeTab, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAYPicker, setShowAYPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const [targetAY, setTargetAY] = useState(`${currentYear}-${currentYear + 1}`);

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
          "employee_id", "sex", "employee_type", "administrative_officials", 
          "plantilla_position", "income", "ethnicity", "religion", 
          "place_of_birth", "special_needs"
        ];

        // 2. Validate Headers against the first row
        const firstRowKeys = Object.keys(rawData[0]);
        const missing = expected.filter(header => !firstRowKeys.includes(header));

        if (missing.length > 0) {
          throw new Error(`MISSING COLUMNS: ${missing.join(", ")}`);
        }

        const cleanedData = rawData.map(row => {
          return {
            // Direct Mapping from your list
            employee_id: row.employee_id,
            sex: normalizeSex(row.sex),
            employee_type: row.employee_type,
            administrative_officials: row.administrative_officials,
            plantilla_position: row.plantilla_position,
            income: row.income,
            ethnicity: row.ethnicity,
            religion: row.religion,
            place_of_birth: row.place_of_birth,
            special_needs: row.special_needs,
            
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
          `employee_id, sex, employee_type, administrative_officials, plantilla_position, income, ethnicity, religion, place_of_birth, special_needs`
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
      
      <label htmlFor="emp-upload" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm border ${isUploading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'}`}>
        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
        <span>{uploadStatus || `Import Employee Data`}</span>
      </label>

      {showAYPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-sm">
                <Calendar className="text-blue-600" size={18} /> Assignment Period
              </h3>
              <button onClick={() => setShowAYPicker(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <input 
                type="text" 
                value={targetAY}
                onChange={(e) => setTargetAY(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:border-blue-500 focus:outline-none transition-all"
                placeholder="AY 2023-2024"
              />
              <button onClick={handleUploadProcess} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98]">
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}