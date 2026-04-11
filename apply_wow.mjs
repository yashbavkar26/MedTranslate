import fs from 'fs';

const appPath = './frontend/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// 1. IMPORTS
code = code.replace(
  "import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare, Wifi, WifiOff, Leaf, Stethoscope, HelpCircle } from 'lucide-react';",
  "import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare, Wifi, WifiOff, Leaf, Stethoscope, HelpCircle, Mic, MicOff, MapPin, PhoneCall, ArrowRight } from 'lucide-react';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';"
);

// 2. 3D ANATOMY MODEL (HUD ORBS)
const targetAnatomy = `function AnatomyModel() {
  const { scene } = useGLTF('/front_body_anatomy.glb');
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return <primitive ref={meshRef} object={scene} />;
}`;

const replaceAnatomy = `const ORGAN_COORDS: Record<OrganId, [number, number, number][]> = {
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

function AnatomyModel({ affectedOrgans = [], isAnalyzing = false }: { affectedOrgans: OrganId[], isAnalyzing: boolean }) {
  const { scene } = useGLTF('/front_body_anatomy.glb');
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isAnalyzing) {
        meshRef.current.rotation.y -= delta * 3;
      } else {
        meshRef.current.rotation.y += delta * 0.5;
      }
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
      {affectedOrgans.map(organ => (
        ORGAN_COORDS[organ]?.map((pos, idx) => (
          <mesh key={\`\${organ}-\${idx}\`} position={pos as [number,number,number]}>
            <sphereGeometry args={[isAnalyzing ? 0.09 : 0.06, 32, 32]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} transparent opacity={0.9} />
          </mesh>
        ))
      ))}
    </group>
  );
}`;
code = code.replace(targetAnatomy, replaceAnatomy);

// 3. Update `<AnatomyModel />` usage inside App component rendering
code = code.replace(
  '<AnatomyModel />',
  '<AnatomyModel affectedOrgans={result?.affectedOrgans || []} isAnalyzing={isAnalyzing} />'
);

// 4. Voice-to-Text hooks
const targetHooks = `const [isChatting, setIsChatting] = useState(false);`;
const replaceHooks = `const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSymptomText(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceRecord = () => {
    if (!recognitionRef.current) return alert("Browser does not support Voice Recognition.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSymptomText(''); 
      recognitionRef.current.start();
      setIsListening(true);
    }
  };`;
code = code.replace(targetHooks, replaceHooks);

// 5. Voice Input UI
const targetSymptomArea = `<textarea 
                  className="w-full h-32 p-4 rounded-xl border outline-none bg-black/5 resize-none transition-all focus:ring-2 focus:ring-teal-500"`;
const replaceSymptomArea = `<div className="relative">
                <textarea 
                  className={\`w-full h-32 p-4 rounded-xl border outline-none bg-black/5 resize-none transition-all focus:ring-2 \${isListening ? 'ring-2 ring-red-500' : 'focus:ring-teal-500'}\`}`;
code = code.replace(targetSymptomArea, replaceSymptomArea);

const targetSymptomAreaEnd = `placeholder={t[language].typeSymptomsPlaceholder}
                />`;
const replaceSymptomAreaEnd = `placeholder={t[language].typeSymptomsPlaceholder}
                />
                <button 
                  onClick={toggleVoiceRecord} 
                  className={\`absolute bottom-4 right-4 p-2 rounded-full transition-all \${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-teal-500'}\`}
                  title={isListening ? "Stop recording output" : "Voice dictation"}
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>`;
code = code.replace(targetSymptomAreaEnd, replaceSymptomAreaEnd);

// 6. Medical Charts (Recharts Mock)
const targetHistoryRender = `const renderHistory = () => {`;
const replaceHistoryRender = `const renderHistory = () => {
    // 6a. MOCK TREND DATA FOR HACKATHON DEMO
    const chartData = [
      { month: 'Oct', value: 6.8, cholesterol: 190 },
      { month: 'Nov', value: 6.5, cholesterol: 185 },
      { month: 'Dec', value: 6.2, cholesterol: 170 },
      { month: 'Jan', value: 5.9, cholesterol: 165 },
      { month: 'Feb', value: 5.7, cholesterol: 150 },
    ];

    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
           <FileBox size={80} className="text-teal-500 mb-6 opacity-50" />
           <h2 className="text-2xl font-black mb-4">No Medical History</h2>
           <p className="opacity-60 mb-6">You haven't analyzed any medical reports or symptoms yet. Start your first scan to build your health profile.</p>
           <button onClick={() => setCurrentTab('analyze')} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-bold rounded-xl hover:from-teal-400 hover:to-cyan-500">START ANALYSIS</button>
        </div>
      );
    }`;
code = code.replace(targetHistoryRender, replaceHistoryRender);
code = code.replace(`{history.length === 0 ? (
            <p className="opacity-50 text-center py-10 italic">No history yet.</p>
          ) : (`, `
          <div className="mb-10 p-6 rounded-[2rem] border shadow-2xl bg-black/5 backdrop-blur-xl" style={{ borderColor: themeColors.border }}>
            <h3 className="font-black text-xl mb-6">Simulated Patient Health Trends (Demo)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                  <Line type="monotone" name="HbA1c" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" name="Cholesterol" dataKey="cholesterol" stroke="#14b8a6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {history.length === 0 ? null : (`);

// 7. ER LOCATION MAP UI & FAB
const targetUrgencyBanner = `              <div className={\`p-4 rounded-xl flex items-center gap-3 font-bold \${`;
const replaceUrgencyBanner = `
              {result.urgency === 'urgent' && (
                <div className="w-full mb-6 p-6 border rounded-2xl bg-white/5 backdrop-blur-xl flex flex-col gap-4 border-red-500/30 shadow-2xl shadow-red-500/10">
                  <h3 className="font-black text-xl flex items-center gap-2 text-red-500"><MapPin size={24}/> Emergency Action Center</h3>
                  <p className="text-sm opacity-80">Based on your condition, we strongly suggest visiting an emergency room immediately.</p>
                  <div className="flex gap-4">
                     <a href="https://www.google.com/maps/search/hospitals+near+me" target="_blank" className="flex-1 text-center py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-lg shadow-red-500/30">Find Hospitals Nearby</a>
                     <a href="tel:112" className="flex-1 text-center py-3 bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-500 transition-all shadow-lg shadow-rose-500/30"><PhoneCall size={18}/> Dial 112</a>
                  </div>
                </div>
              )}
              <div className={\`p-4 rounded-xl flex items-center gap-3 font-bold \${`;
code = code.replace(targetUrgencyBanner, replaceUrgencyBanner);

fs.writeFileSync(appPath, code, 'utf8');

console.log("Applied Massive UI WOW Factors!");
