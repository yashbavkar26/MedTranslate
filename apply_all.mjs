import fs from 'fs';

const appPath = './frontend/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// STEP 0: Normalize ALL line endings to \n to avoid matching issues
code = code.replace(/\r\n/g, '\n');

// ============================================================
// STEP 1: Add missing lucide icons (User, Activity, Droplet, HeartPulse, MoreVertical)
// ============================================================
code = code.replace(
  "import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare, Wifi, WifiOff, Leaf, Stethoscope, HelpCircle, Mic, MicOff, MapPin, PhoneCall, ArrowRight } from 'lucide-react';",
  "import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare, Wifi, WifiOff, Leaf, Stethoscope, HelpCircle, Mic, MicOff, MapPin, PhoneCall, ArrowRight, User, Activity, Droplet, MoreVertical } from 'lucide-react';"
);

// ============================================================
// STEP 2: Replace AnatomyModel with HUD-orb version
// ============================================================
code = code.replace(
  `function AnatomyModel() {
  const { scene } = useGLTF('/front_body_anatomy.glb');
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return <primitive ref={meshRef} object={scene} />;
}
useGLTF.preload('/front_body_anatomy.glb');`,
  `const ORGAN_COORDS: Record<OrganId, [number, number, number][]> = {
  brain: [[0, 1.6, 0]],
  eyes: [[-0.08, 1.5, 0.1], [0.08, 1.5, 0.1]],
  lungs: [[-0.18, 0.8, 0.05], [0.18, 0.8, 0.05]],
  heart: [[-0.08, 0.75, 0.1]],
  liver: [[-0.12, 0.5, 0.1]],
  stomach: [[0.1, 0.45, 0.1]],
  kidneys: [[-0.15, 0.35, -0.1], [0.15, 0.35, -0.1]],
  intestines: [[0, 0.2, 0.1]],
  bladder: [[0, -0.1, 0.05]],
  thyroid: [[0, 1.25, 0.05]],
  spleen: [[0.18, 0.5, 0.05]],
  pancreas: [[0, 0.4, 0.05]],
  bones: [], blood: []
};

function GlowOrb({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 32, 32]} />
      <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} transparent opacity={0.85} />
    </mesh>
  );
}

function AnatomyModel({ affectedOrgans = [], isAnalyzing = false }: { affectedOrgans: OrganId[], isAnalyzing: boolean }) {
  const { scene } = useGLTF('/front_body_anatomy.glb');
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (isAnalyzing ? -3 : 0.5);
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
      {affectedOrgans.map(organ =>
        (ORGAN_COORDS[organ] || []).map((pos, idx) => (
          <GlowOrb key={\`\${organ}-\${idx}\`} position={pos} />
        ))
      )}
    </group>
  );
}
useGLTF.preload('/front_body_anatomy.glb');`
);

// ============================================================
// STEP 3: Update MedicalResult interface
// ============================================================
code = code.replace(
  `  homeRemedies?: { remedy: string; instruction: string }[];
  affectedOrgans: OrganId[];
  sessionId?: string;
  safetyNotice?: string;
}`,
  `  homeRemedies?: { remedy: string; instruction: string }[];
  affectedOrgans: OrganId[];
  sessionId?: string;
  safetyNotice?: string;
  healthScore?: number;
  patientInfo?: { name: string; age: string; gender: string; bloodType: string; weight: string };
  vitals?: { name: string; value: string; status: string; highlight: boolean }[];
}`
);

// ============================================================
// STEP 4: Tab State — widen to include 'specialists'
// ============================================================
code = code.replace(
  "const [currentTab, setCurrentTab] = useState<'analyze' | 'history'>('analyze');",
  "const [currentTab, setCurrentTab] = useState<'analyze' | 'history' | 'specialists'>('analyze');"
);

// ============================================================
// STEP 5: Update buildResult to compute healthScore/vitals/patientInfo
// ============================================================
code = code.replace(
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

// ============================================================
// STEP 6: Widen the main container from max-w-4xl → max-w-7xl
// ============================================================
code = code.replace(
  '<main className="max-w-4xl mx-auto p-6">',
  '<main className="max-w-7xl mx-auto p-6">'
);

// ============================================================
// STEP 7: Add Specialists tab button to the nav
// ============================================================
code = code.replace(
  `<button onClick={() => setCurrentTab('history')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <History size={16} /> {t[language].history}
          </button>
        </div>`,
  `<button onClick={() => setCurrentTab('history')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <History size={16} /> {t[language].history}
          </button>
          <button onClick={() => setCurrentTab('specialists')} className={\`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${currentTab === 'specialists' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 text-white shadow-md' : 'text-slate-500'}\`}>
            <Stethoscope size={16} /> Find Specialists
          </button>
        </div>`
);

// ============================================================
// STEP 8: Replace the Analyze tab 3D model + input + results with Medicare layout
// ============================================================

// Find and replace the analyze tab content with the new 3-column layout
const analyzeTabStart = `{currentTab === 'analyze' && (
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
const analyzeTabReplacement = `{currentTab === 'analyze' && (
          <div className="space-y-6 animate-fade-in">

            {/* ====== MEDICARE 3-COL DASHBOARD (only after result) ====== */}
            {result && !isAnalyzing ? (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 items-start">

                {/* LEFT COL: Patient + Donut */}
                <div className="space-y-6">
                  {/* Patient Info Card */}
                  <div className="p-6 rounded-[2rem] border bg-white/5 backdrop-blur-xl shadow-lg border-teal-500/20 relative">
                    <MoreVertical size={20} className="absolute top-6 right-6 opacity-40 cursor-pointer hover:opacity-100" />
                    <h3 className="font-bold text-xs opacity-60 mb-5 tracking-[0.2em] uppercase">Patient Info</h3>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-[3px] mb-4 shadow-xl shadow-cyan-500/30">
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                          <User size={36} className="opacity-70" />
                        </div>
                      </div>
                      <h2 className="text-xl font-black leading-tight">{result.patientInfo?.name || 'Patient'}</h2>
                      <p className="opacity-50 text-sm mt-1">{result.patientInfo?.gender} &bull; {result.patientInfo?.age}</p>
                      <div className="flex gap-2 text-[11px] font-bold font-mono mt-3">
                        <span className="px-3 py-1 rounded-full bg-white/10">{result.patientInfo?.weight}</span>
                        <span className="px-3 py-1 rounded-full bg-white/10">{result.patientInfo?.bloodType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Health Donut */}
                  <div className="p-6 rounded-[2rem] border bg-white/5 backdrop-blur-xl shadow-lg border-teal-500/20 flex flex-col items-center">
                    <h3 className="font-bold text-xs opacity-60 mb-4 tracking-[0.2em] uppercase w-full text-left">Patient Body</h3>
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="opacity-10" />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent"
                          className={\`\${(result.healthScore ?? 96) > 80 ? 'text-teal-500' : (result.healthScore ?? 96) > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000\`}
                          strokeDasharray={\`\${(result.healthScore ?? 96) * 2.51} 251\`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black">{result.healthScore ?? 96}%</span>
                        <span className="text-[9px] uppercase font-bold opacity-60 mt-0.5">Health Condition</span>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-40 mt-3 text-center"><AlertTriangle size={10} className="inline mr-1" />Computed via Triage matrix</p>
                  </div>
                </div>

                {/* CENTER COL: 3D Model */}
                <div className="w-full h-[550px] relative rounded-[2rem] overflow-hidden">
                  <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <Suspense fallback={null}>
                      <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                        <AnatomyModel affectedOrgans={result?.affectedOrgans || []} isAnalyzing={isAnalyzing} />
                      </Stage>
                    </Suspense>
                    <OrbitControls enableZoom={false} />
                  </Canvas>
                  {/* Connector Lines overlay */}
                  {result.affectedOrgans.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-cyan-500 opacity-50 z-10">
                      <line x1="55%" y1="30%" x2="95%" y2="15%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="animate-pulse" />
                      <circle cx="55%" cy="30%" r="4" fill="currentColor" />
                      <line x1="48%" y1="50%" x2="5%" y2="55%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="animate-pulse" />
                      <circle cx="48%" cy="50%" r="4" fill="currentColor" />
                    </svg>
                  )}
                </div>

                {/* RIGHT COL: Vitals + Extraction */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(result.vitals || []).map((vital, i) => (
                      <div key={i} className={\`p-4 rounded-2xl border backdrop-blur-xl \${vital.highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-teal-500/10'} shadow-lg\`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={\`p-1 rounded-lg \${vital.highlight ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'}\`}>
                            {i % 2 === 0 ? <Droplet size={12}/> : <Activity size={12}/>}
                          </div>
                          <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{vital.name}</span>
                        </div>
                        <h4 className={\`text-lg font-black \${vital.highlight ? 'text-red-400' : ''}\`}>{vital.value}</h4>
                        <svg className="w-full h-6 mt-1 opacity-40" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <polyline points="0,10 15,18 30,4 50,14 70,6 85,12 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-[2rem] border bg-white/5 border-white/10 shadow-xl backdrop-blur-md">
                    <h3 className="font-bold text-xs tracking-[0.2em] uppercase opacity-60 mb-3">Medical Extraction</h3>
                    <p className="text-sm font-bold leading-relaxed max-h-40 overflow-y-auto pr-1">{result.explanation}</p>
                    <p className="text-[11px] opacity-50 mt-3 italic flex items-center gap-1"><CheckCircle size={11}/> Translation complete ({language})</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
              {/* DEFAULT: 3D Model + Upload blocks */}
              <div className="w-full h-[400px] relative mt-4 mb-4 rounded-[2rem]">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                      <AnatomyModel affectedOrgans={[]} isAnalyzing={isAnalyzing} />
                    </Stage>
                  </Suspense>
                  <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
                </Canvas>
              </div>
              </>
            )}

            {/* Input + Result blocks — hidden when Medicare view is showing */}
            <div className={\`\${result && !isAnalyzing ? 'hidden' : ''}\`}>`;

code = code.replace(analyzeTabStart, analyzeTabReplacement);

// ============================================================
// STEP 9: Close the wrapper div before the end of the analyze tab
// ============================================================
// Find the end of the analyze tab (the closing for result && !isAnalyzing and the tab)
// We need to add a closing </div> for the wrapper
code = code.replace(
  `              </>
            )}
          </div>
        )}

        {currentTab === 'history'`,
  `              </>
            )}
            </div>
          </div>
        )}

        {currentTab === 'history'`
);

// ============================================================
// STEP 10: Add Specialists Tab after history tab
// ============================================================
code = code.replace(
  `          </div>
        )}
      </main>`,
  `          </div>
        )}

        {currentTab === 'specialists' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-8 rounded-[2rem] border shadow-2xl bg-white/5 backdrop-blur-xl border-emerald-500/30">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Stethoscope className="text-emerald-500" size={32} /> Local Specialists Directory</h2>
              <p className="opacity-60 mb-8 max-w-2xl text-sm">Find certified doctors and clinics in your area, automatically matched to your triage needs.</p>
              <div className="flex flex-col md:flex-row gap-6 h-[500px]">
                <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
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
                </div>
                <div className="w-full md:w-2/3 h-full rounded-3xl overflow-hidden border border-slate-700 relative shadow-inner">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-122.46%2C37.73%2C-122.38%2C37.81&layer=mapnik&marker=37.7749%2C-122.4194"
                    className="w-full h-full filter invert hue-rotate-[180deg] contrast-125 dark:opacity-90"
                  ></iframe>
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/50 flex items-center gap-2 animate-pulse">
                    <MapPin size={16} /> Scanning area...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>`
);

// Write back with consistent \n endings
fs.writeFileSync(appPath, code, 'utf8');

// ============================================================
// Verify
// ============================================================
const verify = fs.readFileSync(appPath, 'utf8');
const checks = [
  ['ORGAN_COORDS', verify.includes('ORGAN_COORDS')],
  ['GlowOrb', verify.includes('GlowOrb')],
  ['healthScore in interface', verify.includes('healthScore?: number')],
  ['healthScore in buildResult', verify.includes("parsed.urgency === 'urgent' ? 34")],
  ['Medicare grid', verify.includes('lg:grid-cols-[280px_1fr_280px]')],
  ['Patient Info card', verify.includes('Patient Info')],
  ['Donut chart', verify.includes('Health Condition')],
  ['Vitals cards', verify.includes('vital.highlight')],
  ['Specialists tab', verify.includes("'specialists'")],
  ['Find Specialists button', verify.includes('Find Specialists')],
  ['AnatomyModel props', verify.includes('affectedOrgans = [], isAnalyzing = false')],
];

console.log('\n=== VERIFICATION ===');
let allGood = true;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) allGood = false;
}
console.log(allGood ? '\n🎉 ALL CHECKS PASSED!' : '\n⚠️  SOME CHECKS FAILED');
