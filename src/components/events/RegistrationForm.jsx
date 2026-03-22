import React, { useState } from 'react';
import { 
  ShieldCheck, Fingerprint, Send, CheckCircle2, 
  CalendarCheck, Globe, Info
} from 'lucide-react';

// --- STABLE STYLES (Defined outside to prevent typing focus loss) ---
const inputClass = `
  w-full px-4 py-3 bg-white border border-slate-200 rounded-xl 
  text-slate-700 font-semibold text-sm transition-all duration-300
  placeholder:text-slate-300 hover:border-indigo-300
  focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none
  disabled:bg-slate-50
`;

const labelClass = `
  block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1.5 ml-1
`;

export default function RegistrationForm({ 
  eventName = "Activity Registration", 
  description = "",
  onSubmit, 
  formConfig = {}, 
  hasPreReg = false,
  selectedSession = "General Attendance"
}) {
  const initialFormState = {
    fullName: '', sex: '', age: '', home_address: '',
    email: '', phone: '', office_college: '', department: '',
    designation: '', sector: '', pwd_status: '', ethnic_group: '',
    employment_status: '', year_level: '', emergency_contact: '',
    id_number: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Logic: Check if field is enabled based on prop or defaults
  const isEnabled = (fieldName) => {
    // These are always required in the Primary Section
    if (fieldName === 'fullName' || fieldName === 'sex') return true;
    
    if (formConfig && typeof formConfig === 'object' && Object.keys(formConfig).length > 0) {
      return formConfig[fieldName] === true;
    }
    // Default fallback fields if no config is provided
    const defaults = ['email', 'phone', 'id_number', 'office_college'];
    return defaults.includes(fieldName);
  };

  // Filter fields for the dynamic grid: 
  // ONLY show enabled fields AND EXCLUDE the two already in the Primary Section
  const dynamicFields = Object.keys(initialFormState).filter(key => 
    isEnabled(key) && key !== 'fullName' && key !== 'sex'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        session_name: selectedSession,
        registrationType: hasPreReg ? 'Pre-Registration' : 'Attendance'
      };
      if (onSubmit) await onSubmit(submissionData);
      setSubmitted(true);

      setFormData(initialFormState); // Reset form after submission

    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      required: true,
      className: inputClass,
      value: formData[field],
      onChange: (e) => setFormData({ ...formData, [field]: e.target.value })
    };

    // Dropdown Selects
    if (['sex', 'sector', 'pwd_status', 'employment_status', 'year_level'].includes(field)) {
      const options = {
        sex: ['Male', 'Female', 'Prefer not to say'],
        sector: ['Student', 'Faculty', 'Staff', 'Guest'],
        pwd_status: ['No', 'Yes'],
        employment_status: ['Permanent', 'Contractual', 'Job Order', 'N/A'],
        year_level: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Studies', 'N/A']
      };
      return (
        <select {...commonProps}>
          <option value="">Select Option...</option>
          {options[field].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    // Textarea for longer text
    if (field === 'home_address') {
      return <textarea {...commonProps} rows="1" className={`${inputClass} resize-none`} placeholder="Address Details" />;
    }

    // Input Types and Placeholders
    const typeMap = { email: 'email', age: 'number', phone: 'tel' };
    const placeholderMap = { 
        fullName: "Juan D. Dela Cruz", 
        id_number: "2024-XXXX", 
        phone: "09XXXXXXXXX", 
        email: "name@example.com",
        emergency_contact: "Contact Person & No."
    };

    return <input {...commonProps} type={typeMap[field] || 'text'} placeholder={placeholderMap[field] || ""} />;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl border-t-[12px] border-indigo-600 max-w-md w-full p-12 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={44} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Confirmed</h2>
          <p className="text-slate-500 mt-3 font-medium leading-relaxed">Your response has been officially documented.</p>
          <button onClick={() => setSubmitted(false)} className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
            Return to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans selection:bg-indigo-100">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* FORMAL HEADER SECTION */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 p-10 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 text-indigo-600 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
            <Globe size={280} />
          </div>
          
          <div className="relative z-10">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border-2 ${hasPreReg ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasPreReg ? 'bg-amber-500' : 'bg-indigo-500'}`} />
              {hasPreReg ? "Official Pre-Registration" : "Live Attendance Log"}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">{eventName}</h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-2">
              Currently Signing for: <span className="text-slate-900">{selectedSession}</span>
            </p>
            {description && <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg border-l-4 border-indigo-500 pl-4 py-1 italic">{description}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PRIMARY IDENTITY SECTION (Locked - Full Name and Sex) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-600/5 p-6 rounded-[28px] border border-indigo-100/50 shadow-inner">
             <div className="space-y-1">
                <label className={labelClass}>Full Name <span className="text-indigo-500">*</span></label>
                {renderField('fullName')}
             </div>
             <div className="space-y-1">
                <label className={labelClass}>Sex <span className="text-indigo-500">*</span></label>
                {renderField('sex')}
             </div>
          </div>

          {/* DYNAMIC ATTRIBUTE GRID (Filtered to exclude Primary fields) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 px-2">
            {dynamicFields.map((field) => (
              <div key={field} className="space-y-1.5">
                <label className={labelClass}>{field.replace('_', ' ')} <span className="text-indigo-300">*</span></label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* FORMAL SUBMIT BUTTON */}
          <div className="pt-8">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="group relative w-full py-5 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:bg-slate-300 shadow-2xl shadow-indigo-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="flex items-center justify-center gap-4 relative z-10">
                {isSubmitting ? 'Recording Entry...' : 'Submit Official Entry'}
                <Send size={16} className="opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
            </button>
            <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
               <Info size={12} />
               <p className="text-[9px] font-bold uppercase tracking-widest">Confidential data handling • MSU-IIT GADC</p>
            </div>
          </div>
        </form>

        <footer className="text-center pt-8 border-t border-slate-100">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" /> 
            Protected by Data Privacy Act
          </div>
        </footer>
      </div>
    </div>
  );
}