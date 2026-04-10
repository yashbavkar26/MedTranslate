import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, Suspense } from 'react';
import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
function AnatomyModel() {
    const { scene } = useGLTF('/front_body_anatomy.glb');
    const meshRef = useRef(null);
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });
    return _jsx("primitive", { ref: meshRef, object: scene });
}
useGLTF.preload('/front_body_anatomy.glb');
const App = () => {
    // --- STATE ---
    const [step, setStep] = useState('landing');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [currentTab, setCurrentTab] = useState('analyze');
    const [inputMode, setInputMode] = useState('pdf');
    const [language, setLanguage] = useState('English');
    const [accessibility, setAccessibility] = useState({ dyslexic: false, highContrast: false });
    const [isDark, setIsDark] = useState(true);
    const [history, setHistory] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [symptomText, setSymptomText] = useState("");
    // --- TRANSLATIONS (Updated with Input Mode Strings) ---
    const t = {
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
        if (isDark) {
            root.classList.add('dark');
            root.style.backgroundColor = "#0f172a";
        }
        else {
            root.classList.remove('dark');
            root.style.backgroundColor = "#f8fafc";
        }
        if (accessibility.highContrast)
            root.classList.add('high-contrast');
        else
            root.classList.remove('high-contrast');
        if (accessibility.dyslexic)
            root.classList.add('dyslexic-font');
        else
            root.classList.remove('dyslexic-font');
    }, [isDark, accessibility]);
    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const mockResult = {
                date: new Date().toLocaleDateString(),
                summary: "summary",
                advice: "advice",
                triage: "Yellow"
            };
            setResult(mockResult);
            setHistory(prev => [mockResult, ...prev]);
            setIsAnalyzing(false);
        }, 2000);
    };
    const handleFileUpload = (e) => {
        if (!e.target.files)
            return;
        runAnalysis();
    };
    const themeColors = {
        bg: isDark ? '#0f172a' : '#f8fafc',
        card: isDark ? '#1e293b' : '#ffffff',
        text: isDark ? '#f1f5f9' : '#0f172a',
        border: isDark ? '#334155' : '#e2e8f0'
    };
    const PreferenceContent = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between p-4 rounded-2xl border transition-all", style: { borderColor: themeColors.border }, children: [_jsx("span", { className: "font-bold", children: "Language" }), _jsxs("select", { className: "bg-transparent font-bold text-blue-500 outline-none", value: language, onChange: (e) => setLanguage(e.target.value), children: [_jsx("option", { value: "English", children: "English" }), _jsx("option", { value: "Hindi", children: "Hindi" }), _jsx("option", { value: "Konkani", children: "Konkani" }), _jsx("option", { value: "Tamil", children: "Tamil" })] })] }), _jsxs("button", { onClick: () => setIsDark(!isDark), className: "w-full flex items-center justify-between p-4 rounded-2xl border transition-all", style: { borderColor: themeColors.border }, children: [_jsx("span", { className: "font-bold", children: "Appearance" }), isDark ? _jsx(Sun, { size: 20, className: "text-yellow-400" }) : _jsx(Moon, { size: 20, className: "text-blue-600" })] }), _jsxs("div", { className: "flex items-center justify-between p-4 rounded-2xl border", style: { borderColor: themeColors.border }, children: [_jsx("span", { className: "font-bold", children: "Dyslexic Font" }), _jsx("input", { type: "checkbox", className: "w-5 h-5 accent-blue-600", checked: accessibility.dyslexic, onChange: () => setAccessibility(prev => ({ ...prev, dyslexic: !prev.dyslexic })) })] }), _jsxs("div", { className: "flex items-center justify-between p-4 rounded-2xl border", style: { borderColor: themeColors.border }, children: [_jsx("span", { className: "font-bold", children: "High Contrast Mode" }), _jsx("input", { type: "checkbox", className: "w-5 h-5 accent-blue-600", checked: accessibility.highContrast, onChange: () => setAccessibility(prev => ({ ...prev, highContrast: !prev.highContrast })) })] })] }));
    if (step === 'landing') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen text-center p-6", style: { backgroundColor: themeColors.bg }, children: [_jsx(Shield, { size: 80, className: "text-blue-500 mb-6" }), _jsx("h1", { className: "text-5xl font-black mb-4", style: { color: themeColors.text }, children: t[language].welcome }), _jsx("p", { className: "text-xl opacity-60 mb-10", children: t[language].subtitle }), _jsxs("button", { onClick: () => setStep('preferences'), className: "flex items-center gap-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl scale-110 shadow-xl hover:bg-blue-700", children: ["GET STARTED ", _jsx(ChevronRight, { size: 20 })] })] }));
    }
    if (step === 'preferences') {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen p-6", style: { backgroundColor: themeColors.bg }, children: _jsxs("div", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-8", children: [_jsx("h2", { className: "text-2xl font-black text-center", style: { color: themeColors.text }, children: "Set Your Preferences" }), _jsx(PreferenceContent, {}), _jsx("button", { onClick: () => setStep('login'), className: "w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all", children: "SAVE & CONTINUE" })] }) }));
    }
    if (step === 'login') {
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen p-6", style: { backgroundColor: themeColors.bg }, children: _jsxs("div", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "w-full max-w-md p-10 rounded-3xl border shadow-2xl text-center", children: [_jsx(Lock, { className: "text-blue-600 mx-auto mb-6", size: 40 }), _jsx("h2", { className: "text-3xl font-black mb-2", style: { color: themeColors.text }, children: "Secure Login" }), _jsx("p", { className: "text-sm opacity-50 mb-8 italic", children: "Data remains stateless for trust." }), _jsxs("div", { className: "space-y-4 mb-8 text-left", children: [_jsx("input", { type: "text", placeholder: "Username", className: "w-full p-4 rounded-2xl border outline-none bg-transparent", style: { borderColor: themeColors.border } }), _jsx("input", { type: "password", placeholder: "Password", className: "w-full p-4 rounded-2xl border outline-none bg-transparent", style: { borderColor: themeColors.border } })] }), _jsx("button", { onClick: () => setStep('dashboard'), className: "w-full py-4 bg-blue-600 text-white font-black rounded-2xl", children: "ENTER DASHBOARD" })] }) }));
    }
    return (_jsxs("div", { style: { backgroundColor: themeColors.bg, color: themeColors.text, minHeight: '100vh' }, children: [showSettingsModal && (_jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm", children: _jsxs("div", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "w-full max-w-md p-8 rounded-3xl border shadow-2xl relative", children: [_jsx("button", { onClick: () => setShowSettingsModal(false), className: "absolute top-4 right-4 p-2 opacity-50 hover:opacity-100", children: _jsx(X, { size: 24 }) }), _jsx("h2", { className: "text-2xl font-black mb-6", style: { color: themeColors.text }, children: "Update Preferences" }), _jsx(PreferenceContent, {}), _jsx("button", { onClick: () => setShowSettingsModal(false), className: "w-full mt-8 py-4 bg-blue-600 text-white font-black rounded-2xl", children: "CLOSE" })] }) })), _jsxs("nav", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "text-blue-500" }), _jsx("h1", { className: "text-xl font-bold tracking-tight", children: t[language].welcome })] }), _jsx("button", { onClick: () => setShowSettingsModal(true), className: "p-2 rounded-lg border hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors", style: { borderColor: themeColors.border }, children: _jsx(Settings, { size: 20 }) })] }), _jsxs("main", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("div", { style: { backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderColor: themeColors.border }, className: "flex gap-2 mb-8 p-1.5 rounded-2xl w-fit border", children: [_jsxs("button", { onClick: () => setCurrentTab('analyze'), className: `flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'analyze' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`, children: [_jsx(Send, { size: 16 }), " ", t[language].analyze] }), _jsxs("button", { onClick: () => setCurrentTab('history'), className: `flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`, children: [_jsx(History, { size: 16 }), " ", t[language].history] })] }), currentTab === 'analyze' && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsx("div", { className: "w-full h-80 rounded-3xl overflow-hidden border shadow-inner relative", style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, children: _jsxs(Canvas, { camera: { position: [0, 0, 5], fov: 50 }, children: [_jsx(Suspense, { fallback: null, children: _jsx(Stage, { environment: "city", intensity: 0.6, children: _jsx(AnatomyModel, {}) }) }), _jsx(OrbitControls, { enableZoom: false })] }) }), _jsxs("div", { className: "flex gap-4 border-b dark:border-slate-700 pb-2", children: [_jsxs("button", { onClick: () => setInputMode('pdf'), className: `flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'pdf' ? 'border-b-4 border-blue-500 text-blue-500' : 'opacity-40'}`, children: [_jsx(FileText, { size: 18 }), " ", t[language].upload] }), _jsxs("button", { onClick: () => setInputMode('text'), className: `flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'text' ? 'border-b-4 border-blue-500 text-blue-500' : 'opacity-40'}`, children: [_jsx(MessageSquare, { size: 18 }), " ", t[language].typeSymptoms] })] }), _jsx("div", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "rounded-3xl border-2 border-dashed p-10 text-center shadow-inner", children: inputMode === 'pdf' ? (_jsxs(_Fragment, { children: [_jsx(Upload, { size: 40, className: "text-blue-500 mx-auto mb-6" }), _jsx("h2", { className: "text-2xl font-black mb-2", children: t[language].upload }), _jsx("p", { className: "mb-8 max-w-xs mx-auto text-sm opacity-60", children: t[language].subtext }), _jsx("input", { type: "file", onChange: handleFileUpload, className: "hidden", id: "file-upload", accept: ".pdf" }), _jsx("label", { htmlFor: "file-upload", className: "px-10 py-4 bg-blue-600 text-white font-black rounded-2xl cursor-pointer hover:bg-blue-700 inline-block active:scale-95 transition-all", children: t[language].selectBtn })] })) : (_jsxs("div", { className: "text-left space-y-4", children: [_jsx("h2", { className: "text-2xl font-black text-center mb-4", children: t[language].typeSymptoms }), _jsx("textarea", { style: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }, className: "w-full h-32 p-4 rounded-2xl border outline-none resize-none", placeholder: t[language].typePlaceholder, value: symptomText, onChange: (e) => setSymptomText(e.target.value) }), _jsx("button", { disabled: !symptomText.trim(), onClick: runAnalysis, className: "w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-30 transition-all", children: t[language].submitSymptoms })] })) }), isAnalyzing && _jsx("p", { className: "text-center animate-pulse text-blue-500 font-bold uppercase tracking-widest text-xs", children: "Analyzing with RAG Pipeline..." }), result && !isAnalyzing && (_jsxs("div", { style: { backgroundColor: themeColors.card }, className: `rounded-3xl border-l-[16px] p-8 shadow-xl animate-slide-in ${result.triage === 'Yellow' ? 'border-yellow-500' : 'border-red-500'}`, children: [_jsxs("h3", { className: "text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 opacity-50", children: [_jsx(AlertTriangle, { size: 18, className: result.triage === 'Yellow' ? 'text-yellow-500' : 'text-red-500' }), " ", t[language].triage] }), _jsxs("p", { className: "text-2xl font-bold leading-snug mb-8", children: ["\"", t[language].summary, "\""] }), _jsxs("div", { style: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }, className: "p-6 rounded-2xl border", children: [_jsxs("p", { className: "text-xs font-black text-blue-600 uppercase tracking-widest mb-1", children: [t[language].next, ":"] }), _jsx("p", { className: "text-sm opacity-80", children: t[language].advice })] })] }))] })), currentTab === 'history' && (_jsxs("div", { className: "space-y-4 animate-fade-in", children: [_jsx("h2", { className: "text-2xl font-black mb-6", children: t[language].history }), history.length === 0 ? _jsx("p", { className: "text-center opacity-40", children: "No records stored locally." }) : history.map((item, idx) => (_jsxs("div", { style: { backgroundColor: themeColors.card, borderColor: themeColors.border }, className: "p-6 rounded-2xl border flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-5", children: [_jsx(Clock, { size: 20, className: "text-slate-400" }), _jsxs("div", { children: [_jsx("p", { className: "font-black", children: item.date }), _jsx("p", { className: "text-xs opacity-50", children: t[language].summary })] })] }), _jsx(CheckCircle, { size: 22, className: "text-emerald-500" })] }, idx)))] }))] })] }));
};
export default App;
