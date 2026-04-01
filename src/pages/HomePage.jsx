import { MessageCircle, BarChart3, ShieldCheck, Zap, Info, ArrowRight, CalendarDays } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">

      {/* ── Hero ── */}
      <section className="relative text-center pt-12 pb-8">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gia-100/40 dark:bg-gia-900/20 rounded-full blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gia-50 dark:bg-gia-950/60 border border-gia-200 dark:border-gia-800/60 text-gia-600 dark:text-gia-400 mb-8">
          <Zap size={13} />
          <span className="text-p4-xs font-black uppercase tracking-widest">GIA · Smart Information Assistant</span>
        </div>

        <h1 className="text-p4-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-5">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gia-600 to-gia-400">
            GIA
          </span>
        </h1>

        <p className="text-p4-xl font-bold text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-snug mb-4">
          Gender and Development Center<br />Information Assistant
        </p>

        <p className="text-p4-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Your intelligent assistant for accessing and analyzing{' '}
          <span className="text-slate-800 dark:text-slate-200 font-semibold">sex-disaggregated data</span>{' '}
          at MSU-IIT with institutional precision.
        </p>
      </section>

      {/* ── Feature Cards ── */}
      <div className="grid md:grid-cols-3 gap-5">
        <FeatureCard
          icon={<Info size={20} className="text-gia-600 dark:text-gia-400" />}
          title="About GADC"
          description="Explore the mission, vision, and gender-responsive initiatives of MSU-IIT."
        />
        <FeatureCard
          icon={<BarChart3 size={20} className="text-gia-600 dark:text-gia-400" />}
          title="Data Analytics"
          description="Access comprehensive SDD visual reports and real-time population metrics."
        />
        <FeatureCard
          icon={<MessageCircle size={20} className="text-gia-600 dark:text-gia-400" />}
          title="AI Assistant"
          description="Chat with GIA for instant data queries and intelligent analysis."
        />
      </div>

      {/* ── About Section ── */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-10 md:p-14 shadow-sm border border-slate-100 dark:border-neutral-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gia-50/60 dark:bg-gia-900/20 rounded-full blur-3xl -z-0 pointer-events-none translate-x-1/4 -translate-y-1/4" />

        <div className="relative grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="text-p4-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
                Promoting Equality<br />At MSU-IIT
              </h2>
              <div className="w-12 h-1 bg-gia-600 rounded-full mt-4" />
            </div>

            <div className="space-y-4 text-p4-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              <p>
                The{' '}
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                  Gender and Development Center (GADC)
                </span>{' '}
                was established to promote gender equality within the institution and its surrounding communities.
              </p>
              <p>
                Guided by Republic Act 7192, the GADC integrates sex-disaggregated considerations into instruction, research, and extension activities.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {[
                'Institutional Compliance Monitoring',
                'Inclusive Governance Planning',
                'Sex-Disaggregated Data Management',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-p4-sm font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={17} className="text-gia-600 dark:text-gia-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gia-50 dark:bg-gia-900/30 border border-gia-100 dark:border-gia-800/40 rounded-2xl p-8 space-y-4">
            <div className="text-p4-xs font-black text-gia-400 dark:text-gia-500 uppercase tracking-widest">
              Institutional Hub
            </div>
            <blockquote className="text-p4-base italic text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-l-4 border-gia-300 dark:border-gia-700 pl-5">
              "The Center serves as a hub for monitoring, evaluating, and reporting on
              institutional gender initiatives, ensuring compliance with national policies
              and contributing to academic planning."
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Capabilities Strip ── */}
      <section className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: <CalendarDays size={18} />, label: 'Events & Attendance' },
          { icon: <BarChart3 size={18} />,   label: 'SDD Analytics' },
          { icon: <MessageCircle size={18} />, label: 'AI-Powered Chat' },
          { icon: <ShieldCheck size={18} />, label: 'GAD Compliance' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-700/50 rounded-2xl px-5 py-4 shadow-sm"
          >
            <span className="text-gia-600 dark:text-gia-400 shrink-0">{icon}</span>
            <span className="text-p4-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group bg-white dark:bg-neutral-900 rounded-2xl p-7 border border-slate-100 dark:border-neutral-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative">
      <div className="p-2.5 bg-gia-50 dark:bg-gia-950/50 rounded-xl w-fit mb-5 group-hover:bg-gia-100 dark:group-hover:bg-gia-900/60 transition-colors">
        {icon}
      </div>
      <h3 className="text-p4-sm font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase mb-2">
        {title}
      </h3>
      <p className="text-p4-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex items-center gap-1.5 text-p4-xs font-black uppercase tracking-widest text-gia-600 dark:text-gia-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Explore <ArrowRight size={13} />
      </div>
    </div>
  );
}
