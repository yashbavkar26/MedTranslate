import fs from 'fs';

const filePath = './backend/src/server.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject import
content = content.replace('import formidable from "formidable";', 
                          'import formidable from "formidable";\nimport { translate } from "@vitalets/google-translate-api";');

// 2. Replace TRANSLATIONS block
// Find const TRANSLATIONS = { English: { findings: { ... } ... }, Hindi: { ... }, Konkani: { ... }, Tamil: { ... } };
const startTranslations = content.indexOf('const TRANSLATIONS = {');
const endTranslations = content.indexOf('// ---- Smart local fallback');
if (startTranslations !== -1 && endTranslations !== -1) {
    const newTranslations = `const TRANSLATIONS = {
  English: {
    findings: {
      dengue: 'Dengue infection markers detected in the report.',
      platelet: 'Platelet count is low (thrombocytopenia), which can cause bleeding risk.',
      hemoglobin: 'Hemoglobin levels are noted — check if within normal range.',
      glucose: 'Blood sugar levels are mentioned. Monitor for diabetes or pre-diabetic indicators.',
      liver: 'Liver enzyme levels are present in the report. Elevated values may indicate liver stress.',
      kidney: 'Kidney function markers (creatinine/urea) are noted.',
      cholesterol: 'Lipid profile values are present. Elevated cholesterol can increase cardiovascular risk.',
      wbc: 'White blood cell count is mentioned — relevant for detecting infection or immune response.',
      antibody: 'Antibody levels detected — indicates an immune response to an infection.',
      fallback: 'The report contains medical data. Some values may be outside the normal reference range.',
    },
    nextSteps: {
      urgent: ['Seek immediate medical care or go to a hospital.', 'Do not self-medicate — consult a doctor right away.', 'Stay hydrated and rest while you arrange care.'],
      soon: ['Schedule a doctor appointment within the next few days.', 'Avoid strenuous activity until reviewed.', 'Keep a record of any new or worsening symptoms.'],
      self_care: ['Maintain a healthy lifestyle and balanced diet.', 'Schedule a routine follow-up with your doctor.', 'Stay hydrated and get adequate rest.'],
    },
    warningSigns: {
      urgent: ['Sudden worsening of symptoms', 'High fever not responding to medication', 'Unusual bleeding or bruising', 'Severe headache, chest pain, or difficulty breathing'],
      default: ['Fever persisting beyond 3 days', 'Worsening fatigue or weakness', 'Any new symptoms not previously present'],
    },
    doctorVisit: {
      urgent: 'Visit a hospital or emergency room immediately. Do not wait.',
      soon: 'See your doctor within 2-3 days to discuss these results and get a second review.',
      self_care: 'Schedule a routine follow-up with your doctor at your earliest convenience.',
    },
    remedies: {
      urgent: [{ remedy: 'Hydration', instruction: 'Drink plenty of fluids (ORS/water) while arranging emergency care.' }],
      default: [
        { remedy: 'Rest', instruction: 'Ensure 7-8 hours of sleep to allow your body to recover.' },
        { remedy: 'Hydration', instruction: 'Drink at least 8 glasses of water per day.' },
        { remedy: 'Balanced diet', instruction: 'Eat fruits, vegetables, and lean proteins to support recovery.' },
      ],
    },
    uncertainty: 'This is a keyword-based summary. An AI medical model or qualified doctor should verify the interpretation of all specific values.',
  }
};

const LANG_MAP = {
  'Hindi': 'hi',
  'Konkani': 'gom',
  'Tamil': 'ta',
  'English': 'en'
};

export async function dynamicTranslate(obj, language) {
  if (!language || language === 'English') return obj;
  const targetCode = LANG_MAP[language] || language.toLowerCase();
  
  if (typeof obj === 'string') {
    try {
      const res = await translate(obj, { to: targetCode });
      return res.text;
    } catch(err) {
      console.warn("[MedTranslate] dynamic translation failed for string:", err.message);
      return obj;
    }
  } else if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => dynamicTranslate(item, language)));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key of Object.keys(obj)) {
      if (key === 'affectedBodyParts' || key === 'urgency') {
        newObj[key] = obj[key]; // Do not translate system keys
      } else {
        newObj[key] = await dynamicTranslate(obj[key], language);
      }
    }
    return newObj;
  }
  return obj;
}

`;
    content = content.substring(0, startTranslations) + newTranslations + content.substring(endTranslations);
}

// 3. Make localAnalyze async and await dynamicTranslate
content = content.replace("function localAnalyze(text, language = 'English') {", "async function localAnalyze(text, language = 'English') {");
// replace return { response: JSON.stringify(responseJson) };
content = content.replace("return { response: JSON.stringify(responseJson) };", 
"const translatedJson = await dynamicTranslate(responseJson, language);\n  return { response: JSON.stringify(translatedJson) };");

content = content.replace("return localAnalyze(text, language);", "return await localAnalyze(text, language);");

// 4. Add /api/translate-result endpoint before handleHealth
const targetServerHandler = `if (pathname === "/health" && req.method === "GET") {`;
content = content.replace(targetServerHandler, 
`if (pathname === "/api/translate-result" && req.method === "POST") {
      try {
        const body = await readJson(req);
        if (!body.result || !body.language) {
           sendJson(res, 400, { error: 'Missing result or language' }); 
           return;
        }
        
        // Ensure result fields that shouldn't be translated are protected
        const translatedResult = await dynamicTranslate(body.result, body.language);
        
        sendJson(res, 200, { result: translatedResult });
      } catch (err) {
        console.error("[MedTranslate] Error in translate-result endpoint:", err);
        sendJson(res, 500, { error: err.message });
      }
    } else if (pathname === "/health" && req.method === "GET") {`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactored server.js successfully");
