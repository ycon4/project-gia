import { useState, useEffect } from 'react';
import {
  X, Plus, CalendarDays, MapPin, Users, Tag,
  ClipboardList, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  GraduationCap, Briefcase, Phone, Shield, Info,
  UserCircle, Wallet, Target, BookOpen, Building, FileCheck,
  StickyNote, Upload, Image as ImageIcon, Mic,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  'Training',
  'Seminar',
  'Symposium',
  'Capability Building',
  'Forum',
  'Orientation',
  'Workshop',
  'Other',
];

const EVENT_MODES = ['In-person', 'Online', 'Hybrid'];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', dot: 'bg-emerald-400' },
  { value: 'Done', label: 'Done', dot: 'bg-neutral-400' },
  { value: 'Cancelled', label: 'Cancelled', dot: 'bg-rose-400' },
];

// Grouped registration fields — sex is always required, excluded from config
const FIELD_GROUPS = [
  {
    id: 'identity',
    label: 'Identity',
    icon: Shield,
    fields: [
      { id: 'age', label: 'Age' },
      { id: 'home_address', label: 'Home Address' },
      { id: 'id_number', label: 'ID Number' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Phone,
    fields: [
      { id: 'email', label: 'Email Address' },
      { id: 'phone', label: 'Phone Number' },
      { id: 'emergency_contact', label: 'Emergency Contact' },
    ],
  },
  {
    id: 'affiliation',
    label: 'Affiliation',
    icon: Briefcase,
    fields: [
      { id: 'office_college', label: 'College / Office' },
      { id: 'department', label: 'Department' },
      { id: 'designation', label: 'Designation' },
      { id: 'sector', label: 'Sector' },
      { id: 'year_level', label: 'Year Level' },
    ],
  },
  {
    id: 'gad',
    label: 'GAD / SDD',
    icon: GraduationCap,
    fields: [
      { id: 'pwd_status', label: 'PWD Status' },
      { id: 'ethnic_group', label: 'Ethnic Group' },
      { id: 'employment_status', label: 'Employment Status' },
    ],
  },
];

const ALL_FIELD_IDS = FIELD_GROUPS.flatMap(g => g.fields.map(f => f.id));

const DEFAULT_FORM_CONFIG = {
  office_college: true,
  sector: true,
  pwd_status: true,
};

export const DEFAULT_EVENT = {
  title: '',
  description: '',
  eventType: '',
  venue: '',
  mode: 'In-person',
  status: 'Active',
  startDate: '',
  endDate: '',
  targetParticipants: '',
  targetGroup: '',
  organizer: '',
  budget: '',
  fundingSource: '',
  partnerAgencies: '',
  gadMandate: '',
  objectives: '',
  accomplishmentNotes: '',
  hasPreReg: true,
  sessions: [],
  formConfig: DEFAULT_FORM_CONFIG,
  // Speaker/Poster fields
  speakerName: '',
  speakerTitle: '',
  speakerAffiliation: '',
  speakerPhoto: null,
  eventSeriesName: '',
  registrationLink: '',
};

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = `
  w-full border border-neutral-200 dark:border-neutral-700
  bg-white dark:bg-neutral-800/60
  text-neutral-900 dark:text-neutral-100
  rounded-xl px-3 py-2.5 text-sm font-medium
  outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500
  placeholder:text-neutral-400 dark:placeholder:text-neutral-600
  transition-colors
`.replace(/\s+/g, ' ').trim();

const labelCls =
  'block text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-widest';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon: Icon, title, subtitle, children, accent = false }) {
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${accent
      ? 'bg-gia-50/60 dark:bg-gia-950/20 border-gia-200/60 dark:border-gia-800/40'
      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${accent
          ? 'bg-gia-100 dark:bg-gia-900/40 text-gia-600 dark:text-gia-400'
          : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400'
          }`}>
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-widest leading-none">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Field group row ──────────────────────────────────────────────────────────

function FieldGroup({ group, formConfig, onToggle, onToggleGroup }) {
  const [open, setOpen] = useState(true);
  const GroupIcon = group.icon;
  const allOn = group.fields.every(f => formConfig[f.id]);
  const someOn = group.fields.some(f => formConfig[f.id]);

  return (
    <div className="border border-neutral-200 dark:border-neutral-700/60 rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <GroupIcon size={13} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
            {group.label}
          </span>
          {someOn && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gia-100 dark:bg-gia-900/40 text-gia-600 dark:text-gia-400">
              {group.fields.filter(f => formConfig[f.id]).length}/{group.fields.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={e => { e.stopPropagation(); onToggleGroup(group.fields, !allOn); }}
            className="text-[9px] font-black uppercase tracking-widest text-gia-600 dark:text-gia-400 hover:text-gia-700 dark:hover:text-gia-300 px-2 py-0.5 rounded-md hover:bg-gia-50 dark:hover:bg-gia-950/30 transition-colors"
          >
            {allOn ? 'None' : 'All'}
          </span>
          {open ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
        </div>
      </button>

      {/* Fields */}
      {open && (
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 bg-neutral-50/50 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-700/40">
          {group.fields.map(field => (
            <label key={field.id} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => onToggle(field.id)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${formConfig[field.id]
                  ? 'bg-gia-600 border-gia-600'
                  : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 group-hover:border-gia-400'
                  }`}
              >
                {formConfig[field.id] && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-[11px] font-semibold transition-colors leading-tight ${formConfig[field.id]
                ? 'text-neutral-800 dark:text-neutral-200'
                : 'text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-400'
                }`}>
                {field.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Session tag ──────────────────────────────────────────────────────────────

function SessionTag({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gia-50 dark:bg-gia-950/30 border border-gia-200/60 dark:border-gia-800/40 text-gia-700 dark:text-gia-300 rounded-lg text-[11px] font-bold">
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="text-gia-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        aria-label={`Remove ${name}`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventFormModal({ isOpen, isEditing, initialData, onSubmit, onClose }) {
  const [form, setForm] = useState(DEFAULT_EVENT);
  const [sessionInput, setSessionInput] = useState('');
  const [dateError, setDateError] = useState('');

  // Sync form state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setForm(isEditing && initialData ? { ...DEFAULT_EVENT, ...initialData } : { ...DEFAULT_EVENT });
    setSessionInput('');
    setDateError('');
  }, [isOpen, isEditing, initialData]);

  if (!isOpen) return null;

  // ── Helpers ──

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const validateDates = (start, end) => {
    if (start && end && end < start) {
      setDateError('End date cannot be before start date.');
    } else {
      setDateError('');
    }
  };

  const addSession = () => {
    const name = sessionInput.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const existing = [
      ...(form.hasPreReg ? ['Pre-Registration'] : []),
      ...form.sessions,
    ];
    if (existing.some(s => s.toLowerCase() === name.toLowerCase())) return;
    set('sessions', [...form.sessions, name]);
    setSessionInput('');
  };

  const removeSession = (idx) =>
    set('sessions', form.sessions.filter((_, i) => i !== idx));

  const toggleField = (id) =>
    set('formConfig', { ...form.formConfig, [id]: !form.formConfig[id] });

  const toggleGroup = (fields, on) => {
    const patch = {};
    fields.forEach(f => { patch[f.id] = on; });
    set('formConfig', { ...form.formConfig, ...patch });
  };

  const toggleAllFields = () => {
    const allOn = ALL_FIELD_IDS.every(id => form.formConfig[id]);
    const patch = {};
    ALL_FIELD_IDS.forEach(id => { patch[id] = !allOn; });
    set('formConfig', { ...form.formConfig, ...patch });
  };

  const allFieldsOn = ALL_FIELD_IDS.every(id => form.formConfig[id]);
  const enabledCount = ALL_FIELD_IDS.filter(id => form.formConfig[id]).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dateError) return;
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200/60 dark:border-neutral-700/60"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest leading-none">
              {isEditing ? 'Edit Event' : 'New GAD Event'}
            </h2>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
              {isEditing
                ? 'Update event details and configuration'
                : 'Configure event details, sessions, and registration form'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable form body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── SECTION 1: Event Identity ── */}
          <Section icon={Tag} title="Event Details" subtitle="Basic information about this GAD activity">

            {/* Title */}
            <div>
              <label className={labelCls}>Event Title <span className="text-rose-400">*</span></label>
              <input
                required
                className={inputCls}
                placeholder="e.g., Annual Gender Sensitivity Training"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            {/* Type + Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Event Type</label>
                <div className="relative">
                  <select
                    className={inputCls + ' appearance-none pr-8'}
                    value={form.eventType}
                    onChange={e => set('eventType', e.target.value)}
                  >
                    <option value="">Select type...</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mode</label>
                <div className="flex gap-1.5">
                  {EVENT_MODES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('mode', m)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.mode === m
                        ? 'bg-gia-600 text-white shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                      {m === 'In-person' ? 'In-person' : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className={labelCls}>
                <MapPin size={10} className="inline mr-1 mb-0.5" />
                {form.mode === 'Online' ? 'Platform / Link' : 'Venue'}
              </label>
              <input
                className={inputCls}
                placeholder={
                  form.mode === 'Online'
                    ? 'e.g., Zoom, Google Meet, MS Teams...'
                    : 'e.g., MSU-IIT AVR, College of Engineering...'
                }
                value={form.venue || ''}
                onChange={e => set('venue', e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className={inputCls + ' min-h-[72px] resize-none'}
                placeholder="Briefly explain the purpose of this GAD activity..."
                value={form.description || ''}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            {/* Dates + Target */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Start Date <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={form.startDate || ''}
                  onChange={e => {
                    set('startDate', e.target.value);
                    validateDates(e.target.value, form.endDate);
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>End Date <span className="text-rose-400">*</span></label>
                <input
                  type="date"
                  required
                  className={`${inputCls} ${dateError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20' : ''}`}
                  value={form.endDate || ''}
                  onChange={e => {
                    set('endDate', e.target.value);
                    validateDates(form.startDate, e.target.value);
                  }}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <Users size={10} className="inline mr-1 mb-0.5" />
                  Target Pax
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  placeholder="e.g. 100"
                  value={form.targetParticipants || ''}
                  onChange={e => set('targetParticipants', e.target.value)}
                />
              </div>
            </div>

            {/* Date error */}
            {dateError && (
              <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1.5">
                <Info size={11} /> {dateError}
              </p>
            )}

            {/* Status — only relevant when editing */}
            {isEditing && (
              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set('status', s.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.status === s.value
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── SECTION 2: Attendance Gates ── */}
          <Section icon={CalendarDays} title="Attendance Gates" subtitle="Define the sessions participants will sign in to" accent>

            {/* Pre-registration toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Pre-Registration Gate</p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
                  Generates a QR for advance sign-ups before the event day
                </p>
              </div>
              <button
                type="button"
                onClick={() => set('hasPreReg', !form.hasPreReg)}
                className="shrink-0 transition-colors"
                aria-label="Toggle pre-registration"
              >
                {form.hasPreReg
                  ? <ToggleRight size={28} className="text-gia-600 dark:text-gia-400" />
                  : <ToggleLeft size={28} className="text-neutral-300 dark:text-neutral-600" />
                }
              </button>
            </div>

            {/* Sessions list */}
            {form.sessions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.sessions.map((s, i) => (
                  <SessionTag key={i} name={s} onRemove={() => removeSession(i)} />
                ))}
              </div>
            )}

            {/* Add session input */}
            <div className="flex gap-2">
              <input
                type="text"
                className={inputCls + ' flex-1'}
                placeholder="e.g. Day 1 Attendance, Morning Session..."
                value={sessionInput}
                onChange={e => setSessionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addSession(); }
                }}
              />
              <button
                type="button"
                onClick={addSession}
                disabled={!sessionInput.trim()}
                className="px-3 py-2 bg-gia-600 hover:bg-gia-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Empty state hint */}
            {form.sessions.length === 0 && !form.hasPreReg && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <Info size={11} />
                Add at least one gate so participants have a session to sign in to.
              </p>
            )}
          </Section>

          {/* ── SECTION 3: Registration Form Fields ── */}
          <Section icon={ClipboardList} title="Registration Form Fields" subtitle="Sex/Gender is always collected. Choose additional fields for the participant form.">

            {/* Always-on notice */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gia-50 dark:bg-gia-950/20 border border-gia-200/60 dark:border-gia-800/40 rounded-xl">
              <div className="w-4 h-4 rounded border-2 bg-gia-600 border-gia-600 flex items-center justify-center shrink-0">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-gia-700 dark:text-gia-300">
                Full Name, Sex/Gender, and Timestamp are always collected automatically.
              </p>
            </div>

            {/* Select all / count */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                {enabledCount} of {ALL_FIELD_IDS.length} additional fields enabled
              </p>
              <button
                type="button"
                onClick={toggleAllFields}
                className="text-[10px] font-black uppercase tracking-widest text-gia-600 dark:text-gia-400 hover:text-gia-700 dark:hover:text-gia-300 px-2.5 py-1 rounded-lg hover:bg-gia-50 dark:hover:bg-gia-950/30 transition-colors"
              >
                {allFieldsOn ? 'Clear All' : 'Select All'}
              </button>
            </div>

            {/* Field groups */}
            <div className="space-y-2">
              {FIELD_GROUPS.map(group => (
                <FieldGroup
                  key={group.id}
                  group={group}
                  formConfig={form.formConfig}
                  onToggle={toggleField}
                  onToggleGroup={toggleGroup}
                />
              ))}
            </div>
          </Section>

          {/* ── SECTION 4: Speaker & Poster Information ── */}
          <Section icon={Mic} title="Speaker & Poster Information" subtitle="Add speaker details and event series name for poster generation">

            {/* Event Series Name */}
            <div>
              <label className={labelCls}>
                <Tag size={10} className="inline mr-1 mb-0.5" />
                Event Series Name
              </label>
              <input
                className={inputCls}
                placeholder="e.g., GRITalks, GAD Webinar Series..."
                value={form.eventSeriesName || ''}
                onChange={e => set('eventSeriesName', e.target.value)}
              />
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium mt-1">
                Optional: Appears at the top of the event poster
              </p>
            </div>

            {/* Speaker Name */}
            <div>
              <label className={labelCls}>
                <UserCircle size={10} className="inline mr-1 mb-0.5" />
                Speaker Name
              </label>
              <input
                className={inputCls}
                placeholder="e.g., Dr. Maria Santos, Luis-Enrique Becerra-Garcia, MPA..."
                value={form.speakerName || ''}
                onChange={e => set('speakerName', e.target.value)}
              />
            </div>

            {/* Speaker Title + Affiliation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Speaker Title / Position</label>
                <input
                  className={inputCls}
                  placeholder="e.g., Research Associate..."
                  value={form.speakerTitle || ''}
                  onChange={e => set('speakerTitle', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Speaker Affiliation</label>
                <input
                  className={inputCls}
                  placeholder="e.g., Indiana University..."
                  value={form.speakerAffiliation || ''}
                  onChange={e => set('speakerAffiliation', e.target.value)}
                />
              </div>
            </div>

            {/* Speaker Photo Upload */}
            <div>
              <label className={labelCls}>
                <ImageIcon size={10} className="inline mr-1 mb-0.5" />
                Speaker Photo
              </label>
              <div className="flex items-start gap-3">
                {/* Preview */}
                <div className="w-24 h-24 rounded-full border-2 border-gia-400 dark:border-gia-600 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  {form.speakerPhoto ? (
                    <img
                      src={form.speakerPhoto}
                      alt="Speaker"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle size={32} className="text-neutral-300 dark:text-neutral-600" />
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="speaker-photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          set('speakerPhoto', reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="speaker-photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors"
                  >
                    <Upload size={14} />
                    {form.speakerPhoto ? 'Change Photo' : 'Upload Photo'}
                  </label>
                  {form.speakerPhoto && (
                    <button
                      type="button"
                      onClick={() => set('speakerPhoto', null)}
                      className="ml-2 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium mt-1.5">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Link */}
            <div>
              <label className={labelCls}>Registration Link (for QR Code)</label>
              <input
                type="url"
                className={inputCls}
                placeholder="e.g., https://bit.ly/GRITalksGPS or your event registration URL..."
                value={form.registrationLink || ''}
                onChange={e => set('registrationLink', e.target.value)}
              />
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium mt-1">
                This link will be encoded in the QR code on the poster
              </p>
            </div>
          </Section>

          {/* ── SECTION 5: GAD Planning & Reporting ── */}
          <Section icon={BookOpen} title="GAD Planning & Reporting" subtitle="Organizer, budget, mandate, and post-event notes for accomplishment reporting">

            {/* Organizer + Target Group */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  <UserCircle size={10} className="inline mr-1 mb-0.5" />
                  Organizer / Facilitator
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g., GAD Office, Dr. Santos..."
                  value={form.organizer || ''}
                  onChange={e => set('organizer', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <Target size={10} className="inline mr-1 mb-0.5" />
                  Target Group
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g., All Faculty, Female Students..."
                  value={form.targetGroup || ''}
                  onChange={e => set('targetGroup', e.target.value)}
                />
              </div>
            </div>

            {/* Budget + Funding Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  <Wallet size={10} className="inline mr-1 mb-0.5" />
                  Budget (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="e.g. 50000"
                  value={form.budget || ''}
                  onChange={e => set('budget', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <Building size={10} className="inline mr-1 mb-0.5" />
                  Funding Source
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g., GAD Fund, University Fund..."
                  value={form.fundingSource || ''}
                  onChange={e => set('fundingSource', e.target.value)}
                />
              </div>
            </div>

            {/* Partner Agencies */}
            <div>
              <label className={labelCls}>
                <Building size={10} className="inline mr-1 mb-0.5" />
                Partner Agencies / Co-organizers
              </label>
              <input
                className={inputCls}
                placeholder="e.g., CHED, PCW, LGU Iligan, DSWD..."
                value={form.partnerAgencies || ''}
                onChange={e => set('partnerAgencies', e.target.value)}
              />
            </div>

            {/* GAD Mandate */}
            <div>
              <label className={labelCls}>
                <FileCheck size={10} className="inline mr-1 mb-0.5" />
                GAD Mandate / Legal Basis
              </label>
              <input
                className={inputCls}
                placeholder="e.g., RA 9710 (Magna Carta of Women), PCW-DILG-DBM-NEDA JC 2012-01..."
                value={form.gadMandate || ''}
                onChange={e => set('gadMandate', e.target.value)}
              />
            </div>

            {/* Objectives */}
            <div>
              <label className={labelCls}>
                <Target size={10} className="inline mr-1 mb-0.5" />
                Objectives / Expected Output
              </label>
              <textarea
                className={inputCls + ' min-h-[64px] resize-none'}
                placeholder="What should this event produce or achieve?..."
                value={form.objectives || ''}
                onChange={e => set('objectives', e.target.value)}
              />
            </div>

            {/* Accomplishment Notes — most relevant after event is done */}
            <div>
              <label className={labelCls}>
                <StickyNote size={10} className="inline mr-1 mb-0.5" />
                Accomplishment Notes
                <span className="ml-1.5 text-neutral-400 dark:text-neutral-600 normal-case tracking-normal font-medium">
                  (fill after event)
                </span>
              </label>
              <textarea
                className={inputCls + ' min-h-[72px] resize-none'}
                placeholder="Summarize what was accomplished, any deviations from plan, key outcomes..."
                value={form.accomplishmentNotes || ''}
                onChange={e => set('accomplishmentNotes', e.target.value)}
              />
            </div>

          </Section>

        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex items-center justify-between gap-3">
          {/* Summary pill */}
          <div className="flex items-center gap-3 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {form.hasPreReg ? form.sessions.length + 1 : form.sessions.length} gate{(form.hasPreReg ? form.sessions.length + 1 : form.sessions.length) !== 1 ? 's' : ''}
            </span>
            <span className="text-neutral-200 dark:text-neutral-700">·</span>
            <span className="flex items-center gap-1">
              <ClipboardList size={11} />
              {enabledCount + 2} fields {/* +2 for fullName + sex */}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="event-form"
              disabled={!!dateError}
              onClick={handleSubmit}
              className="px-5 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-gia-600 dark:hover:bg-gia-500 disabled:opacity-40 text-white dark:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
            >
              {isEditing ? <><ClipboardList size={13} /> Save Changes</> : <><Plus size={13} /> Launch Event</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
