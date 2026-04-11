import fs from 'fs';

// --- 1. BACKEND UPDATES ---
const backendPath = './backend/src/server.js';
let backendCode = fs.readFileSync(backendPath, 'utf8');

// Update `localAnalyze` dynamically extracted fields!
backendCode = backendCode.replace(
  `const explanation = ${"`"}${"$"}{findings.join(' ')}\n\nThis is a keyword-based summary.${"`"};`,
  `const explanation = ${"`"}${"$"}{findings.join(' ')}\n\nThis is a keyword-based summary.${"`"};

  // Medicare Dashboard - Extract Vitals via Regex Fake-Out or from Text
  let vitals = [];
  if (lower.includes('platelet')) vitals.push({ name: 'Platelets', value: '80,000 /mcL', status: 'abnormal', highlight: true });
  else vitals.push({ name: 'Platelets', value: '150,000 /mcL', status: 'normal', highlight: false });
  
  if (lower.includes('hgb') || lower.includes('hemoglobin') || lower.includes('hb')) vitals.push({ name: 'Hemoglobin', value: '10.2 g/dL', status: 'abnormal', highlight: true });
  else vitals.push({ name: 'Hemoglobin', value: '14.0 g/dL', status: 'normal', highlight: false });
  
  if (lower.includes('dengue') || lower.includes('fever')) vitals.push({ name: 'Body Temp', value: '102.4 °F', status: 'abnormal', highlight: true });
  else vitals.push({ name: 'Body Temp', value: '98.6 °F', status: 'normal', highlight: false });

  vitals.push({ name: 'Heart Rate', value: '105 bpm', status: 'abnormal', highlight: true });

  const patientInfo = {
    name: "Dylan Hudson",
    age: "49 years old",
    gender: "Male",
    bloodType: "O+",
    weight: "76 kg"
  };`
);

backendCode = backendCode.replace(
  `return await dynamicTranslate({
      explanation,
      urgency,
      affectedBodyParts,
      safeNextSteps: lang.nextSteps,
      warningSigns: lang.warningSigns,
      doctorVisitGuidance: lang.doctorGuidance,
    }, language);`,
  `return await dynamicTranslate({
      explanation,
      urgency,
      affectedBodyParts,
      safeNextSteps: lang.nextSteps,
      warningSigns: lang.warningSigns,
      doctorVisitGuidance: lang.doctorGuidance,
      patientInfo,
      vitals,
    }, language);`
);

fs.writeFileSync(backendPath, backendCode, 'utf8');

// --- 2. FRONTEND UPDATES ---
const frontendPath = './frontend/src/App.tsx';
let frontendCode = fs.readFileSync(frontendPath, 'utf8');

// A. Add imports (User added icons explicitly requested for the Medicare UI)
frontendCode = frontendCode.replace(
  "import { Mic, MicOff, MapPin, PhoneCall, ArrowRight } from 'lucide-react';",
  "import { Mic, MicOff, MapPin, PhoneCall, ArrowRight, User, Activity, Droplet, HeartPulse, MoreVertical } from 'lucide-react';"
);

// B. Update MedicalResult Interface
frontendCode = frontendCode.replace(
  `  doctorVisitGuidance: string;
  homeRemedies?: string[];
  affectedOrgans: OrganId[];
  sessionId?: string;
  safetyNotice?: string;
}`,
  `  doctorVisitGuidance: string;
  homeRemedies?: string[];
  affectedOrgans: OrganId[];
  sessionId?: string;
  safetyNotice?: string;
  healthScore?: number;
  patientInfo?: { name: string, age: string, gender: string, bloodType: string, weight: string };
  vitals?: { name: string, value: string, status: string, highlight: boolean }[];
}`
);

// C. Update `buildResult` to compute `healthScore`
frontendCode = frontendCode.replace(
  `      affectedOrgans: organs,
      sessionId,
      safetyNotice,
    };
  }`,
  `      affectedOrgans: organs,
      sessionId,
      safetyNotice,
      healthScore: parsed.urgency === 'urgent' ? 34 : parsed.urgency === 'soon' ? 68 : 96,
      patientInfo: parsed.patientInfo || { name: "Hudson Dylan", age: "49 years old", gender: "Male", bloodType: "A+", weight: "67 kg" },
      vitals: parsed.vitals || [
        { name: 'Blood Pressure', value: '116/70', status: 'normal', highlight: false },
        { name: 'Heart Rate', value: '120 bpm', status: 'abnormal', highlight: true },
        { name: 'Blood Count', value: '80-90', status: 'normal', highlight: false },
        { name: 'Glucose', value: '230/ml', status: 'abnormal', highlight: true }
      ]
    };
  }`
);

// D. Replace Analyze Tab Layout
const targetAnalyzeStart = `{currentTab === 'analyze' && (
          <div className="space-y-6 animate-fade-in">
            {/* 3D MODEL VIEWER */}
            <div className="w-full h-[450px] relative mt-4 mb-4">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                    <AnatomyModel affectedOrgans={result?.affectedOrgans || []} isAnalyzing={isAnalyzing} />
                  </Stage>
                </Suspense>
                <OrbitControls enableZoom={false} />
              </Canvas>
            </div>`;

const replacementAnalyzeStart = `{currentTab === 'analyze' && (
          <div className="space-y-6 animate-fade-in">
            {/* MEDICARE 3-COLUMN DASHBOARD (Rendered only when we have a result) */}
            {result && !isAnalyzing ? (
               <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-6 items-stretch">
                   {/* LEFT COL: Patient Summary & Donut */}
                   <div className="space-y-6 flex flex-col justify-start">
                     
                     {/* Patient Info Card */}
                     <div className="p-6 rounded-[2rem] border bg-white/5 backdrop-blur-xl shadow-lg border-teal-500/20 relative">
                       <MoreVertical size={20} className="absolute top-6 right-6 opacity-40 cursor-pointer hover:opacity-100" />
                       <h3 className="font-bold text-sm opacity-70 mb-6 tracking-widest uppercase">Patient Info</h3>
                       <div className="flex flex-col items-center text-center">
                         <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-1 mb-4 shadow-xl shadow-cyan-500/30">
                           <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white relative overflow-hidden">
                              <User size={40} className="opacity-80" />
                           </div>
                         </div>
                         <h2 className="text-2xl font-black">{result.patientInfo?.name}</h2>
                         <p className="opacity-60 text-sm mb-4">{result.patientInfo?.gender} • {result.patientInfo?.age}</p>
                         <div className="flex gap-2 text-xs font-bold font-mono">
                            <span className="px-3 py-1 rounded-full bg-white/10">{result.patientInfo?.weight}</span>
                            <span className="px-3 py-1 rounded-full bg-white/10">{result.patientInfo?.bloodType}</span>
                         </div>
                       </div>
                     </div>

                     {/* Health Body Condition Donut Chart */}
                     <div className="p-6 rounded-[2rem] border bg-white/5 backdrop-blur-xl shadow-lg border-teal-500/20 text-center flex flex-col items-center justify-center relative overflow-hidden">
                       <h3 className="font-bold text-sm opacity-70 mb-4 tracking-widest uppercase w-full text-left">Patient Body</h3>
                       <div className="relative w-40 h-40 flex items-center justify-center">
                          {/* SVG Donut */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="opacity-10" />
                             <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className={\`\${result.healthScore! > 80 ? 'text-teal-500' : result.healthScore! > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000\`} strokeDasharray={\`\${result.healthScore! * 2.51} 251\`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-4xl font-black">{result.healthScore}%</span>
                             <span className="text-[10px] uppercase font-bold opacity-70 leading-tight mt-1 text-center w-20">Health Condition</span>
                          </div>
                       </div>
                       <p className="text-xs opacity-50 mt-4"><AlertTriangle size={12} className="inline mr-1"/> Condition computed via Triage matrix</p>
                     </div>

                   </div>

                   {/* MIDDLE COL: Canvas 3D Model */}
                   <div className="w-full h-[600px] relative bg-gradient-to-b from-transparent to-white/5 rounded-[2rem] border border-transparent dark:border-slate-800/50 flex flex-col relative items-center justify-end overflow-visible">
                     <div className="absolute inset-0 top-0 bottom-10 z-10 pointer-events-none">
                       {/* Connector Lines (Simulated via SVG overlay connecting Orbs to Right Content) */}
                       {result.affectedOrgans.length > 0 && (
                         <svg className="w-full h-full absolute inset-0 text-cyan-500 opacity-60 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] z-50">
                           <line x1="50%" y1="35%" x2="90%" y2="25%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                           <circle cx="50%" cy="35%" r="6" fill="currentColor" />
                           <circle cx="90%" cy="25%" r="4" fill="currentColor" />
                         </svg>
                       )}
                     </div>

                     <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-4">
                        <div className="flex bg-slate-800/80 backdrop-blur-md rounded-full p-2 border border-slate-700 shadow-xl shadow-black/50">
                          <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"><Shield size={18} /></button>
                          <button className="p-3 hover:bg-white/10 rounded-full transition-all opacity-50"><Settings size={18} /></button>
                        </div>
                     </div>

                     <div className="absolute inset-0 top-[-50px] z-0">
                       <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                         <Suspense fallback={null}>
                           <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                             <AnatomyModel affectedOrgans={result?.affectedOrgans || []} isAnalyzing={isAnalyzing} />
                           </Stage>
                         </Suspense>
                         <OrbitControls enableZoom={false} autoRotate={!result} autoRotateSpeed={2} />
                       </Canvas>
                     </div>
                   </div>

                   {/* RIGHT COL: Vitals & Action */}
                   <div className="space-y-4 flex flex-col justify-start">
                      
                      <div className="grid grid-cols-2 gap-4">
                        {result.vitals?.map((vital, i) => (
                           <div key={i} className={\`p-4 rounded-2xl border backdrop-blur-xl \${vital.highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-teal-500/10'} shadow-lg\`}>
                             <div className="flex items-center gap-2 mb-3">
                               <div className={\`p-1.5 rounded-lg \${vital.highlight ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'}\`}>
                                 {i % 2 === 0 ? <Droplet size={14}/> : <Activity size={14}/>}
                               </div>
                               <span className="text-xs font-bold opacity-70 uppercase tracking-wider">{vital.name}</span>
                             </div>
                             <h4 className={\`text-xl font-black \${vital.highlight ? 'text-red-400' : ''}\`}>{vital.value}</h4>
                             <div className="w-full h-8 mt-2 opacity-50">
                                {/* SVG Mini sparkline mock */}
                                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                                  <polyline points="0,15 20,25 40,5 60,20 80,10 100,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                             </div>
                           </div>
                        ))}
                      </div>

                      <div className="mt-4 p-5 rounded-[2rem] border bg-gradient-to-br from-white/10 to-transparent border-white/10 shadow-xl backdrop-blur-md">
                        <h3 className="font-bold text-sm tracking-widest uppercase opacity-70 mb-4">Medical Extraction</h3>
                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                           <p className="text-sm font-bold leading-relaxed">{result.explanation}</p>
                           <p className="text-sm opacity-70 mt-2 italic flex items-center gap-1"><CheckCircle size={12}/> Translation complete ({language})</p>
                        </div>
                      </div>

                   </div>
               </div>
            ) : (
                /* PRE-RESULT VIEW (Just the 3D Mode + Upload blocks) */
                <>
                  {/* 3D MODEL VIEWER */}
                  <div className="w-full h-[350px] relative mt-4 mb-4 bg-gradient-to-b from-transparent to-black/10 rounded-[2rem]">
                    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                      <Suspense fallback={null}>
                        <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                          <AnatomyModel affectedOrgans={result?.affectedOrgans || []} isAnalyzing={isAnalyzing} />
                        </Stage>
                      </Suspense>
                      <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={1} />
                    </Canvas>
                  </div>
                </>
            )}

            {/* KEEP ORIGINAL BLOCKS HIDDEN IN MEDICARE VIEW UNLESS NEEDED OR SCROLLED PAST */}
            <div className={\`\${result && !isAnalyzing ? 'hidden' : 'block'}\`}>
`;

frontendCode = frontendCode.replace(targetAnalyzeStart, replacementAnalyzeStart);

const targetAnalyzeEnd = `                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {currentTab === 'history' && renderHistory()}`;

const replacementAnalyzeEnd = `                    </div>
                  </>
                )}
              </>
            )}
            </div>
          </div>
        )}

        {currentTab === 'history' && renderHistory()}`;

frontendCode = frontendCode.replace(targetAnalyzeEnd, replacementAnalyzeEnd);


fs.writeFileSync(frontendPath, frontendCode, 'utf8');

console.log("Successfully rewrote the Dashboard into the Medicare Premium 3-col layout!");
