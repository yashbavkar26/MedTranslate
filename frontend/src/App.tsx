import React, { useState, useEffect, ChangeEvent, useRef, Suspense } from 'react';
import { Upload, History, Settings, AlertTriangle, Shield, Send, Clock, CheckCircle, Moon, Sun, ChevronRight, Lock, X, FileText, MessageSquare, Wifi, WifiOff, Leaf, Stethoscope, HelpCircle, Mic, MicOff, MapPin, PhoneCall, ArrowRight, User, Activity, Droplet, MoreVertical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BodyMap, { detectAffectedOrgans, OrganId } from './BodyMap';
import { checkHealth, analyzeText, uploadReport, chatFollowUp, translateResult } from './api';

const ORGAN_COORDS: Record<OrganId, [number, number, number][]> = {
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
          <GlowOrb key={`${organ}-${idx}`} position={pos} />
        ))
      )}
    </group>
  );
}
useGLTF.preload('/front_body_anatomy.glb');

// --- TYPES & INTERFACES ---
interface MedicalResult {
  date: string;
  explanation: string;
  urgency: 'urgent' | 'soon' | 'self_care';
  uncertainty: string;
  safeNextSteps: string[];
  warningSigns: string[];
  doctorVisitGuidance: string;
  homeRemedies?: { remedy: string; instruction: string }[];
  affectedOrgans: OrganId[];
  sessionId?: string;
  safetyNotice?: string;
  healthScore?: number;
  patientInfo?: { name: string; age: string; gender: string; bloodType: string; weight: string };
  vitals?: { name: string; value: string; status: string; highlight: boolean }[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function urgencyToTriage(urgency: string): 'Red' | 'Yellow' | 'Green' {
  if (urgency === 'urgent') return 'Red';
  if (urgency === 'soon') return 'Yellow';
  return 'Green';
}

function triageColor(triage: 'Red' | 'Yellow' | 'Green'): string {
  if (triage === 'Red') return '#ef4444';
  if (triage === 'Yellow') return '#eab308';
  return '#22c55e';
}

function tryParseJson(raw: string): Record<string, any> | null {
  if (!raw || !raw.trim()) return null;
  // 1. Try direct parse
  try { return JSON.parse(raw); } catch { /* continue */ }
  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }
  // 3. Extract first { ... } block
  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(raw.slice(braceStart, braceEnd + 1)); } catch { /* continue */ }
  }
  return null;
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
  const [currentTab, setCurrentTab] = useState<'analyze' | 'history' | 'specialists'>('analyze');
  const [inputMode, setInputMode] = useState<InputMode>('pdf');
  const [language, setLanguage] = useState<Language>('English');
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({ dyslexic: false, highContrast: false });
  const [isDark, setIsDark] = useState<boolean>(true);
  const [history, setHistory] = useState<Record<string, MedicalResult[]>>(() => {
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
  };

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<MedicalResult | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [nearbyClinics, setNearbyClinics] = useState<{name: string, type: string, dist: string}[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  // Patient Info Form
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeight, setPatientWeight] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMode, setPendingMode] = useState<'pdf' | 'text'>('pdf');

  const recognitionRef = useRef<any>(null);

  // --- LIVE GEOLOCATION ---
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
    const query = `[out:json][timeout:15];(node["amenity"~"hospital|clinic|doctors"](around:${radius},${lat},${lon});way["amenity"~"hospital|clinic|doctors"](around:${radius},${lat},${lon}););out body center 10;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
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
  }, [userLocation]);

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
  };

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
      submitSymptoms: "Analyze Symptoms",
      warningSigns: "Warning Signs", doctorGuidance: "Doctor Visit Guidance",
      homeRemedies: "Home Remedies", askFollowUp: "Ask Follow-up Questions",
      thinking: "Thinking...", chatPlaceholder: "Ask about your report...",
      // Medicare Dashboard
      patientInfo: "Patient Info", patientBody: "Patient Body", healthCondition: "Health Condition",
      medicalExtraction: "Medical Extraction", translationComplete: "Translation complete",
      computedViaTriage: "{t[language].computedViaTriage}",
      // Specialists
      findSpecialists: "Find Specialists", specialistsTitle: "Local Specialists Directory",
      specialistsDesc: "Find certified doctors and clinics in your area, automatically matched to your triage needs.",
      fetchingClinics: "Fetching nearby clinics...", noClinics: "No facilities found nearby.",
      liveLocation: "Live Location", scanning: "Scanning...", nearby: "Nearby",
      // Patient Form
      patientDetails: "Patient Details", patientFormDesc: "Enter the patient's information before proceeding with analysis.",
      fullName: "Full Name", age: "Age", weightKg: "Weight (kg)",
      proceedAnalysis: "PROCEED WITH ANALYSIS",
      // History
      noRecordsYet: "No Medical Records Yet", noRecordsDesc: "Upload a report or type symptoms to start building your patient history.",
      startAnalysis: "Start Analysis", record: "record", records: "records",
      // Emergency
      emergencyTitle: "Emergency Action Center", emergencyDesc: "Based on your condition, we strongly suggest visiting an emergency room immediately.",
      findHospitals: "Find Hospitals Nearby",
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
      submitSymptoms: "लक्षणों का विश्लेषण करें",
      warningSigns: "चेतावनी के संकेत", doctorGuidance: "डॉक्टर के पास जाने का मार्गदर्शन",
      homeRemedies: "घरेलू उपचार", askFollowUp: "अनुवर्ती प्रश्न पूछें",
      thinking: "सोच रहा है...", chatPlaceholder: "अपनी रिपोर्ट के बारे में पूछें...",
      // Medicare Dashboard
      patientInfo: "रोगी जानकारी", patientBody: "रोगी शरीर", healthCondition: "स्वास्थ्य स्थिति",
      medicalExtraction: "चिकित्सा निष्कर्ष", translationComplete: "अनुवाद पूर्ण",
      computedViaTriage: "ट्राइएज मैट्रिक्स द्वारा गणना",
      // Specialists
      findSpecialists: "विशेषज्ञ खोजें", specialistsTitle: "स्थानीय विशेषज्ञ निर्देशिका",
      specialistsDesc: "आपके क्षेत्र में प्रमाणित डॉक्टर और क्लीनिक खोजें।",
      fetchingClinics: "नज़दीकी क्लीनिक खोज रहे हैं...", noClinics: "पास में कोई सुविधा नहीं मिली।",
      liveLocation: "लाइव स्थान", scanning: "स्कैनिंग...", nearby: "पास में",
      // Patient Form
      patientDetails: "रोगी विवरण", patientFormDesc: "विश्लेषण से पहले रोगी की जानकारी दर्ज करें।",
      fullName: "पूरा नाम", age: "आयु", weightKg: "वज़न (किग्रा)",
      proceedAnalysis: "विश्लेषण जारी रखें",
      // History
      noRecordsYet: "अभी तक कोई मेडिकल रिकॉर्ड नहीं", noRecordsDesc: "अपना रोगी इतिहास बनाने के लिए एक रिपोर्ट अपलोड करें या लक्षण टाइप करें।",
      startAnalysis: "विश्लेषण शुरू करें", record: "रिकॉर्ड", records: "रिकॉर्ड",
      // Emergency
      emergencyTitle: "आपातकालीन कार्य केंद्र", emergencyDesc: "आपकी स्थिति के आधार पर, हम तुरंत आपातकालीन कक्ष जाने का सुझाव देते हैं।",
      findHospitals: "पास के अस्पताल खोजें",
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
      submitSymptoms: "लक्षणांची तपासणी करा",
      warningSigns: "शिटकावणेचे संकेत", doctorGuidance: "डॉक्टराकडे वचपाचे मार्गदर्शन",
      homeRemedies: "घरगुती उपाय", askFollowUp: "उपरांतचे प्रस्न विचारात",
      thinking: "शोक करता...", chatPlaceholder: "तुमच्या रिपोर्टाबद्दल विचारात...",
      // Medicare Dashboard
      patientInfo: "दुयेंती माहिती", patientBody: "दुयेंत्याचें कूड", healthCondition: "भलायकेची स्थिती",
      medicalExtraction: "वैजकी निश्कर्श", translationComplete: "अणकार पुराय",
      computedViaTriage: "ट्रायज मॅट्रिक्स वरवीं गणना",
      // Specialists
      findSpecialists: "तज्ञ सोदात", specialistsTitle: "स्थानीक तज्ञ निर्देशिका",
      specialistsDesc: "तुमच्या वाठारांत प्रमाणित दोतोर आनी क्लिनिक सोदात।",
      fetchingClinics: "लागींच्या क्लिनिक सोदतात...", noClinics: "लागीं कसलीय सुविधा मेळ्ळी ना।",
      liveLocation: "लायव्ह स्थान", scanning: "स्कॅनिंग...", nearby: "लागीं",
      // Patient Form
      patientDetails: "दुयेंती तपशील", patientFormDesc: "तपासणे आदीं दुयेंत्याची माहिती भरात।",
      fullName: "पुराय नांव", age: "पिराय", weightKg: "वजन (किग्रॅ)",
      proceedAnalysis: "तपासणी सुरू करात",
      // History
      noRecordsYet: "अजून कसलेच वैजकी रेकॉर्ड नात", noRecordsDesc: "तुमचो दुयेंत इतिहास बांदपाक एक रिपोर्ट अपलोड करात.",
      startAnalysis: "तपासणी सुरू करात", record: "रेकॉर्ड", records: "रेकॉर्ड",
      // Emergency
      emergencyTitle: "आपत्कालीन कार्य केंद्र", emergencyDesc: "तुमच्या परिस्थिती प्रमाणें, आमी तातडीन ER वच्चें सुचयतात.",
      findHospitals: "लागींचे इस्पितळ सोदात",
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
      submitSymptoms: "அறிகுறிகளை பகுப்பாய்வு செய்யவும்",
      warningSigns: "எச்சரிக்கை அறிகுறிகள்", doctorGuidance: "மருத்துவர் சந்திப்பு வழிகாட்டுதல்",
      homeRemedies: "வீட்டு வைத்தியம்", askFollowUp: "பின்தொடர்தல் கேள்விகளைக் கேளுங்கள்",
      thinking: "சிந்திக்கிறது...", chatPlaceholder: "உங்கள் அறிக்கை பற்றி கேளுங்கள்...",
      // Medicare Dashboard
      patientInfo: "நோயாளி தகவல்", patientBody: "நோயாளி உடல்", healthCondition: "உடல்நிலை",
      medicalExtraction: "மருத்துவ பிரித்தெடுப்பு", translationComplete: "மொழிபெயர்ப்பு முடிந்தது",
      computedViaTriage: "ட்ரைஏஜ் மூலம் கணக்கிடப்பட்டது",
      // Specialists
      findSpecialists: "நிபுணர்களைக் கண்டறிக", specialistsTitle: "உள்ளூர் நிபுணர் கோப்பகம்",
      specialistsDesc: "உங்கள் பகுதியில் சான்றளிக்கப்பட்ட மருத்துவர்கள் மற்றும் கிளினிக்களைக் கண்டறியுங்கள்.",
      fetchingClinics: "அருகிலுள்ள கிளினிக்களைத் தேடுகிறது...", noClinics: "அருகில் வசதிகள் எதுவும் கிடைக்கவில்லை.",
      liveLocation: "நேரடி இருப்பிடம்", scanning: "ஸ்கேன் செய்கிறது...", nearby: "அருகில்",
      // Patient Form
      patientDetails: "நோயாளி விவரங்கள்", patientFormDesc: "பகுப்பாய்வுக்கு முன் நோயாளியின் தகவலை உள்ளிடவும்.",
      fullName: "முழுப் பெயர்", age: "வயது", weightKg: "எடை (கிலோ)",
      proceedAnalysis: "பகுப்பாய்வைத் தொடரவும்",
      // History
      noRecordsYet: "இதுவரை மருத்துவ பதிவுகள் இல்லை", noRecordsDesc: "நோயாளி வரலாற்றை உருவாக்க ஒரு அறிக்கையைப் பதிவேற்றவும்.",
      startAnalysis: "பகுப்பாய்வைத் தொடங்கு", record: "பதிவு", records: "பதிவுகள்",
      // Emergency
      emergencyTitle: "அவசரகால நடவடிக்கை மையம்", emergencyDesc: "உங்கள் நிலையின் அடிப்படையில், உடனடியாக ER சென்று பரிசோதிக்க பரிந்துரைக்கிறோம்.",
      findHospitals: "அருகிலுள்ள மருத்துவமனைகளைக் கண்டறிக",
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) { root.classList.add('dark'); root.style.backgroundColor = "#0f172a"; }
    else { root.classList.remove('dark'); root.style.backgroundColor = "#f8fafc"; }
    if (accessibility.highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    if (accessibility.dyslexic) root.classList.add('dyslexic-font'); else root.classList.remove('dyslexic-font');
  }, [isDark, accessibility]);

  // --- HEALTH CHECK ON MOUNT ---
  useEffect(() => {
    checkHealth()
      .then((h) => setBackendOnline(h.ok))
      .catch(() => setBackendOnline(false));
  }, []);

  // --- HELPERS ---
  const VALID_ORGANS: OrganId[] = ['brain', 'eyes', 'lungs', 'heart', 'liver', 'stomach', 'kidneys', 'intestines', 'bones', 'blood', 'thyroid', 'spleen', 'pancreas', 'bladder'];

  function buildResult(parsed: Record<string, any>, sourceText: string, sessionId?: string, safetyNotice?: string): MedicalResult {
    // Use LLM-provided body parts, filtering to valid organ IDs; fall back to keyword detection
    let organs: OrganId[] = [];
    if (Array.isArray(parsed.affectedBodyParts) && parsed.affectedBodyParts.length > 0) {
      organs = parsed.affectedBodyParts.filter((p: string) => VALID_ORGANS.includes(p as OrganId)) as OrganId[];
    }
    if (organs.length === 0) {
      organs = detectAffectedOrgans(sourceText + ' ' + (parsed.explanation || ''));
    }

    return {
      date: new Date().toLocaleDateString(),
      explanation: parsed.explanation || 'No explanation returned.',
      urgency: (['urgent', 'soon', 'self_care'].includes(parsed.urgency) ? parsed.urgency : 'soon') as MedicalResult['urgency'],
      uncertainty: parsed.uncertainty || '',
      safeNextSteps: Array.isArray(parsed.safeNextSteps) ? parsed.safeNextSteps : [],
      warningSigns: Array.isArray(parsed.warningSigns) ? parsed.warningSigns : [],
      doctorVisitGuidance: parsed.doctorVisitGuidance || '',
      homeRemedies: Array.isArray(parsed.homeRemedies) ? parsed.homeRemedies : undefined,
      affectedOrgans: organs,
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
  }

  // --- LIVE TRANSLATION ---
  useEffect(() => {
    // If the user changes language and we have a current result, dynamically translate it!
    if (result && !isAnalyzing) {
      const reTranslate = async () => {
        setIsAnalyzing(true);
        try {
          const res = await translateResult(result, language);
          if (res && res.result) {
            // Preserve Medicare fields that the translation endpoint doesn't know about
            const translated = {
              ...(res.result as MedicalResult),
              healthScore: result.healthScore,
              patientInfo: result.patientInfo,
              vitals: result.vitals,
              affectedOrgans: result.affectedOrgans,
            };
            setResult(translated);
          }
        } catch(err) {
          console.warn("[MedTranslate] live re-translation failed", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reTranslate();
    }
  }, [language]);


  // --- ANALYZE (text mode, intercepted by patient form) ---
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
  };

  // --- UPLOAD PDF (intercepted by patient form) ---
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
  };

  // --- CHAT FOLLOW-UP ---
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !result?.sessionId) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    try {
      const data = await chatFollowUp(result.sessionId, userMsg);
      const parsed = tryParseJson(data.response);
      const reply = parsed?.explanation || data.response || 'No response.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Chat failed.'}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const themeColors = {
    bg: isDark ? '#050b14' : '#f4fbff',
    card: isDark ? '#0a1628' : '#ffffff',
    border: isDark ? '#1a2c47' : '#dcfce7',
    text: isDark ? '#e0f2fe' : '#0f172a',
  };

  const PreferenceContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">Language</span>
        <select className="bg-transparent font-bold text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] outline-none" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          <option value="English">English</option><option value="Hindi">Hindi</option><option value="Konkani">Konkani</option><option value="Tamil">Tamil</option>
        </select>
      </div>
      <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all" style={{ borderColor: themeColors.border }}>
        <span className="font-bold">Appearance</span>
        {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-teal-600" />}
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
        <Shield size={80} className="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] mb-6" />
        <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-teal-400 to-cyan-500 text-transparent bg-clip-text tracking-tight drop-shadow-sm">{t[language].welcome}</h1>
        <p className="text-xl opacity-60 mb-10">{t[language].subtitle}</p>
        <button onClick={() => setStep('preferences')} className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl scale-110 shadow-xl hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all">
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
          <button onClick={() => setStep('login')} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all transition-all">SAVE & CONTINUE</button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor: themeColors.bg }}>
        <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-10 rounded-3xl border shadow-2xl text-center">
          <Lock className="text-teal-600 mx-auto mb-6" size={40} />
          <h2 className="text-3xl font-black mb-2" style={{ color: themeColors.text }}>Secure Login</h2>
          <p className="text-sm opacity-50 mb-8 italic">Data remains stateless for trust.</p>
          <div className="space-y-4 mb-8 text-left">
            <input type="text" placeholder="Username" className="w-full p-4 rounded-2xl border outline-none bg-transparent" style={{ borderColor: themeColors.border }} />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl border outline-none bg-transparent" style={{ borderColor: themeColors.border }} />
          </div>
          <button onClick={() => setStep('dashboard')} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl">ENTER DASHBOARD</button>
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
            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl">CLOSE</button>
          </div>
        </div>
      )}

      <nav style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => setStep('landing')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Shield className="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
          <h1 className="text-xl font-bold tracking-tight">{t[language].welcome}</h1>
        </button>
        <div className="flex items-center gap-3">
          {backendOnline !== null && (
            <span className="flex items-center gap-1.5 text-xs font-bold" title={backendOnline ? 'Backend connected' : 'Backend offline'}>
              {backendOnline ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-red-500" />}
              {backendOnline ? 'Online' : 'Offline'}
            </span>
          )}
          <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-lg border hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors" style={{ borderColor: themeColors.border }}>
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0', borderColor: themeColors.border }} className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit border">
          <button onClick={() => setCurrentTab('analyze')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'analyze' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}`}>
            <Send size={16} /> {t[language].analyze}
          </button>
          <button onClick={() => setCurrentTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'history' ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white shadow-md' : 'text-slate-500'}`}>
            <History size={16} /> {t[language].history}
          </button>
          <button onClick={() => setCurrentTab('specialists')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${currentTab === 'specialists' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 text-white shadow-md' : 'text-slate-500'}`}>
            <Stethoscope size={16} /> {t[language].findSpecialists}
          </button>
        </div>

        {currentTab === 'analyze' && (
          <div className="space-y-6 animate-fade-in">

            {/* ====== MEDICARE 3-COL DASHBOARD (only after result) ====== */}
            {result && !isAnalyzing ? (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 items-start">

                {/* LEFT COL: Patient + Donut */}
                <div className="space-y-6">
                  {/* Patient Info Card */}
                  <div className="p-6 rounded-[2rem] border bg-white/5 backdrop-blur-xl shadow-lg border-teal-500/20 relative">
                    <MoreVertical size={20} className="absolute top-6 right-6 opacity-40 cursor-pointer hover:opacity-100" />
                    <h3 className="font-bold text-xs opacity-60 mb-5 tracking-[0.2em] uppercase">{t[language].patientInfo}</h3>
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
                    <h3 className="font-bold text-xs opacity-60 mb-4 tracking-[0.2em] uppercase w-full text-left">{t[language].patientBody}</h3>
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="opacity-10" />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent"
                          className={`${(result.healthScore ?? 96) > 80 ? 'text-teal-500' : (result.healthScore ?? 96) > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                          strokeDasharray={`${(result.healthScore ?? 96) * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black">{result.healthScore ?? 96}%</span>
                        <span className="text-[9px] uppercase font-bold opacity-60 mt-0.5">{t[language].healthCondition}</span>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-40 mt-3 text-center"><AlertTriangle size={10} className="inline mr-1" />{t[language].computedViaTriage}</p>
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
                      <div key={i} className={`p-4 rounded-2xl border backdrop-blur-xl ${vital.highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-teal-500/10'} shadow-lg`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={`p-1 rounded-lg ${vital.highlight ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'}`}>
                            {i % 2 === 0 ? <Droplet size={12}/> : <Activity size={12}/>}
                          </div>
                          <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{vital.name}</span>
                        </div>
                        <h4 className={`text-lg font-black ${vital.highlight ? 'text-red-400' : ''}`}>{vital.value}</h4>
                        <svg className="w-full h-6 mt-1 opacity-40" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <polyline points="0,10 15,18 30,4 50,14 70,6 85,12 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-[2rem] border bg-white/5 border-white/10 shadow-xl backdrop-blur-md">
                    <h3 className="font-bold text-xs tracking-[0.2em] uppercase opacity-60 mb-3">{t[language].medicalExtraction}</h3>
                    <p className="text-sm font-bold leading-relaxed max-h-40 overflow-y-auto pr-1">{result.explanation}</p>
                    <p className="text-[11px] opacity-50 mt-3 italic flex items-center gap-1"><CheckCircle size={11}/> {t[language].translationComplete} ({language})</p>
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
            <div className={`${result && !isAnalyzing ? 'hidden' : ''}`}>

            {/* INPUT MODE TOGGLE */}
            <div className="flex gap-4 border-b dark:border-slate-700 pb-2">
              <button onClick={() => setInputMode('pdf')} className={`flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'pdf' ? 'border-b-4 border-blue-500 text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'opacity-40'}`}>
                <FileText size={18} /> {t[language].upload}
              </button>
              <button onClick={() => setInputMode('text')} className={`flex items-center gap-2 pb-2 px-2 transition-all font-bold ${inputMode === 'text' ? 'border-b-4 border-blue-500 text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'opacity-40'}`}>
                <MessageSquare size={18} /> {t[language].typeSymptoms}
              </button>
            </div>

            <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border-2 border-dashed p-10 text-center shadow-inner">
              {inputMode === 'pdf' ? (
                <>
                  <Upload size={40} className="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] mx-auto mb-6" />
                  <h2 className="text-2xl font-black mb-2">{t[language].upload}</h2>
                  <p className="mb-8 max-w-xs mx-auto text-sm opacity-60">{t[language].subtext}</p>
                  <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" accept=".pdf" />
                  <label htmlFor="file-upload" className="px-10 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl cursor-pointer hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all inline-block active:scale-95 transition-all">
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
                    onClick={triggerSymptomAnalysis}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 transition-all"
                  >
                    {t[language].submitSymptoms}
                  </button>
                </div>
              )}
            </div>

            {isAnalyzing && <p className="text-center animate-pulse text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] font-bold uppercase tracking-widest text-xs">Analyzing with AI Model...</p>}

            {error && !isAnalyzing && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold flex items-center gap-3">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {result && !isAnalyzing && (
              <>
                {/* Safety Notice */}
                {result.safetyNotice && (
                  <div style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#3b82f6' }} className="p-4 rounded-2xl border text-sm opacity-80 flex items-center gap-3">
                    <Shield size={16} className="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] flex-shrink-0" /> {result.safetyNotice}
                  </div>
                )}

                {/* Main Result Card */}
                <div style={{ backgroundColor: themeColors.card, borderLeftColor: triageColor(urgencyToTriage(result.urgency)) }} className="rounded-3xl border-l-[16px] p-8 shadow-xl animate-slide-in">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 opacity-50">
                    <AlertTriangle size={18} style={{ color: triageColor(urgencyToTriage(result.urgency)) }} /> {t[language].triage}: {urgencyToTriage(result.urgency)}
                  </h3>
                  <p className="text-xl font-bold leading-snug mb-6">{result.explanation}</p>

                  {/* Uncertainty */}
                  {result.uncertainty && (
                    <div className="flex items-start gap-2 mb-6 text-sm opacity-70 italic">
                      <HelpCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-500" />
                      {result.uncertainty}
                    </div>
                  )}

                  {/* Safe Next Steps */}
                  {result.safeNextSteps.length > 0 && (
                    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }} className="p-5 rounded-2xl border mb-4">
                      <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-3">{t[language].next}:</p>
                      <ul className="space-y-2">
                        {result.safeNextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning Signs */}
                  {result.warningSigns.length > 0 && (
                    <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 mb-4">
                      <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">⚠ {t[language].warningSigns}:</p>
                      <ul className="space-y-2">
                        {result.warningSigns.map((sign, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> {sign}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Doctor Visit Guidance */}
                  {result.doctorVisitGuidance && (
                    <div className="p-5 rounded-2xl border border-blue-500/20 bg-emerald-500/5">
                      <p className="text-xs font-black text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Stethoscope size={14} /> {t[language].doctorGuidance}:
                      </p>
                      <p className="text-sm">{result.doctorVisitGuidance}</p>
                    </div>
                  )}
                </div>

                {/* Home Remedies */}
                {result.homeRemedies && result.homeRemedies.length > 0 && (
                  <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border p-8 shadow-xl animate-slide-in">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-5 opacity-60">
                      <Leaf size={16} className="text-emerald-500" /> {t[language].homeRemedies}
                    </h3>
                    <div className="grid gap-3">
                      {result.homeRemedies.map((rem, i) => (
                        <div key={i} style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }} className="p-4 rounded-2xl border">
                          <p className="font-bold text-sm text-emerald-500 mb-1">{rem.remedy}</p>
                          <p className="text-xs opacity-70">{rem.instruction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2D BODY MAP — shows affected organs */}
                {result.affectedOrgans.length > 0 && (
                  <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border p-8 shadow-xl animate-slide-in">
                    <BodyMap affectedOrgans={result.affectedOrgans} isDark={isDark} />
                  </div>
                )}

                {/* CHAT FOLLOW-UP — only for PDF uploads with sessionId */}
                {result.sessionId && (
                  <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="rounded-3xl border p-8 shadow-xl animate-slide-in">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-5 opacity-60">
                      <MessageSquare size={16} className="text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" /> {t[language].askFollowUp}
                    </h3>

                    {/* Chat messages */}
                    {chatMessages.length > 0 && (
                      <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white'
                                : isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'
                              }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className={`p-3 rounded-2xl text-sm animate-pulse ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-slate-100 text-teal-600'}`}>
                              {t[language].thinking}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder={t[language].chatPlaceholder}
                        style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: themeColors.border }}
                        className="flex-1 p-3 rounded-2xl border outline-none text-sm"
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isChatting}
                        className="px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white rounded-2xl font-bold hover:from-teal-400 hover:to-cyan-500 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 transition-all flex items-center gap-2"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black mb-4">{t[language].history}</h2>
            {Object.keys(history).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border bg-white/5 backdrop-blur-xl" style={{ borderColor: themeColors.border }}>
                <FileText size={60} className="text-teal-500 mb-6 opacity-40" />
                <h3 className="text-xl font-black mb-2">{t[language].noRecordsYet}</h3>
                <p className="opacity-50 mb-6 text-sm max-w-xs">{t[language].noRecordsDesc}</p>
                <button onClick={() => setCurrentTab('analyze')} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-bold rounded-xl">{t[language].startAnalysis}</button>
              </div>
            ) : Object.entries(history).map(([pName, items]) => (
              <div key={pName} className="rounded-[2rem] border p-6 bg-white/5 backdrop-blur-xl" style={{ borderColor: themeColors.border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/30">
                    {pName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{pName}</h3>
                    <p className="text-xs opacity-50">{items.length} {items.length > 1 ? t[language].records : t[language].record}</p>
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
        )}

        {currentTab === 'specialists' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-8 rounded-[2rem] border shadow-2xl bg-white/5 backdrop-blur-xl border-emerald-500/30">
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Stethoscope className="text-emerald-500" size={32} /> {t[language].specialistsTitle}</h2>
              <p className="opacity-60 mb-8 max-w-2xl text-sm">{t[language].specialistsDesc}</p>
              <div className="flex flex-col md:flex-row gap-6 h-[500px]">
                <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
                  {loadingClinics && <p className="animate-pulse text-teal-500 font-bold text-center py-6">{t[language].fetchingClinics}</p>}
                  {!loadingClinics && nearbyClinics.length === 0 && <p className="text-center opacity-40 py-6">No facilities found in your area. Try expanding the range.</p>}
                  {nearbyClinics.map((clinic, i) => (
                    <div key={i} className={`p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors cursor-pointer ${i === 0 ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''}`}>
                      <h4 className={`font-black text-lg ${i === 0 ? 'text-emerald-400' : ''}`}>{clinic.name}</h4>
                      <p className="text-sm opacity-80 font-bold">{clinic.type} &bull; {clinic.dist}</p>
                      <p className="text-xs opacity-60 mt-2 flex items-center gap-1"><MapPin size={12}/> {t[language].nearby}</p>
                    </div>
                  ))}
                </div>
                <div className="w-full md:w-2/3 h-full rounded-3xl overflow-hidden border border-slate-700 relative shadow-inner">
                  {userLocation ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lon - 0.05}%2C${userLocation.lat - 0.05}%2C${userLocation.lon + 0.05}%2C${userLocation.lat + 0.05}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lon}`}
                      className="w-full h-full filter invert hue-rotate-[180deg] contrast-125 dark:opacity-90"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="animate-pulse text-teal-500 font-bold">{t[language].scanning}</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/50 flex items-center gap-2 animate-pulse">
                    <MapPin size={16} /> {userLocation ? t[language].liveLocation : t[language].scanning}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PATIENT INFO MODAL */}
      {showPatientForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }} className="w-full max-w-md p-8 rounded-3xl border shadow-2xl relative">
            <button onClick={() => { setShowPatientForm(false); setPendingFile(null); }} className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100"><X size={24} /></button>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2" style={{ color: themeColors.text }}><User size={28} className="text-teal-500" /> {t[language].patientDetails}</h2>
            <p className="text-sm opacity-50 mb-6">{t[language].patientFormDesc}</p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{t[language].fullName} *</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{t[language].age}</label>
                  <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 32" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{t[language].weightKg}</label>
                  <input type="number" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} placeholder="e.g. 72" className="w-full p-4 rounded-2xl border outline-none bg-transparent focus:ring-2 focus:ring-teal-500" style={{ borderColor: themeColors.border }} />
                </div>
              </div>
            </div>
            <button onClick={() => pendingMode === 'pdf' ? executeUpload() : executeAnalysis()} disabled={!patientName.trim()} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30 text-white font-black rounded-2xl disabled:opacity-30 hover:from-teal-400 hover:to-cyan-500 transition-all">
              {t[language].proceedAnalysis}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;