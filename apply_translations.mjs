import fs from 'fs';

const appPath = './frontend/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');
code = code.replace(/\r\n/g, '\n');

// ============================================================
// 1. Extend translation dictionaries with ALL new UI labels
// ============================================================

const newKeysEnglish = `
      // Medicare Dashboard
      patientInfo: "Patient Info", patientBody: "Patient Body", healthCondition: "Health Condition",
      medicalExtraction: "Medical Extraction", translationComplete: "Translation complete",
      computedViaTriage: "Computed via Triage matrix",
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
      findHospitals: "Find Hospitals Nearby",`;

const newKeysHindi = `
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
      findHospitals: "पास के अस्पताल खोजें",`;

const newKeysKonkani = `
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
      findHospitals: "लागींचे इस्पितळ सोदात",`;

const newKeysTamil = `
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
      findHospitals: "அருகிலுள்ள மருத்துவமனைகளைக் கண்டறிக",`;

// Inject keys into each language block
code = code.replace(
  `thinking: "Thinking...", chatPlaceholder: "Ask about your report..."
    },`,
  `thinking: "Thinking...", chatPlaceholder: "Ask about your report...",${newKeysEnglish}
    },`
);

code = code.replace(
  `thinking: "सोच रहा है...", chatPlaceholder: "अपनी रिपोर्ट के बारे में पूछें..."
    },`,
  `thinking: "सोच रहा है...", chatPlaceholder: "अपनी रिपोर्ट के बारे में पूछें...",${newKeysHindi}
    },`
);

code = code.replace(
  `thinking: "शोक करता...", chatPlaceholder: "तुमच्या रिपोर्टाबद्दल विचारात..."
    },`,
  `thinking: "शोक करता...", chatPlaceholder: "तुमच्या रिपोर्टाबद्दल विचारात...",${newKeysKonkani}
    },`
);

code = code.replace(
  `thinking: "சிந்திக்கிறது...", chatPlaceholder: "உங்கள் அறிக்கை பற்றி கேளுங்கள்..."
    }`,
  `thinking: "சிந்திக்கிறது...", chatPlaceholder: "உங்கள் அறிக்கை பற்றி கேளுங்கள்...",${newKeysTamil}
    }`
);

// ============================================================
// 2. Replace ALL hardcoded English UI strings with t[language].xxx
// ============================================================

// Patient Info Card
code = code.replace('>Patient Info<', '>{t[language].patientInfo}<');

// Patient Body
code = code.replace('>Patient Body<', '>{t[language].patientBody}<');

// Health Condition
code = code.replace('>Health Condition<', '>{t[language].healthCondition}<');

// Computed via Triage matrix
code = code.replace('Computed via Triage matrix', '{t[language].computedViaTriage}');
// Fix: this was inside a JSX text node with an icon, need to handle carefully
code = code.replace(
  `/>Computed via Triage matrix</p>`,
  `/>{t[language].computedViaTriage}</p>`
);

// Medical Extraction label
code = code.replace('>Medical Extraction<', '>{t[language].medicalExtraction}<');

// Translation complete
code = code.replace(
  `> Translation complete ({language})</p>`,
  `> {t[language].translationComplete} ({language})</p>`
);

// Find Specialists tab button
code = code.replace(
  '> Find Specialists',
  '> {t[language].findSpecialists}'
);

// Specialists page title
code = code.replace(
  '> Local Specialists Directory<',
  '> {t[language].specialistsTitle}<'
);

// Specialists page description
code = code.replace(
  '>Find certified doctors and clinics in your area, automatically matched to your triage needs.<',
  '>{t[language].specialistsDesc}<'
);

// Fetching nearby clinics
code = code.replace(
  '>Fetching nearby clinics...</p>',
  '>{t[language].fetchingClinics}</p>'
);

// No facilities found
code = code.replace(
  '>No facilities found nearby. Try expanding the range.</p>',
  '>{t[language].noClinics}</p>'
);

// Nearby label in clinic cards
code = code.replace(
  '/> Nearby</p>',
  '/> {t[language].nearby}</p>'
);

// Live Location / Scanning badge
code = code.replace(
  `/> {userLocation ? 'Live Location' : 'Scanning...'}`,
  `/> {userLocation ? t[language].liveLocation : t[language].scanning}`
);

// Patient Form Modal
code = code.replace(
  '> Patient Details<',
  '> {t[language].patientDetails}<'
);
code = code.replace(
  `>Enter the patient's information before proceeding with the analysis.</p>`,
  `>{t[language].patientFormDesc}</p>`
);
code = code.replace('>Full Name *<', '>{t[language].fullName} *<');
code = code.replace('>Age<', '>{t[language].age}<');
code = code.replace('>Weight (kg)<', '>{t[language].weightKg}<');
code = code.replace(
  '>PROCEED WITH ANALYSIS<',
  '>{t[language].proceedAnalysis}<'
);

// History empty states
code = code.replace(
  '>No Medical Records Yet<',
  '>{t[language].noRecordsYet}<'
);
code = code.replace(
  '>Upload a report or type symptoms to start building your patient history.<',
  '>{t[language].noRecordsDesc}<'
);
code = code.replace(
  '>Start Analysis<',
  '>{t[language].startAnalysis}<'
);

// Record count
code = code.replace(
  `>{items.length} record{items.length > 1 ? 's' : ''}</p>`,
  `>{items.length} {items.length > 1 ? t[language].records : t[language].record}</p>`
);

// Acquiring GPS
code = code.replace(
  '>Acquiring GPS location...</p>',
  '>{t[language].scanning}</p>'
);

fs.writeFileSync(appPath, code, 'utf8');

// ============================================================
// VERIFY
// ============================================================
const v = fs.readFileSync(appPath, 'utf8');
const checks = [
  ['Hindi patientInfo key', v.includes('patientInfo: "रोगी जानकारी"')],
  ['Tamil findSpecialists key', v.includes('findSpecialists: "நிபுணர்களைக் கண்டறிக"')],
  ['Konkani patientDetails key', v.includes('patientDetails: "दुयेंती तपशील"')],
  ['t[language].patientInfo used', v.includes('{t[language].patientInfo}')],
  ['t[language].findSpecialists used', v.includes('{t[language].findSpecialists}')],
  ['t[language].healthCondition used', v.includes('{t[language].healthCondition}')],
  ['t[language].medicalExtraction used', v.includes('{t[language].medicalExtraction}')],
  ['t[language].specialistsTitle used', v.includes('{t[language].specialistsTitle}')],
  ['t[language].patientDetails used', v.includes('{t[language].patientDetails}')],
  ['t[language].proceedAnalysis used', v.includes('{t[language].proceedAnalysis}')],
  ['t[language].noRecordsYet used', v.includes('{t[language].noRecordsYet}')],
  ['t[language].liveLocation used', v.includes('t[language].liveLocation')],
];

console.log('\n=== VERIFICATION ===');
let ok = true;
for (const [n, r] of checks) {
  console.log(`  ${r ? '✅' : '❌'} ${n}`);
  if (!r) ok = false;
}
console.log(ok ? '\n🎉 ALL TRANSLATIONS WIRED!' : '\n⚠️ SOME MISSED');
