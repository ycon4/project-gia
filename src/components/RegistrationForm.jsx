import React, { useState } from 'react';
import { User, ShieldCheck, Fingerprint, Send, CheckCircle2, UserCircle, Users, Building } from 'lucide-react';

export default function RegistrationForm({ eventName, onSubmit, currentCount = 0 }) {
  const initialFormState = {
    idNumber: '',
    fullName: '',
    sex: '',
    sector: '',
    office_college: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.sex || !formData.sector || !formData.fullName) {
      alert("Please fill in all required fields (Name, Sex, and Sector)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setSubmitted(false);
  };

  // Success View (Kiosk Mode)
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-6 max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Confirmed!</h2>
            <p className="text-slate-500 font-medium text-sm px-4">
              Thank you for checking in to <br/>
              <span className="text-purple-600 font-bold">{eventName || "this event"}</span>.
            </p>
          </div>
          
          <button 
            onClick={handleReset}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Next Person <Send size={14} className="rotate-90" />
          </button>
          
          <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-2">
            Please let the next person in line use the laptop.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Event Header */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex p-3.5 bg-purple-600 text-white rounded-2xl shadow-xl mb-2">
            <Fingerprint size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Event Check-In</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] px-4 truncate">
            {eventName || "GAD Activity"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-5">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
            <div className="relative">
              <input 
                required
                type="text"
                autoComplete="off"
                placeholder="Juan Dela Cruz"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
              <UserCircle className="absolute right-4 top-3.5 text-slate-300" size={18} />
            </div>
          </div>

          {/* ID Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number (Optional)</label>
            <div className="relative">
              <input 
                type="text"
                autoComplete="off"
                placeholder="20XX-XXXX"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                value={formData.idNumber}
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
              />
              <User className="absolute right-4 top-3.5 text-slate-300" size={18} />
            </div>
          </div>

          {/* Sex Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sex *</label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({...formData, sex: option})}
                  className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                    formData.sex === option 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector *</label>
            <div className="relative">
              <select 
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                value={formData.sector}
                onChange={(e) => setFormData({...formData, sector: e.target.value})}
              >
                <option value="">Select Sector</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
                <option value="Visitor">Visitor/Guest</option>
              </select>
              <div className="absolute right-4 top-4 pointer-events-none">
                <Users className="text-slate-300" size={18} />
              </div>
            </div>
          </div>

          {/* Office/College Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">College / Office / Affiliation</label>
            <div className="relative">
              <textarea 
                rows="2"
                placeholder="e.g. CCS, Registrar's Office, or Agency Name"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none resize-none"
                value={formData.office_college}
                onChange={(e) => setFormData({...formData, office_college: e.target.value})}
              />
              <Building className="absolute right-4 top-3.5 text-slate-300" size={18} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 mt-4 ${
              isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Attendance'} <Send size={16} />
          </button>
        </form>

        {/* Live Kiosk Stats */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={12} /> Total Checked In: <span className="text-slate-900">{currentCount}</span>
            </span>
          </div>

          <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={12} /> Data Protected by MSU-IIT GADC
          </p>
        </div>
      </div>
    </div>
  );
}