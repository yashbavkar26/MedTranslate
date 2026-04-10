import React, { useState, useEffect, ChangeEvent, useRef, Suspense } from 'react';
import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, Type, ChevronRight, Lock, X, FileText, MessageSquare } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BodyMap, { detectAffectedOrgans, OrganId } from './BodyMap';

function AnatomyModel() {
  const { scene } = useGLTF('/front_body_anatomy.glb');
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return <primitive ref={meshRef} object={scene} />;
}
useGLTF.preload('/front_body_anatomy.glb');

// --- TYPES & INTERFACES ---
interface MedicalResult {
  date: string;
  summary: string;
  advice: string;
  triage: 'Red' | 'Yellow' | 'Green';
  affectedOrgans: OrganId[];
}

interface AccessibilitySettings {
  dyslexic: boolean;
  highContrast: boolean;
}

type Language = 'English' | 'Hindi' | 'Konkani' | 'Tamil';
type AppStep = 'landing' | 'preferences' | 'login' | 'dashboard';
type InputMode = 'pdf' | 'text';

const App: React.FC = () => {
  // --- STATE ---
  const [step, setStep] = useState<AppStep>('landing');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<'analyze' | 'history'>('analyze');
  const [inputMode, setInputMode] = useState<InputMode>('pdf');
  const [language, setLanguage] = useState<Language>('English');
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({ dyslexic: false, highContrast: false });
  const [isDark, setIsDark] = useState<boolean>(true);
  const [history, setHistory] = useState<MedicalResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<MedicalResult | null>(null);
  const [symptomText, setSymptomText] = useState("");

  // --- TRANSLATIONS (Updated with Input Mode Strings) ---
  const t: Record<Language, any> = {
    English: {
      welcome: "MedTranslate", subtitle: "AI Medical Translator & Triage",
      upload: "Upload Lab Report", triage: "Triage Status",
      history: "Medical History", analyze: "Analyze", next: "Next Steps",
      subtext: "Get plain-language summaries for any medical lab report PDF.",
      selectBtn: "SELECT REPORT", tools: "TOOLS", accessibilityTitle: "Accessibility Controls",
      highContrast: "High Contrast Mode", dyslexic: "Dyslexic Font",
      summary: "Your hemoglobin is 10.2 g/dL. This is slightly low, which can make you feel tired or short of breath.",
      advice: "Schedule a non-emergency appointment with your doctor this week.",
      typeSymptoms: "Type your symptoms", typePlaceholder: "Describe how you feel (e.g., chest pain, cough)...",
      submitSymptoms: "Analyze Symptoms"
    },
    Hindi: {
      welcome: "मेडट्रांसलेट", subtitle: "एआई मेडिकल अनुवादक और ट्राइएज",
      upload: "लैब रिपोर्ट अपलोड करें", triage: "स्थिति",
      history: "चिकित्सा इतिहास", analyze: "विश्लेषण करें", next: "अगले कदम",
      subtext: "किसी भी मेडिकल लैब रिपोर्ट पीडीएफ के लिए सरल भाषा में सारांश प्राप्त करें।",
      selectBtn: "रिपोर्ट चुनें", tools: "उपकरण", accessibilityTitle: "एक्सेसिबिलिटी नियंत्रण",
      highContrast: "हाई कंट्रास्ट मोड", dyslexic: "डिस्लेक्सिक फ़ॉन्ट",
      summary: "आपका हीमोग्लोबिन 10.2 g/dL है। यह थोड़ा कम है, जिससे आप थकान या सांस फूलना महसूस कर सकते हैं।",
      advice: "इस सप्ताह अपने डॉक्टर के साथ एक गैर-आपातकालीन अपॉइंटमेंट शेड्यूल करें।",
      typeSymptoms: "अपने लक्षण लिखें", typePlaceholder: "बताएं कि आप कैसा महसूस कर रहे हैं...",
      submitSymptoms: "लक्षणों का विश्लेषण करें"
    },
    Konkani: {
      welcome: "मेडट्रांसलेट", subtitle: "एआय वैजकी अणकारपी आनी ट्रायज",
      upload: "लॅब रिपोर्ट अपलोड करा", triage: "स्थिती",
      history: "वैद्यकीय इतिहास", analyze: "तपासणी करा", next: "पुढील पावले",
      subtext: "खंयचेय मेडिकल लॅब रिपोर्ट पीडीएफ खातीर साद्या भाशेंत सारांश मेळयात।",
      selectBtn: "रिपोर्ट वेंचून काढा", tools: "साधनां", accessibilityTitle: "एक्सेसिबिलिटी नियंत्रण",
      highContrast: "हाय कंट्रास्ट मोड", dyslexic: "डिस्लेक्सिक फॉन्ट",
      summary: "तुमचो हीमोग्लोबिन 10.2 g/dL आसा। हो थोडो उणो आसा, जाका लागून तुमकां थकवो येवंक शकता।",
      advice: "ह्या सप्तकांत तुमच्या डॉक्टरांकडे एक अपॉइंटमेंट बुक करात।",
      typeSymptoms: "तुमचीं लक्षणां बरयात", typePlaceholder: "तुमकां कशें दिसता तें सांगात...",
      submitSymptoms: "लक्षणांची तपासणी करा"
    },
    Tamil: {
      welcome: "மெட்டிரான்ஸ்லேட்", subtitle: "AI மருத்துவ மொழிபெயர்ப்பாளர் & ட்ரைஏஜ்",
      upload: "ஆய்வக அறிக்கையைப் பதிவேற்றவும்", triage: "ட்ரைஏஜ் நிலை",
      history: "மருத்துவ வரலாறு", analyze: "பகுப்பாய்வு", next: "அடுத்த கட்டங்கள்",
      subtext: "எந்தவொரு மருத்துவ ஆய்வக அறிக்கை PDF க்கும் எளிய மொழி சுருக்கத்தைப் பெறுங்கள்.",
      selectBtn: "அறிக்கையைத் தேர்ந்தெடுக்கவும்", tools: "கருவிகள்", accessibilityTitle: "அணுகல்தன்மை கட்டுப்பாடுகள்",
      highContrast: "உயர்ந்த மாறுபாடு முறை", dyslexic: "டிஸ்லெக்சிக் எழுத்துரு",
      summary: "உங்கள் ஹீமோகுளோபின் 10.2 g/dL ஆகும். இது சற்று குறைவாக உள்ளது, இது உங்களை சோர்வாக உணரச் செய்யும்.",
      advice: "இந்த வாரம் உங்கள் மருத்துவருடன் ஒரு சந்திப்பைத் திட்டமிடுங்கள்.",
      typeSymptoms: "உங்கள் அறிகுறிகளை தட்டச்சு செய்யவும்", typePlaceholder: "நீங்கள் எப்படி உணருகிறீர்கள் என்று விவரிக்கவும்...",
      submitSymptoms: "அறிகுறிகளை பகுப்பாய்வு செய்யவும்"
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) { root.classList.add('dark'); root.style.backgroundColor = "#0f172a"; }
    else { root.classList.remove('dark'); root.style.backgroundColor = "#f8fafc"; }
    if (accessibility.highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    if (accessibility.dyslexic) root.classList.add('dyslexic-font'); else root.classList.remove('dyslexic-font');
  }, [isDark, accessibility]);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Use the symptom text if in text mode, otherwise use mock PDF report text
      const reportText = inputMode === 'text' && symptomText.trim()
        ? symptomText
        : 'Your hemoglobin is 10.2 g/dL. This is slightly low (anemia). Liver function tests show elevated ALT. Blood sugar levels indicate pre-diabetes. Kidney function (creatinine) is borderline.';

      const detectedOrgans = detectAffectedOrgans(reportText);

      const mockResult: MedicalResult = {
        date: new Date().toLocaleDateString(),
        summary: "summary",
        advice: "advice",
        triage: "Yellow",
        affectedOrgans: detectedOrgans
      };
      setResult(mockResult);
      setHistory(prev => [mockResult, ...prev]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    runAnalysis();
  };

  const themeColors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#0f172a',
    border: isDark ? '#334155' : '#e2e8f0'
  };

  const PreferenceContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">Language</span>
        <select className="bg-transparent font-bold text-blue-500 outline-none" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          <option value="English">English</option><option value="Hindi">Hindi</option><option value="Konkani">Konkani</option><option value="Tamil">Tamil</option>
        </select>
      </div>
      <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">Appearance</span>
        {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
      </button>
      <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">Dyslexic Font</span>
        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={accessibility.dyslexic} onChange={() => setAccessibility(prev => ({ ...prev, dyslexic: !prev.dyslexic }))} />
      </div>
      <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">High Contrast Mode</span>
        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={accessibility.highContrast} onChange={() => setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast }))} />
      </div>
    </div>
  );

  if (step === 'landing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6" style={{ backgroundColor: themeColors.bg }}>
        <Shield size={80} className="text-blue-500 mb-6" />
        <h1 className="text-5xl font-black mb-4" style={{ color: themeColors.text }}>{t[language].welcome}</h1>
        <p className="text-xl opacity-60 mb-10">{t[language].subtitle}</p>
        <button onClick={() => setStep('preferences')} className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl scale-110 shadow-xl hover:bg-blue-700">
          GET STARTED <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor: themeColors.bg }}>
        <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-8">
          <h2 className="text-2xl font-black text-center" style={{ color: themeColors.text }}>Set Your Preferences</h2>
          <PreferenceContent />
          <button onClick={() => setStep('login')} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all">SAVE & CONTINUE</button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor: themeColors.bg }}>
        <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-10 rounded-3xl border shadow-2xl text-center">
          <Lock className="text-blue-600 mx-auto mb-6" size={40} />
          <h2 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>Secure Login</h2>
          <p className="text-sm opacity-50 mb-8 italic">Data remains stateless for trust.</p>
          <div className="space-y-4 mb-8 text-left">
            <input type="text" placeholder="Username" className="w-full p-4 rounded-2xl border outline-none bg-transparent" style={{ borderColor: themeColors.border }} />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl border outline-none bg-transparent" style={{ borderColor: themeColors.border }} />
          </div>
          <button onClick={() => setStep('dashboard')} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl">ENTER DASHBOARD</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: themeColors.bg, color: themeColors.text, minHeight: '100vh' }}>
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-8 rounded-3xl border shadow-2xl relative">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-6" style={{ color: themeColors.text }}>Update Preferences</h2>
            <PreferenceContent />
            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 py-4 bg-blue-600 text-white font-black rounded-2xl">CLOSE</button>
          </div>
        </div>
      )}

      <nav style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight">{t[language].welcome}</h1>
        </div>
        <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-lg border hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors" style={{ borderColor: themeColors.border }}>
          <Settings size={20} />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderColor: themeColors.border }} className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit border">
          <button onClick={() => setCurrentTab('analyze')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'analyze' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
            <Send size={16} /> {t[language].analyze}
          </button>
          <button onClick={() => setCurrentTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>
            <History size={16} /> {t[language].history}
          </button>
        </div>

        {currentTab === 'analyze' && (
          <div className="space-y-6 animate-fade-in">
            {/* 3D MODEL VIEWER */}
            <div className="w-full h-[450px] relative mt-4 mb-4">
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.6} adjustCamera={1.2}>
                    <AnatomyModel />
                  </Stage>
                </Suspense>
                <OrbitControls enableZoom={false} />
              </Canvas>
            </div>

            {/* INPUT MODE TOGGLE */}
            <div className="flex gap-4 border-b dark:border-slate-700 pb-2">
              <button onClick={() => setInputMode('pdf')} className={`flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'pdf' ? 'border-b-4 border-blue-500 text-blue-500' : 'opacity-40'}`}>
                <FileText size={18} /> {t[language].upload}
              </button>
              <button onClick={() => setInputMode('text')} className={`flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'text' ? 'border-b-4 border-blue-500 text-blue-500' : 'opacity-40'}`}>
                <MessageSquare size={18} /> {t[language].typeSymptoms}
              </button>
            </div>

            <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border-2 border-dashed p-10 text-center shadow-inner">
              {inputMode === 'pdf' ? (
                <>
                  <Upload size={40} className="text-blue-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-black mb-2">{t[language].upload}</h2>
                  <p className="mb-8 max-w-xs mx-auto text-sm opacity-60">{t[language].subtext}</p>
                  <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" accept=".pdf" />
                  <label htmlFor="file-upload" className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl cursor-pointer hover:bg-blue-700 inline-block active:scale-95 transition-all">
                    {t[language].selectBtn}
                  </label>
                </>
              ) : (
                <div className="text-left space-y-4">
                  <h2 className="text-2xl font-black text-center mb-4">{t[language].typeSymptoms}</h2>
                  <textarea
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }}
                    className="w-full h-32 p-4 rounded-2xl border outline-none resize-none"
                    placeholder={t[language].typePlaceholder}
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                  />
                  <button
                    disabled={!symptomText.trim()}
                    onClick={runAnalysis}
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-30 transition-all"
                  >
                    {t[language].submitSymptoms}
                  </button>
                </div>
              )}
            </div>

            {isAnalyzing && <p className="text-center animate-pulse text-blue-500 font-bold uppercase tracking-widest text-xs">Analyzing with RAG Pipeline...</p>}

            {result && !isAnalyzing && (
              <>
                <div style={{ backgroundColor: themeColors.card }} className={`rounded-3xl border-l-[16px] p-8 shadow-xl animate-slide-in ${result.triage === 'Yellow' ? 'border-yellow-500' : 'border-red-500'}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 opacity-50">
                    <AlertTriangle size={18} className={result.triage === 'Yellow' ? 'text-yellow-500' : 'text-red-500'} /> {t[language].triage}
                  </h3>
                  <p className="text-2xl font-bold leading-snug mb-8">"{t[language].summary}"</p>
                  <div style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }} className="p-6 rounded-2xl border">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{t[language].next}:</p>
                    <p className="text-sm opacity-80">{t[language].advice}</p>
                  </div>
                </div>

                {/* 2D BODY MAP — shows affected organs */}
                {result.affectedOrgans.length > 0 && (
                  <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border p-8 shadow-xl animate-slide-in">
                    <BodyMap affectedOrgans={result.affectedOrgans} isDark={isDark} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-black mb-6">{t[language].history}</h2>
            {history.length === 0 ? <p className="text-center opacity-40">No records stored locally.</p> : history.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="p-6 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <Clock size={20} className="text-slate-400" />
                  <div><p className="font-black">{item.date}</p><p className="text-xs opacity-50">{t[language].summary}</p></div>
                </div>
                <CheckCircle size={22} className="text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;