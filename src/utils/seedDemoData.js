import { collection, addDoc, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ts = (dateStr, hour = 9, minOffset = 0) => {
  const d = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minOffset).padStart(2, '0')}:00`);
  return Timestamp.fromDate(d);
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const COLLEGES = [
  'College of Computer Studies (CCS)',
  'College of Engineering (COE)',
  'College of Arts and Social Sciences (CASS)',
  'College of Science and Mathematics (CSM)',
  'College of Medicine (CMED)',
  'College of Science and Technology (CST)',
  'Office of the University President',
  'Administrative Services',
];

const FEMALE_NAMES = [
  'Maria Santos', 'Ana Reyes', 'Liza Dela Cruz', 'Patricia Villanueva', 'Kristine Bautista',
  'Angelica Mendoza', 'Josephine Flores', 'Carmela Torres', 'Rosario Aquino', 'Melanie Garcia',
  'Cherryl Navarro', 'Diana Ramos', 'Gemma Castillo', 'Rowena Morales', 'Aileen Salazar',
  'Lovely Pascual', 'Joanna Magno', 'Veronica Llanes', 'Maricel Buenaventura', 'Tricia Domingo',
  'Sheila Gonzales', 'Rhea Cabrera', 'Nica Escano', 'Fatima Macapagal', 'Glaiza Padilla',
];

const MALE_NAMES = [
  'Juan dela Cruz', 'Miguel Santos', 'Carlo Reyes', 'Ramon Bautista', 'Marco Villanueva',
  'Aldrin Flores', 'Jerome Mendoza', 'Patrick Torres', 'Rodel Aquino', 'Vincent Garcia',
  'Jomar Navarro', 'Christian Ramos', 'Aldous Castillo', 'Renato Morales', 'Gilbert Salazar',
  'Rodrigo Pascual', 'Dennis Magno', 'Francis Llanes', 'Ernesto Buenaventura', 'Leo Domingo',
];

const SECTORS = ['Student', 'Student', 'Student', 'Faculty', 'Faculty', 'Staff', 'Other Beneficiaries'];
const EMP_STATUS = ['Employed', 'Employed', 'Employed', 'Unemployed', 'Self-Employed'];
const ETHNIC = ['Tagalog', 'Ilocano', 'Cebuano', 'Maranao', 'Bisaya', 'Kapampangan', 'Ibanag'];

function makeParticipant(eventId, session_name, sex, date, index) {
  const names = sex === 'Female' ? FEMALE_NAMES : MALE_NAMES;
  const name = names[index % names.length];
  const sector = pick(SECTORS);
  const college = pick(COLLEGES);
  const age = sector === 'Student' ? String(18 + (index % 8)) : String(28 + (index % 30));
  const pwd = index % 9 === 0 ? 'Yes' : 'No';
  const hour = 8 + (index % 3);
  const mins = (index * 7) % 60;

  return {
    eventId,
    session_name,
    fullName: name,
    sex,
    age,
    email: `${name.split(' ')[0].toLowerCase()}${index}@msuiit.edu.ph`,
    phone: `09${String(100000000 + index * 997).slice(0, 9)}`,
    office_college: college,
    department: 'General',
    designation: sector === 'Student' ? 'Student' : sector === 'Faculty' ? 'Faculty Member' : 'Staff',
    sector,
    pwd_status: pwd,
    ethnic_group: pick(ETHNIC),
    employment_status: sector === 'Student' ? 'Unemployed' : pick(EMP_STATUS),
    year_level: sector === 'Student' ? String(1 + (index % 4)) : '',
    id_number: `2025-${String(10000 + index * 13).slice(0, 5)}`,
    home_address: `Iligan City, Lanao del Norte`,
    emergency_contact: `09${String(100000000 + index * 443).slice(0, 9)}`,
    createdAt: ts(date, hour, mins),
  };
}

// ── Sample Events ─────────────────────────────────────────────────────────────
const EVENTS = [
  {
    title: 'Gender Sensitivity Training 2025',
    description: 'A two-day training on gender sensitivity, GAD concepts, and mainstreaming strategies for MSU-IIT faculty and staff.',
    status: 'Done',
    startDate: '2025-01-15',
    targetParticipants: 40,
    hasPreReg: true,
    sessions: ['Day 1 Attendance', 'Day 2 Attendance'],
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true, age: true },
    participants: [
      // Day 1 — 10 Female, 5 Male
      ...Array.from({ length: 10 }, (_, i) => ({ sex: 'Female', session: 'Day 1 Attendance', date: '2025-01-15', idx: i })),
      ...Array.from({ length: 5 }, (_, i) => ({ sex: 'Male', session: 'Day 1 Attendance', date: '2025-01-15', idx: i + 10 })),
      // Day 2 — 7 Female, 4 Male
      ...Array.from({ length: 7 }, (_, i) => ({ sex: 'Female', session: 'Day 2 Attendance', date: '2025-01-16', idx: i + 15 })),
      ...Array.from({ length: 4 }, (_, i) => ({ sex: 'Male', session: 'Day 2 Attendance', date: '2025-01-16', idx: i + 22 })),
      // Pre-reg — 5 Female, 3 Male
      ...Array.from({ length: 5 }, (_, i) => ({ sex: 'Female', session: 'Pre-Registration', date: '2025-01-14', idx: i + 26 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sex: 'Male', session: 'Pre-Registration', date: '2025-01-14', idx: i + 31 })),
    ],
  },
  {
    title: "Women's Month Symposium 2025",
    description: 'A symposium celebrating Women\'s Month with panel discussions on gender equality, women in leadership, and inclusive development.',
    status: 'Done',
    startDate: '2025-03-08',
    targetParticipants: 60,
    hasPreReg: true,
    sessions: ['Morning Session', 'Afternoon Session'],
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true, age: true },
    participants: [
      // Morning — 14 Female, 5 Male
      ...Array.from({ length: 14 }, (_, i) => ({ sex: 'Female', session: 'Morning Session', date: '2025-03-08', idx: i })),
      ...Array.from({ length: 5 }, (_, i) => ({ sex: 'Male', session: 'Morning Session', date: '2025-03-08', idx: i + 14 })),
      // Afternoon — 10 Female, 4 Male
      ...Array.from({ length: 10 }, (_, i) => ({ sex: 'Female', session: 'Afternoon Session', date: '2025-03-08', idx: i + 19 })),
      ...Array.from({ length: 4 }, (_, i) => ({ sex: 'Male', session: 'Afternoon Session', date: '2025-03-08', idx: i + 29 })),
      // Pre-reg — 8 Female, 3 Male
      ...Array.from({ length: 8 }, (_, i) => ({ sex: 'Female', session: 'Pre-Registration', date: '2025-03-07', idx: i + 33 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sex: 'Male', session: 'Pre-Registration', date: '2025-03-07', idx: i + 41 })),
    ],
  },
  {
    title: 'GAD Capability Building Workshop',
    description: 'A three-day capability building workshop for GAD focal point persons, covering gender analysis, GAD planning, and budgeting.',
    status: 'Done',
    startDate: '2025-06-20',
    targetParticipants: 50,
    hasPreReg: true,
    sessions: ['Day 1 Attendance', 'Day 2 Attendance', 'Day 3 Attendance'],
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true, age: true },
    participants: [
      // Day 1 — 8 Female, 6 Male
      ...Array.from({ length: 8 }, (_, i) => ({ sex: 'Female', session: 'Day 1 Attendance', date: '2025-06-20', idx: i })),
      ...Array.from({ length: 6 }, (_, i) => ({ sex: 'Male', session: 'Day 1 Attendance', date: '2025-06-20', idx: i + 8 })),
      // Day 2 — 7 Female, 4 Male
      ...Array.from({ length: 7 }, (_, i) => ({ sex: 'Female', session: 'Day 2 Attendance', date: '2025-06-21', idx: i + 14 })),
      ...Array.from({ length: 4 }, (_, i) => ({ sex: 'Male', session: 'Day 2 Attendance', date: '2025-06-21', idx: i + 21 })),
      // Day 3 — 6 Female, 3 Male
      ...Array.from({ length: 6 }, (_, i) => ({ sex: 'Female', session: 'Day 3 Attendance', date: '2025-06-22', idx: i + 25 })),
      ...Array.from({ length: 3 }, (_, i) => ({ sex: 'Male', session: 'Day 3 Attendance', date: '2025-06-22', idx: i + 31 })),
      // Pre-reg — 5 Female, 2 Male
      ...Array.from({ length: 5 }, (_, i) => ({ sex: 'Female', session: 'Pre-Registration', date: '2025-06-19', idx: i + 34 })),
      ...Array.from({ length: 2 }, (_, i) => ({ sex: 'Male', session: 'Pre-Registration', date: '2025-06-19', idx: i + 39 })),
    ],
  },
  {
    title: 'Anti-Sexual Harassment Seminar',
    description: 'A half-day seminar raising awareness on Republic Act 7877 and the university\'s policies on preventing sexual harassment in the workplace and academe.',
    status: 'Done',
    startDate: '2025-09-10',
    targetParticipants: 80,
    hasPreReg: true,
    sessions: ['Morning Session'],
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true, age: true },
    participants: [
      // Morning — 22 Female, 14 Male
      ...Array.from({ length: 22 }, (_, i) => ({ sex: 'Female', session: 'Morning Session', date: '2025-09-10', idx: i })),
      ...Array.from({ length: 14 }, (_, i) => ({ sex: 'Male', session: 'Morning Session', date: '2025-09-10', idx: i + 22 })),
      // Pre-reg — 10 Female, 6 Male
      ...Array.from({ length: 10 }, (_, i) => ({ sex: 'Female', session: 'Pre-Registration', date: '2025-09-09', idx: i + 36 })),
      ...Array.from({ length: 6 }, (_, i) => ({ sex: 'Male', session: 'Pre-Registration', date: '2025-09-09', idx: i + 46 })),
    ],
  },
  {
    title: 'GAD Planning and Budgeting Forum 2026',
    description: 'An annual forum for college-level GAD focal points to review accomplishments, align plans with national frameworks, and finalize the GAD budget proposal for 2026.',
    status: 'Active',
    startDate: '2026-02-12',
    targetParticipants: 45,
    hasPreReg: true,
    sessions: ['Day 1 Attendance', 'Day 2 Attendance'],
    formConfig: { sex: true, office_college: true, pwd_status: true, sector: true, age: true },
    participants: [
      // Day 1 — 12 Female, 7 Male
      ...Array.from({ length: 12 }, (_, i) => ({ sex: 'Female', session: 'Day 1 Attendance', date: '2026-02-12', idx: i })),
      ...Array.from({ length: 7 }, (_, i) => ({ sex: 'Male', session: 'Day 1 Attendance', date: '2026-02-12', idx: i + 12 })),
      // Day 2 — 10 Female, 5 Male
      ...Array.from({ length: 10 }, (_, i) => ({ sex: 'Female', session: 'Day 2 Attendance', date: '2026-02-13', idx: i + 19 })),
      ...Array.from({ length: 5 }, (_, i) => ({ sex: 'Male', session: 'Day 2 Attendance', date: '2026-02-13', idx: i + 29 })),
      // Pre-reg — 7 Female, 4 Male
      ...Array.from({ length: 7 }, (_, i) => ({ sex: 'Female', session: 'Pre-Registration', date: '2026-02-11', idx: i + 34 })),
      ...Array.from({ length: 4 }, (_, i) => ({ sex: 'Male', session: 'Pre-Registration', date: '2026-02-11', idx: i + 41 })),
    ],
  },
];

// ── Main seed function ────────────────────────────────────────────────────────
export async function seedDemoData(onProgress) {
  const log = onProgress || console.log;
  log('Starting seed…');

  for (const evDef of EVENTS) {
    const { participants, ...eventData } = evDef;

    // 1. Create the event
    log(`Creating event: ${eventData.title}`);
    const evRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: Timestamp.fromDate(new Date(eventData.startDate)),
    });
    const eventId = evRef.id;

    // 2. Batch-write attendance in groups of 400
    const records = participants.map(p =>
      makeParticipant(eventId, p.session, p.sex, p.date, p.idx)
    );
    const CHUNK = 400;
    for (let i = 0; i < records.length; i += CHUNK) {
      const batch = writeBatch(db);
      records.slice(i, i + CHUNK).forEach(r => {
        batch.set(doc(collection(db, 'attendance')), r);
      });
      await batch.commit();
    }
    log(`  ✓ ${records.length} attendance records written`);
  }

  log('Done! All demo data seeded.');
}
