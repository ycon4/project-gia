import { MessageCircle, BarChart3, Home, ShieldCheck, Zap, Info, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-20 animate-in fade-in duration-700">
      
      {/* --- HERO SECTION --- */}
      <section className="relative text-center pt-10 pb-12">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-200 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-6">
          <Zap size={14} /> GIA: Smart Information Assistant
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">GIA</span>
        </h1>
        
        <p className="text-xl md:text-2xl font-bold text-slate-700 max-w-2xl mx-auto leading-tight mb-8">
          Gender and Development Center Information Assistant
        </p>
        
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
          Your intelligent assistant for accessing and analyzing 
          <span className="text-slate-900 font-bold"> sex-disaggregated data</span> at MSU-IIT with institutional precision.
        </p>
      </section>

      {/* --- QUICK ACTIONS GRID --- */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Info className="text-blue-600" />} 
          title="About GADC" 
          description="Explore the mission, vision, and gender-responsive initiatives of MSU-IIT."
        />
        <FeatureCard 
          icon={<BarChart3 className="text-purple-600" />} 
          title="Data Analytics" 
          description="Access comprehensive SDD visual reports and real-time population metrics."
        />
        <FeatureCard 
          icon={<MessageCircle className="text-emerald-600" />} 
          title="AI Assistant" 
          description="Chat with GIA for instant data queries and intelligent analysis."
        />
      </div>

      {/* --- ABOUT SECTION (BENTO STYLE) --- */}
      <section className="bg-white rounded-[40px] p-8 md:p-16 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Promoting Equality <br/>At MSU-IIT
            </h2>
            <div className="w-16 h-1.5 bg-purple-600 rounded-full" />
            
            <div className="space-y-4 text-slate-600 text-base font-medium leading-relaxed">
              <p>
                The <span className="text-slate-900 font-bold">Gender and Development Center (GADC)</span> was established to promote gender equality within the institution and its surrounding communities.
              </p>
              <p>
                Guided by Republic Act 7192, the GADC integrates sex-disaggregated considerations into instruction, research, and extension activities.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
               <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <ShieldCheck size={18} className="text-purple-600" />
                  Institutional Compliance Monitoring
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <ShieldCheck size={18} className="text-purple-600" />
                  Inclusive Governance Planning
               </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
            <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Institutional Hub</h4>
            <p className="italic text-slate-500 font-serif text-lg leading-relaxed">
              "The Center serves as a hub for monitoring, evaluating, and reporting on 
              institutional gender initiatives, ensuring compliance with national policies 
              and contributing to academic planning."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-component for Feature Cards
function FeatureCard({ icon, title, description }) {
  return (
    <div className="group bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
      <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-6 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
        {icon}
      </div>
      <h3 className="text-xs font-black text-slate-900 tracking-widest mb-2 uppercase">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Explore <ArrowRight size={14} />
      </div>
    </div>
  );
}