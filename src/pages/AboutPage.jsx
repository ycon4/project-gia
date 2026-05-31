import { MessageCircle, BarChart3, ShieldCheck, Info, ArrowRight, CalendarDays } from 'lucide-react';
import giaLogoColored from '../assets/GIA Logo - Colored.svg';

const LILAC = '#741112';
const LILAC_LIGHT = '#b07ade';
const LILAC_DARK = '#7350a8';
const LILAC_BG = '#f9f5fd';
const LILAC_BORDER = '#dfc2f3';
const LOGO_GRADIENT = 'linear-gradient(to right, #741112, #DD6E6B, #A5DF6A, #73DAE1)';

export default function AboutPage({ onGoToDashboard, onNewChat, onGoToEvents }) {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">

      {/* ── Hero + Cards (fills full viewport) ── */}
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between gap-8">

        <section className="relative pt-12 pb-8">
          <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[300px] rounded-full blur-[100px]" style={{ backgroundColor: `${LILAC_LIGHT}28` }} />
          </div>

          <div className="flex items-center justify-between gap-8">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <h1 className="font-montserrat text-p4-4xl font-bold tracking-tight leading-tight mb-5">
                <span className="text-neutral-900 dark:text-neutral-100">Gender and<br />
                  Development Center<br /></span>
                <span style={{ color: '#7c2529' }}>Information</span>
                {' '}
                <span style={{ color: '#d4af37' }}>Assistant</span>
              </h1>

              <p className="text-p4-base text-neutral-500 dark:text-neutral-400 max-w-lg font-medium leading-relaxed">
                Your intelligent assistant for accessing and analyzing{' '}
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">sex-disaggregated data</span>{' '}
                at MSU-IIT with institutional precision.
              </p>
            </div>

            {/* Right: GIA logotype */}
            <div className="shrink-0 flex flex-col items-center gap-3 select-none">
              <div className="flex items-center">
                <img
                  src={giaLogoColored}
                  alt="GIA Logo"
                  className="w-24 h-24 shrink-0 -translate-y-1"
                />
                <span
                  className="font-montserrat text-p4-4xl font-bold leading-none -ml-2 text-neutral-900 dark:text-neutral-100 self-center"
                >
                  Gia
                </span>
              </div>
              <div className="flex items-center gap-2">
                {['#741112', '#d4af37'].map(color => (
                  <div key={color} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Info size={20} color={LILAC} />}
            title="About GADC"
            description="Explore the mission, vision, and gender-responsive initiatives of MSU-IIT."
            href="https://www.msuiit.edu.ph/offices/gad/index.php"
          />
          <FeatureCard
            icon={<BarChart3 size={20} color={LILAC} />}
            title="Data Analytics"
            description="Access comprehensive SDD visual reports and real-time population metrics."
            onClick={onGoToDashboard}
          />
          <FeatureCard
            icon={<MessageCircle size={20} color={LILAC} />}
            title="AI Assistant"
            description="Chat with GIA for instant data queries and intelligent analysis."
            onClick={onNewChat}
          />
        </div>

      </div>{/* ── end min-h wrapper ── */}

      {/* ── About Section ── */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-10 md:p-14 shadow-sm border border-neutral-100 dark:border-neutral-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-0 pointer-events-none translate-x-1/4 -translate-y-1/4 bg-[#faf8fd]/60 dark:bg-[#4f366c]/20" />

        <div className="relative space-y-10">

          {/* What is GIA */}
          <div className="space-y-4">
            <div>
              <h2 className="font-montserrat text-p4-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
                <em>Who</em> is GIA?
              </h2>
              <div className="w-12 h-1 rounded-full mt-3" style={{ background: 'linear-gradient(to right, #741112, #DD6E6B, #A5DF6A, #73DAE1)' }} />
            </div>
            <p className="text-p4-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
              <span className="text-neutral-900 dark:text-neutral-100 font-semibold">GIA (GADC Information Assistant)</span>{' '}
              is an AI-powered data intelligence tool built for the Gender and Development Center of MSU-IIT. GIA is designed to help administrators, researchers, and staff quickly access, explore, and understand institutional data — without needing to manually sift through spreadsheets or reports. Simply ask a question and GIA will analyze the data and respond with clear, descriptive insights.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* How it works */}
            <div className="rounded-2xl p-6 space-y-3 bg-[#faf8fd] dark:bg-[#4f366c]/20 border border-[#e5d8f3] dark:border-[#4f366c]/40">
              <h3 className="font-montserrat text-p4-sm font-bold uppercase tracking-widest" style={{ color: LILAC }}>How It Works</h3>
              <p className="text-p4-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
                GIA connects directly to the GADC's institutional database and uses a large language model to interpret your natural language queries. It reads real data from multiple collections — enrollment, engagement, employees, attendance, and events — and returns descriptive analysis, summaries, comparisons, and visualizations in real time.
              </p>
            </div>

            {/* What GIA can analyze */}
            <div className="space-y-3">
              <h3 className="font-montserrat text-p4-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">What GIA Can Analyze</h3>
              <ul className="space-y-2">
                {[
                  'Student enrollment trends broken down by sex, program, and year level.',
                  'Student engagement records including participation and activity involvement.',
                  'Employee and faculty data with gender-disaggregated breakdowns.',
                  'Event attendance logs across sessions and beneficiary groups.',
                  'Descriptive statistics, comparisons, and population summaries.',
                  'Cross-collection queries that span multiple data sources at once.',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-p4-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
                    <ShieldCheck size={15} color={LILAC} className="shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-4">
            <h3 className="font-montserrat text-p4-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Capabilities</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: 'Natural Language Queries', desc: 'Ask questions in plain English — no filters, no SQL, no technical setup.' },
                { title: 'Descriptive Analytics', desc: 'Get counts, totals, averages, and distributions explained clearly in text.' },
                { title: 'Sex-Disaggregated Insights', desc: 'Automatically surfaces male/female breakdowns across all data collections.' },
                { title: 'Chart Generation', desc: 'GIA renders visual charts when a question is best answered graphically.' },
                { title: 'Multi-Collection Queries', desc: 'Cross-reference enrollment, employees, attendance, and events in one query.' },
                { title: 'Conversation Memory', desc: 'GIA remembers context within a session for follow-up questions.' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50 rounded-xl p-4 space-y-1">
                  <p className="text-p4-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">{title}</p>
                  <p className="text-p4-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Capabilities Strip ── */}
      <section className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: <CalendarDays size={18} color={LILAC} />, label: 'Events & Attendance', onClick: onGoToEvents },
          { icon: <BarChart3 size={18} color={LILAC} />, label: 'SDD Analytics', onClick: onGoToDashboard },
          { icon: <MessageCircle size={18} color={LILAC} />, label: 'AI-Powered Chat', onClick: onNewChat },
          { icon: <ShieldCheck size={18} color={LILAC} />, label: 'GAD Events', onClick: onGoToEvents },
        ].map(({ icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700/50 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#741112]/30 transition-all duration-200 text-left w-full cursor-pointer"
          >
            <span className="shrink-0">{icon}</span>
            <span className="text-p4-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, href, onClick }) {
  const inner = (
    <div className="group bg-white dark:bg-neutral-900 rounded-2xl p-7 border border-neutral-100 dark:border-neutral-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative">
      <div className="p-2.5 rounded-xl w-fit mb-5 transition-colors bg-[#faf8fd] dark:bg-[#4f366c]/30">
        {icon}
      </div>
      <h3 className="font-montserrat text-p4-sm font-black text-neutral-900 dark:text-neutral-100 tracking-wider uppercase mb-2">
        {title}
      </h3>
      <p className="text-p4-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
        {description}
      </p>
      <div
        className="mt-5 flex items-center gap-1.5 text-p4-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ color: LILAC }}
      >
        Explore <ArrowRight size={13} />
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
  if (onClick) return <button className="text-left w-full" onClick={onClick}>{inner}</button>;
  return inner;
}
