import { MessageCircle, BarChart3, ShieldCheck, Zap, Info, ArrowRight, CalendarDays } from 'lucide-react';
import giaLogo from '../assets/GIA Logo.svg';

export default function HomePage({ onGoToDashboard, onNewChat }) {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">

      {/* ── Hero + Cards (fills full viewport) ── */}
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between gap-8">

      <section className="relative pt-12 pb-8">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-gia-100/40 dark:bg-gia-900/20 rounded-full blur-[100px]" />
        </div>

        <div className="flex items-center justify-between gap-8">
          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gia-50 dark:bg-gia-950/60 border border-gia-200 dark:border-gia-800/60 text-gia-600 dark:text-gia-400 mb-7">
              <Zap size={13} />
              <span className="text-p4-xs font-black uppercase tracking-widest">GIA · Smart Information Assistant</span>
            </div>

            <h1 className="font-montserrat text-p4-4xl font-bold tracking-tight leading-tight mb-5">
              <span className="text-neutral-900 dark:text-neutral-100">Gender and<br />
              Development Center<br /></span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-gia-500 to-gia-700">
                Information Assistant
              </span>
            </h1>

            <p className="text-p4-base text-neutral-500 dark:text-neutral-400 max-w-lg font-medium leading-relaxed">
              Your intelligent assistant for accessing and analyzing{' '}
              <span className="text-neutral-800 dark:text-neutral-200 font-semibold">sex-disaggregated data</span>{' '}
              at MSU-IIT with institutional precision.
            </p>
          </div>

          {/* Right: GIA logotype */}
          <div className="shrink-0 flex items-center select-none">
            <div
              className="w-24 h-24 shrink-0"
              style={{
                background: 'linear-gradient(to bottom, #9d35d9, #7318a8)',
                WebkitMaskImage: `url(${giaLogo})`,
                maskImage: `url(${giaLogo})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
            <span className="font-montserrat text-[6rem] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-gia-500 to-gia-700 -ml-2">
              IA
            </span>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <div className="grid md:grid-cols-3 gap-5">
        <FeatureCard
          icon={<Info size={20} className="text-gia-600 dark:text-gia-400" />}
          title="About GADC"
          description="Explore the mission, vision, and gender-responsive initiatives of MSU-IIT."
          href="https://www.msuiit.edu.ph/offices/gad/index.php"
        />
        <FeatureCard
          icon={<BarChart3 size={20} className="text-gia-600 dark:text-gia-400" />}
          title="Data Analytics"
          description="Access comprehensive SDD visual reports and real-time population metrics."
          onClick={onGoToDashboard}
        />
        <FeatureCard
          icon={<MessageCircle size={20} className="text-gia-600 dark:text-gia-400" />}
          title="AI Assistant"
          description="Chat with GIA for instant data queries and intelligent analysis."
          onClick={onNewChat}
        />
      </div>

      </div>{/* ── end min-h wrapper ── */}

      {/* ── About Section ── */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-10 md:p-14 shadow-sm border border-neutral-100 dark:border-neutral-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gia-50/60 dark:bg-gia-900/20 rounded-full blur-3xl -z-0 pointer-events-none translate-x-1/4 -translate-y-1/4" />

        <div className="relative space-y-10">

          {/* What is GIA */}
          <div className="space-y-4">
            <div>
              <h2 className="font-montserrat text-p4-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
                <em>Who</em> is GIA?
              </h2>
              <div className="w-12 h-1 bg-gia-600 rounded-full mt-3" />
            </div>
            <p className="text-p4-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
              <span className="text-neutral-900 dark:text-neutral-100 font-semibold">GIA (GADC Information Assistant)</span>{' '}
              is an AI-powered data intelligence tool built for the Gender and Development Center of MSU-IIT. GIA is designed to help administrators, researchers, and staff quickly access, explore, and understand institutional data — without needing to manually sift through spreadsheets or reports. Simply ask a question and GIA will analyze the data and respond with clear, descriptive insights.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* How it works */}
            <div className="bg-gia-50 dark:bg-gia-900/30 border border-gia-100 dark:border-gia-800/40 rounded-2xl p-6 space-y-3">
              <h3 className="font-montserrat text-p4-sm font-bold text-gia-600 dark:text-gia-400 uppercase tracking-widest">How It Works</h3>
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
                    <ShieldCheck size={15} className="text-gia-600 dark:text-gia-400 shrink-0 mt-0.5" />
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
          { icon: <CalendarDays size={18} />, label: 'Events & Attendance' },
          { icon: <BarChart3 size={18} />,    label: 'SDD Analytics' },
          { icon: <MessageCircle size={18} />, label: 'AI-Powered Chat' },
          { icon: <ShieldCheck size={18} />,  label: 'GAD Compliance' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700/50 rounded-2xl px-5 py-4 shadow-sm"
          >
            <span className="text-gia-600 dark:text-gia-400 shrink-0">{icon}</span>
            <span className="text-p4-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, href, onClick }) {
  const inner = (
    <div className="group bg-white dark:bg-neutral-900 rounded-2xl p-7 border border-neutral-100 dark:border-neutral-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative">
      <div className="p-2.5 bg-gia-50 dark:bg-gia-950/50 rounded-xl w-fit mb-5 group-hover:bg-gia-100 dark:group-hover:bg-gia-900/60 transition-colors">
        {icon}
      </div>
      <h3 className="font-montserrat text-p4-sm font-black text-neutral-900 dark:text-neutral-100 tracking-wider uppercase mb-2">
        {title}
      </h3>
      <p className="text-p4-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex items-center gap-1.5 text-p4-xs font-black uppercase tracking-widest text-gia-600 dark:text-gia-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore <ArrowRight size={13} />
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
  if (onClick) return <button className="text-left w-full" onClick={onClick}>{inner}</button>;
  return inner;
}
