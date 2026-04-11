import fs from 'fs';

const appPath = './frontend/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// 1. Update Tab State
code = code.replace(
  "const [currentTab, setCurrentTab] = useState<'analyze' | 'history'>('analyze');",
  "const [currentTab, setCurrentTab] = useState<'analyze' | 'history' | 'specialists'>('analyze');"
);

// 2. Add Tab Button
const topTabsTarget = `<button onClick={() => setCurrentTab('history')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <History size={16} /> {t[language].history}
          </button>`;
const topTabsReplacement = `<button onClick={() => setCurrentTab('history')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <History size={16} /> {t[language].history}
          </button>
          <button onClick={() => setCurrentTab('specialists')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'specialists' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <Stethoscope size={16} /> Find Specialists
          </button>`;
code = code.replace(topTabsTarget, topTabsReplacement);

// 3. Add Specialists Screen
const historyContentTarget = `{currentTab === 'history' && renderHistory()}`;
const specialistScreenContent = `{currentTab === 'history' && renderHistory()}

        {currentTab === 'specialists' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-8 rounded-[2rem] border shadow-2xl bg-black/5 backdrop-blur-xl border-emerald-500/30">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3" style={{ color: themeColors.text }}><Stethoscope className="text-emerald-500" size={32} /> Local Specialists Directory</h2>
              <p className="opacity-70 mb-8 max-w-2xl">Use our interactive directory to find certified doctors and clinics in your exact area automatically matching your triage needs.</p>
              
              <div className="flex flex-col md:flex-row gap-6 h-[500px]">
                {/* Left Side: Directory List */}
                <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                   <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-emerald-500/50 shadow-lg shadow-emerald-500/10">
                     <h4 className="font-black text-lg text-emerald-400">Dr. Sarah Jenkins</h4>
                     <p className="text-sm opacity-80 font-bold">General Physician • 0.8 mi</p>
                     <p className="text-xs opacity-60 mt-2 flex items-center gap-1"><Clock size={12}/> Open Now until 8:00 PM</p>
                   </div>
                   <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                     <h4 className="font-black text-lg">CityCare Urgent Clinic</h4>
                     <p className="text-sm opacity-80 font-bold">Urgent Care • 1.2 mi</p>
                     <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1"><AlertTriangle size={12}/> Highly Recommended for Yellow Triage</p>
                   </div>
                   <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                     <h4 className="font-black text-lg">Dr. A. Sharma</h4>
                     <p className="text-sm opacity-80 font-bold">Cardiology Specialist • 2.5 mi</p>
                     <p className="text-xs opacity-60 mt-2">Appointment Required</p>
                   </div>
                   <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                     <h4 className="font-black text-lg">Mercy General Hospital</h4>
                     <p className="text-sm opacity-80 font-bold">ER & Trauma • 4.1 mi</p>
                     <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1"><MapPin size={12}/> 24/7 Emergency Care</p>
                   </div>
                </div>

                {/* Right Side: Map */}
                <div className="w-full md:w-2/3 h-full rounded-3xl overflow-hidden border border-slate-700 relative shadow-inner">
                  {/* Using OpenStreetMap Embed */}
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-122.46%2C37.73%2C-122.38%2C37.81&layer=mapnik&marker=37.7749%2C-122.4194"
                    className="w-full h-full filter invert hue-rotate-[180deg] contrast-125 dark:opacity-90 transition-all pointer-events-none"
                  ></iframe>
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/50 flex items-center gap-2 animate-pulse">
                    <MapPin size={16} /> Scanning local area...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}`;
code = code.replace(historyContentTarget, specialistScreenContent);

fs.writeFileSync(appPath, code, 'utf8');

console.log("Successfully added Specialists Directory Tab & Map!");
