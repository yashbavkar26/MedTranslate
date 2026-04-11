import fs from 'fs';

const appPath = './frontend/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');
code = code.replace(/\r\n/g, '\n');

// ============================================================
// 1. Add nearbyClinics state + patient form state + grouped history
// ============================================================
code = code.replace(
  `  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const recognitionRef = useRef<any>(null);`,
  `  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [nearbyClinics, setNearbyClinics] = useState<{name: string, type: string, dist: string}[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  // Patient Info Form
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMode, setPendingMode] = useState<'pdf' | 'text'>('pdf');

  const recognitionRef = useRef<any>(null);`
);

// ============================================================
// 2. Fetch nearby clinics from Overpass API when location changes
// ============================================================
code = code.replace(
  `  // --- LIVE GEOLOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setUserLocation({ lat: 15.4909, lon: 73.8278 }), // fallback to Goa
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: 15.4909, lon: 73.8278 });
    }
  }, []);`,
  `  // --- LIVE GEOLOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setUserLocation({ lat: 15.4909, lon: 73.8278 }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserLocation({ lat: 15.4909, lon: 73.8278 });
    }
  }, []);

  // --- FETCH NEARBY CLINICS (Overpass API) ---
  useEffect(() => {
    if (!userLocation) return;
    setLoadingClinics(true);
    const { lat, lon } = userLocation;
    const radius = 5000; // 5 km
    const query = \`[out:json][timeout:15];(node["amenity"~"hospital|clinic|doctors"](around:\${radius},\${lat},\${lon});way["amenity"~"hospital|clinic|doctors"](around:\${radius},\${lat},\${lon}););out body center 10;\`;
    fetch(\`https://overpass-api.de/api/interpreter?data=\${encodeURIComponent(query)}\`)
      .then(r => r.json())
      .then(data => {
        const results = (data.elements || [])
          .filter((el: any) => el.tags?.name)
          .map((el: any) => {
            const elLat = el.lat || el.center?.lat || lat;
            const elLon = el.lon || el.center?.lon || lon;
            const d = Math.sqrt(Math.pow(elLat - lat, 2) + Math.pow(elLon - lon, 2)) * 111;
            const typeMap: Record<string, string> = { hospital: 'Hospital', clinic: 'Clinic', doctors: 'Doctor' };
            return {
              name: el.tags.name,
              type: typeMap[el.tags.amenity] || 'Medical',
              dist: d.toFixed(1) + ' km'
            };
          })
          .sort((a: any, b: any) => parseFloat(a.dist) - parseFloat(b.dist))
          .slice(0, 8);
        setNearbyClinics(results);
      })
      .catch(() => setNearbyClinics([]))
      .finally(() => setLoadingClinics(false));
  }, [userLocation]);`
);

// ============================================================
// 3. Change history from flat array to grouped record by patient name
// ============================================================
code = code.replace(
  `  const [history, setHistory] = useState<MedicalResult[]>(() => {
    try {
      const saved = localStorage.getItem('medTranslateHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('medTranslateHistory', JSON.stringify(history));
  }, [history]);`,
  `  const [history, setHistory] = useState<Record<string, MedicalResult[]>>(() => {
    try {
      const saved = localStorage.getItem('medTranslateHistoryGrouped');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('medTranslateHistoryGrouped', JSON.stringify(history));
  }, [history]);

  const addToHistory = (r: MedicalResult) => {
    const pName = r.patientInfo?.name || 'Unknown Patient';
    setHistory(prev => ({
      ...prev,
      [pName]: [r, ...(prev[pName] || [])]
    }));
  };`
);

// ============================================================
// 4. Patient form modal — intercept file upload and symptom analysis
// ============================================================

// Intercept handleFileUpload to show patient form first
code = code.replace(
  `  // --- UPLOAD PDF ---
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]);
    try {
      const data = await uploadReport(e.target.files[0], language);
      const parsed = tryParseJson(data.response);
      if (!parsed) throw new Error('Invalid response from the AI model. Please try again.');
      const r = buildResult(parsed, data.response, data.sessionId, data.safetyNotice);
      setResult(r);
      setHistory(prev => [r, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
    }
  };`,
  `  // --- UPLOAD PDF (intercepted by patient form) ---
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setPendingFile(e.target.files[0]);
    setPendingMode('pdf');
    setShowPatientForm(true);
  };

  const executeUpload = async () => {
    if (!pendingFile) return;
    setShowPatientForm(false);
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]);
    try {
      const data = await uploadReport(pendingFile, language);
      const parsed = tryParseJson(data.response);
      if (!parsed) throw new Error('Invalid response from the AI model. Please try again.');
      const r = buildResult(parsed, data.response, data.sessionId, data.safetyNotice);
      r.patientInfo = { name: patientName || 'Unknown', age: patientAge ? patientAge + ' years old' : '', gender: '', bloodType: '', weight: patientWeight ? patientWeight + ' kg' : '' };
      setResult(r);
      addToHistory(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
      setPendingFile(null);
    }
  };`
);

// Intercept runAnalysis too
code = code.replace(
  `  // --- ANALYZE (text mode) ---
  const runAnalysis = async () => {
    if (!symptomText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]);
    try {
      const data = await analyzeText(symptomText, language);
      const parsed = tryParseJson(data.response);
      if (!parsed) throw new Error('Invalid response from the AI model. Please try again.');
      const r = buildResult(parsed, symptomText, undefined, data.safetyNotice);
      setResult(r);
      setHistory(prev => [r, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
    }
  };`,
  `  // --- ANALYZE (text mode, intercepted by patient form) ---
  const triggerSymptomAnalysis = () => {
    if (!symptomText.trim()) return;
    setPendingMode('text');
    setShowPatientForm(true);
  };

  const executeAnalysis = async () => {
    setShowPatientForm(false);
    setIsAnalyzing(true);
    setError(null);
    setChatMessages([]);
    try {
      const data = await analyzeText(symptomText, language);
      const parsed = tryParseJson(data.response);
      if (!parsed) throw new Error('Invalid response from the AI model. Please try again.');
      const r = buildResult(parsed, symptomText, undefined, data.safetyNotice);
      r.patientInfo = { name: patientName || 'Unknown', age: patientAge ? patientAge + ' years old' : '', gender: '', bloodType: '', weight: patientWeight ? patientWeight + ' kg' : '' };
      setResult(r);
      addToHistory(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
    } finally {
      setIsAnalyzing(false);
    }
  };`
);

// Fix the submit button to use triggerSymptomAnalysis
code = code.replace(
  `onClick={runAnalysis}`,
  `onClick={triggerSymptomAnalysis}`
);

// ============================================================
// 5. Add Patient Form Modal UI (just before </main>)
// ============================================================
code = code.replace(
  `      </main>
    </div>
  );
};`,
  `      </main>

      {/* PATIENT INFO MODAL */}
      {showPatientForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-8 rounded-3xl border shadow-2xl relative">
            <button onClick={() => { setShowPatientForm(false); setPendingFile(null); }} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2" style={{ color: themeColors.text }}><User size={28} className="text-teal-500" /> Patient Details</h2>
            <p className="text-sm opacity-50 mb-6">Enter the patient's information before proceeding with the analysis.</p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Full Name *</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Age</label>
                  <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 32" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Weight (kg)</label>
                  <input type="number" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} placeholder="e.g. 72" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
                </div>
              </div>
            </div>
            <button onClick={() => pendingMode === 'pdf' ? executeUpload() : executeAnalysis()} disabled={!patientName.trim()} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl disabled:opacity-30 hover:from-teal-400 hover:to-cyan-500 transition-all">
              PROCEED WITH ANALYSIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};`
);

// ============================================================
// 6. Replace hardcoded clinics with dynamic nearbyClinics
// ============================================================
code = code.replace(
  `                <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                  <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-emerald-500/50 shadow-lg shadow-emerald-500/10">
                    <h4 className="font-black text-lg text-emerald-400">Dr. Sarah Jenkins</h4>
                    <p className="text-sm opacity-80 font-bold">General Physician &bull; 0.8 mi</p>
                    <p className="text-xs opacity-60 mt-2 flex items-center gap-1"><Clock size={12}/> Open Now until 8:00 PM</p>
                  </div>
                  <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h4 className="font-black text-lg">CityCare Urgent Clinic</h4>
                    <p className="text-sm opacity-80 font-bold">Urgent Care &bull; 1.2 mi</p>
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1"><AlertTriangle size={12}/> Recommended for Yellow Triage</p>
                  </div>
                  <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h4 className="font-black text-lg">Dr. A. Sharma</h4>
                    <p className="text-sm opacity-80 font-bold">Cardiology &bull; 2.5 mi</p>
                    <p className="text-xs opacity-60 mt-2">Appointment Required</p>
                  </div>
                  <div className="p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <h4 className="font-black text-lg">Mercy General Hospital</h4>
                    <p className="text-sm opacity-80 font-bold">ER &amp; Trauma &bull; 4.1 mi</p>
                    <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1"><MapPin size={12}/> 24/7 Emergency Care</p>
                  </div>
                </div>`,
  `                <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                  {loadingClinics && <p className="animate-pulse text-teal-500 font-bold text-center py-6">Fetching nearby clinics...</p>}
                  {!loadingClinics && nearbyClinics.length === 0 && <p className="text-center opacity-40 py-6">No facilities found in your area. Try expanding the range.</p>}
                  {nearbyClinics.map((clinic, i) => (
                    <div key={i} className={\`p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer \${i === 0 ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''}\`}>
                      <h4 className={\`font-black text-lg \${i === 0 ? 'text-emerald-400' : ''}\`}>{clinic.name}</h4>
                      <p className="text-sm opacity-80 font-bold">{clinic.type} &bull; {clinic.dist}</p>
                      <p className="text-xs opacity-60 mt-2 flex items-center gap-1"><MapPin size={12}/> Nearby</p>
                    </div>
                  ))}
                </div>`
);

// ============================================================
// 7. Replace history rendering (grouped by patient name)
// ============================================================
code = code.replace(
  `        {currentTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-black mb-6">{t[language].history}</h2>
            {history.length === 0 ? <p className="text-center opacity-40">No records stored locally.</p> : history.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="p-6 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Clock size={20} className="text-slate-400" />
                  <div>
                    <p className="font-black">{item.date}</p>
                    <p className="text-xs opacity-50 line-clamp-1 max-w-xs">{item.explanation}</p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full" style={{
                  backgroundColor: triageColor(urgencyToTriage(item.urgency)) + '22',
                  color: triageColor(urgencyToTriage(item.urgency)),
                }}>{urgencyToTriage(item.urgency)}</span>
              </div>
            ))}
          </div>
        )}`,
  `        {currentTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black mb-4">{t[language].history}</h2>
            {Object.keys(history).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border bg-white/5 backdrop-blur-xl" style={{ borderColor: themeColors.border }}>
                <FileText size={60} className="text-teal-500 mb-6 opacity-40" />
                <h3 className="text-xl font-black mb-2">No Medical Records Yet</h3>
                <p className="opacity-50 mb-6 text-sm max-w-xs">Upload a report or type symptoms to start building your patient history.</p>
                <button onClick={() => setCurrentTab('analyze')} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-bold rounded-xl">Start Analysis</button>
              </div>
            ) : Object.entries(history).map(([pName, items]) => (
              <div key={pName} className="rounded-[2rem] border p-6 bg-white/5 backdrop-blur-xl" style={{ borderColor: themeColors.border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/30">
                    {pName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{pName}</h3>
                    <p className="text-xs opacity-50">{items.length} record{items.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-3 ml-6 border-l-2 border-slate-700 pl-5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 hover:bg-white/5 rounded-xl px-3 transition-all">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-500" />
                        <div>
                          <p className="font-bold text-sm">{item.date}</p>
                          <p className="text-xs opacity-50 line-clamp-1 max-w-xs">{item.explanation}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{
                        backgroundColor: triageColor(urgencyToTriage(item.urgency)) + '22',
                        color: triageColor(urgencyToTriage(item.urgency)),
                      }}>{urgencyToTriage(item.urgency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}`
);

fs.writeFileSync(appPath, code, 'utf8');

// ============================================================
// VERIFY
// ============================================================
const v = fs.readFileSync(appPath, 'utf8');
const checks = [
  ['nearbyClinics state', v.includes('nearbyClinics')],
  ['Overpass API fetch', v.includes('overpass-api.de')],
  ['showPatientForm', v.includes('showPatientForm')],
  ['Patient form modal', v.includes('Patient Details')],
  ['patientName state', v.includes('patientName')],
  ['grouped history', v.includes('medTranslateHistoryGrouped')],
  ['addToHistory helper', v.includes('addToHistory')],
  ['executeUpload', v.includes('executeUpload')],
  ['executeAnalysis', v.includes('executeAnalysis')],
  ['triggerSymptomAnalysis', v.includes('triggerSymptomAnalysis')],
  ['clinics .map', v.includes('nearbyClinics.map')],
  ['history grouped rendering', v.includes('Object.entries(history)')],
];

console.log('\n=== VERIFICATION ===');
let allGood = true;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) allGood = false;
}
console.log(allGood ? '\n🎉 ALL CHECKS PASSED!' : '\n⚠️ SOME CHECKS FAILED');
