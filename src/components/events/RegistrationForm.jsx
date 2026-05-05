import React, { useState } from 'react';
import {
  ShieldCheck, Send, CheckCircle2,
  CalendarCheck, Info, Sparkles
} from 'lucide-react';

// --- COMPACT STYLES ALIGNED WITH GIA THEME ---
const inputClass = `
  w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg 
  text-neutral-800 font-medium text-sm transition-all
  placeholder:text-neutral-400 hover:border-gia-400
  focus:border-gia-500 focus:ring-2 focus:ring-gia-500/20 focus:outline-none
  disabled:bg-neutral-50
`;

const labelClass = `
  block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5
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

  const isEnabled = (fieldName) => {
    if (fieldName === 'fullName' || fieldName === 'sex') return true;
    if (formConfig && typeof formConfig === 'object' && Object.keys(formConfig).length > 0) {
      return formConfig[fieldName] === true;
    }
    const defaults = ['email', 'phone', 'id_number', 'office_college'];
    return defaults.includes(fieldName);
  };

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
      setFormData(initialFormState);
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
      value: formData[field] || '',
      onChange: (e) => setFormData({ ...formData, [field]: e.target.value })
    };

    if (field === 'office_college') {
      const colleges = [
        'College of Engineering (COE)',
        'College of Arts and Social Sciences (CASS)',
        'College of Science and Mathematics (CSM)',
        'College of Economics, Business, and Accountancy (CEBA)',
        'College of Education (CED)',
        'College of Health Sciences (CHS)',
        'College of Computer Studies (CCS)',
        'Other'
      ];

      const isManual = formData.office_college !== '' && !colleges.includes(formData.office_college);


      return (
        <div className="space-y-2">
          <select
            className={inputClass}
            // If we are typing manually, the dropdown should show "Other"
            value={isManual ? 'Other' : formData.office_college}
            onChange={(e) => {
              const val = e.target.value;
              // If "Other" is picked, set a temp value to show the input, else set the college
              setFormData({ ...formData, [field]: val === 'Other' ? 'typing...' : val });
            }}
          >
            <option value="">Select College...</option>
            {colleges.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            <option value="Other">Other (Please Specify)</option>
          </select>

          {(isManual || formData.office_college === 'typing...') && (
            <input
              {...commonProps}
              autoFocus
              placeholder="Please type your Office/College"
              className={`${inputClass} border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-500/5 animate-in slide-in-from-top-1 duration-200`}
              // If it's our temp 'typing...' string, show empty box, otherwise show the text
              value={formData.office_college === 'typing...' ? '' : formData.office_college}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            />
          )}
        </div>
      );
    }

    if (['sex', 'sector', 'pwd_status', 'employment_status', 'year_level'].includes(field)) {
      const options = {
        sex: ['Male', 'Female', 'Prefer not to say'],
        sector: ['Student', 'Faculty', 'Staff', 'Other Beneficiaries'],
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

    if (field === 'home_address') {
      return <textarea {...commonProps} rows="1" className={`${inputClass} resize-none`} placeholder="Address Details" />;
    }

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
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-gia-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 max-w-md w-full p-10 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">Registration Complete!</h2>
          <p className="text-neutral-500 mt-2 text-sm font-medium leading-relaxed">Your attendance has been successfully recorded.</p>
          <button onClick={() => setSubmitted(false)} className="mt-8 px-6 py-3 bg-gia-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gia-700 transition-all shadow-lg">
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-gia-50/30 py-8 px-4 font-sans selection:bg-gia-100">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header Card - Compact */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gia-100/40 to-transparent rounded-full blur-3xl -z-0" />

          <div className="relative z-10">
            {/* Session Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 ${hasPreReg ? 'bg-amber-100 text-amber-700' : 'bg-gia-100 text-gia-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasPreReg ? 'bg-amber-500' : 'bg-gia-500'}`} />
              {hasPreReg ? "Pre-Registration" : "Attendance"}
            </div>

            {/* Event Title */}
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight leading-tight mb-2">{eventName}</h1>

            {/* Session Info */}
            <div className="flex items-center gap-2 text-xs">
              <CalendarCheck size={14} className="text-gia-500" />
              <span className="font-bold text-neutral-600">Session:</span>
              <span className="font-black text-gia-600">{selectedSession}</span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-neutral-500 text-xs font-medium leading-relaxed mt-3 border-l-2 border-gia-400 pl-3 py-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Form Card - Compact Grid */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-5">

          {/* Required Fields Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-gia-500" />
              <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Required Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>Full Name <span className="text-gia-500">*</span></label>
                {renderField('fullName')}
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Sex <span className="text-gia-500">*</span></label>
                {renderField('sex')}
              </div>
            </div>
          </div>

          {/* Additional Fields - Compact 2-column grid */}
          {dynamicFields.length > 0 && (
            <div className="pt-4 border-t border-neutral-100">
              <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {dynamicFields.map((field) => (
                  <div key={field} className="space-y-1">
                    <label className={labelClass}>
                      {field === 'office_college' ? 'Office / College' :
                        field === 'id_number' ? 'ID Number' :
                          field === 'home_address' ? 'Home Address' :
                            field === 'emergency_contact' ? 'Emergency Contact' :
                              field === 'pwd_status' ? 'PWD Status' :
                                field === 'ethnic_group' ? 'Ethnic Group' :
                                  field === 'employment_status' ? 'Employment Status' :
                                    field === 'year_level' ? 'Year Level' :
                                      field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      <span className="text-gia-400">*</span>
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button - Compact */}
          <div className="pt-5 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full py-3.5 bg-gradient-to-r from-gia-600 to-gia-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-gia-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="flex items-center justify-center gap-3 relative z-10">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </span>
            </button>

            {/* Privacy Notice */}
            <div className="flex items-center justify-center gap-2 mt-4 text-neutral-400">
              <ShieldCheck size={12} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Protected by Data Privacy Act • MSU-IIT GADC</p>
            </div>
          </div>
        </form>

        {/* Footer Badge */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full text-[9px] font-bold text-neutral-400 uppercase tracking-widest shadow-sm">
            <Info size={11} className="text-gia-500" />
            Confidential Data Handling
          </div>
        </div>
      </div>
    </div>
  );
}