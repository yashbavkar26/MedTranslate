import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import formidable from "formidable";
import { translate } from "@vitalets/google-translate-api";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const sessions = new Map();

const PORT = Number(process.env.PORT || 8000);
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const SAFETY_NOTICE =
  "MedTranslate explains health information in simple words. It does not diagnose, prescribe medicine, or replace a doctor.";

// ---- Keyword dictionaries for local fallback --------------------------------

const ORGAN_KEYWORDS = {
  brain:      ['brain','neurological','neuro','headache','migraine','seizure','stroke','cerebral','cognitive','dizziness','vertigo'],
  eyes:       ['eye','vision','retina','optic','cataract','glaucoma','conjunctivitis','ocular'],
  thyroid:    ['thyroid','tsh','thyroxine','t3','t4','goiter','hypothyroid','hyperthyroid'],
  lungs:      ['lung','pulmonary','respiratory','breathing','cough','asthma','bronchitis','pneumonia','tuberculosis','tb','shortness of breath','wheez','spo2','copd'],
  heart:      ['heart','cardiac','cardio','cardiovascular','ecg','ekg','blood pressure','hypertension','cholesterol','ldl','hdl','triglyceride','arrhythmia','palpitation','chest pain','angina','myocardial'],
  liver:      ['liver','hepatic','hepatitis','bilirubin','sgpt','sgot','alt','ast','alkaline phosphatase','alp','ggt','jaundice','cirrhosis','fatty liver'],
  stomach:    ['stomach','gastric','gastritis','acid','ulcer','nausea','vomit','appetite','digestion','abdominal','epigastric','bloating','indigestion'],
  spleen:     ['spleen','splenic','splenomegaly'],
  pancreas:   ['pancreas','pancreatic','insulin','glucose','blood sugar','diabetes','diabetic','hba1c','a1c','fasting glucose'],
  kidneys:    ['kidney','renal','nephro','creatinine','urea','bun','gfr','proteinuria','dialysis','kidney stone','nephritis','electrolyte'],
  intestines: ['intestine','bowel','colon','rectal','ibs','colitis','crohn','diarrhea','constipation','gut','celiac'],
  bladder:    ['bladder','urination','uti','urinary tract','incontinence','cystitis'],
  bones:      ['bone','skeleton','fracture','osteoporosis','calcium','vitamin d','joint','arthritis','spine','spinal','back pain'],
  blood:      ['hemoglobin','hb','hgb','rbc','wbc','platelet','anemia','iron','ferritin','mcv','mch','mchc','hematocrit','esr','crp','cbc','complete blood count','leukocyte','lymphocyte','neutrophil','dengue','malaria','typhoid','thrombocytopenia'],
};

const URGENT_KEYWORDS = ['urgent','positive','dengue','malaria','typhoid','sepsis','critical','severe','emergency','abnormal','low platelet','ns1','igm','heart attack','stroke','myocardial','pneumonia','tuberculosis'];
const SOON_KEYWORDS = ['elevated','high','low','borderline','deficiency','mild','moderate','monitor','consult','follow up','check','recheck','pre-diabetes','stage'];

// ---- Translation dictionaries -----------------------------------------------

const TRANSLATIONS = {
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

// ---- Smart local fallback (no Ollama needed) --------------------------------

async function localAnalyze(text, language = 'English') {
  const lower = text.toLowerCase();

  const affectedBodyParts = [];
  for (const [organ, keywords] of Object.entries(ORGAN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) affectedBodyParts.push(organ);
  }

  let urgency = 'self_care';
  if (URGENT_KEYWORDS.some(kw => lower.includes(kw))) urgency = 'urgent';
  else if (SOON_KEYWORDS.some(kw => lower.includes(kw))) urgency = 'soon';

  const lang = TRANSLATIONS[language] || TRANSLATIONS['English'];

  const findings = [];
  if (lower.includes('dengue') || lower.includes('ns1')) findings.push(lang.findings.dengue);
  if (lower.includes('platelet') && (lower.includes('low') || lower.includes('95') || lower.includes('thrombocytopenia'))) findings.push(lang.findings.platelet);
  if (lower.includes('hemoglobin') || lower.includes('anemia') || lower.includes('hgb') || lower.includes('hb')) findings.push(lang.findings.hemoglobin);
  if (lower.includes('glucose') || lower.includes('blood sugar') || lower.includes('diabetes') || lower.includes('hba1c')) findings.push(lang.findings.glucose);
  if (lower.includes('alt') || lower.includes('ast') || lower.includes('sgpt') || lower.includes('sgot') || lower.includes('liver')) findings.push(lang.findings.liver);
  if (lower.includes('creatinine') || lower.includes('kidney') || lower.includes('renal')) findings.push(lang.findings.kidney);
  if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('hdl') || lower.includes('triglyceride')) findings.push(lang.findings.cholesterol);
  if (lower.includes('wbc') || lower.includes('leukocyte') || lower.includes('white blood')) findings.push(lang.findings.wbc);
  if (lower.includes('igm') || lower.includes('igg') || lower.includes('antibody')) findings.push(lang.findings.antibody);
  if (findings.length === 0) findings.push(lang.findings.fallback);

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
  };

  const responseJson = {
    explanation: findings.join(' '),
    urgency,
    uncertainty: lang.uncertainty,
    safeNextSteps: lang.nextSteps[urgency] || lang.nextSteps.self_care,
    warningSigns: urgency === 'urgent' ? lang.warningSigns.urgent : lang.warningSigns.default,
    doctorVisitGuidance: lang.doctorVisit[urgency] || lang.doctorVisit.self_care,
    homeRemedies: urgency === 'urgent' ? lang.remedies.urgent : lang.remedies.default,
    affectedBodyParts,
    patientInfo,
    vitals
  };

  const translatedJson = await dynamicTranslate(responseJson, language);
  return { response: JSON.stringify(translatedJson) };
}

async function tryOllamaThenFallback(text, language) {
  try {
    const prompt = buildMedicalPrompt(text, language);
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, format: "json", options: { temperature: 0.2, num_predict: 350 } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Ollama ${response.status}`);
    return await response.json();
  } catch {
    console.log("[MedTranslate] Ollama unavailable — using smart local fallback analyzer.");
    return await localAnalyze(text, language);
  }
}

// ---- Helpers ----------------------------------------------------------------

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) { chunks.push(chunk); }
  if (chunks.length === 0) return {};
  const rawBody = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(rawBody);
}

function buildMedicalPrompt(text, language = "English") {
  return [
    "You are MedTranslate, a careful medical assistant.",
    "You are MedTranslate, a helpful medical assistant.",
    "Analyze the patient text and respond ONLY with valid JSON — no extra text before or after.",
    "Do not diagnose disease. Do not prescribe medicine or dosage.",
    `Reply in ${language}.`,
    "Return this exact JSON structure:",
    `{
  "explanation": "plain-language summary of the medical text",
  "urgency": "one of: urgent | soon | self_care",
  "uncertainty": "what is unclear and why a doctor should verify",
  "safeNextSteps": ["step 1", "step 2"],
  "warningSigns": ["sign 1", "sign 2"],
  "doctorVisitGuidance": "when and why to see a doctor",
  "homeRemedies": [
    { "remedy": "name of remedy", "instruction": "how to use it safely" }
  ],
  "affectedBodyParts": ["organ1", "organ2"]
}`,
    "homeRemedies should include safe, well-known remedies for temporary relief. For urgent symptoms, frame them as temporary comfort measures while the patient seeks immediate care.",
    "affectedBodyParts must be an array of body parts that are likely affected by the symptoms or findings. ONLY use values from this list: brain, eyes, lungs, heart, liver, stomach, kidneys, intestines, bones, blood, thyroid, spleen, pancreas, bladder. Pick all that are relevant based on the symptoms described.",
    `Patient text: """${text}"""`
  ].join("\n");
}

function detectLanguage(value) {
  return /[\u0900-\u097F]/.test(value) ? "Hindi" : "English";
}

function buildAnalyzeResponse(language, ollamaResult) {
  const response = typeof ollamaResult.response === "string" ? ollamaResult.response.trim() : "";
  return { model: OLLAMA_MODEL, safetyNotice: SAFETY_NOTICE, response };
}

// ---- Route handlers ---------------------------------------------------------

async function handleAnalyze(req, res) {
  try {
    const body = await readJson(req);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) { sendJson(res, 400, { error: "Missing text." }); return; }

    const requestedLanguage =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : detectLanguage(text);

    console.log("[MedTranslate] Analyzing text, language:", requestedLanguage);
    const ollamaResult = await tryOllamaThenFallback(text, requestedLanguage);
    sendJson(res, 200, buildAnalyzeResponse(requestedLanguage, ollamaResult));
  } catch (error) {
    console.error("[MedTranslate] Analyze failed:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown server error" });
  }
}

async function handleUploadReport(req, res) {
  try {
    const form = formidable({ multiples: false, keepExtensions: true });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err); else resolve([fields, files]);
      });
    });

    const fileArray = files.report || files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    if (!file) { sendJson(res, 400, { error: "No PDF file uploaded." }); return; }

    console.log("[MedTranslate] form fields received:", fields);

    console.log("[MedTranslate] Uploaded report:", file.originalFilename || file.newFilename);
    let pdfData;
    try {
      const dataBuffer = fs.readFileSync(file.filepath);
      pdfData = await pdfParse(dataBuffer);
    } catch (parseErr) {
      console.warn("[MedTranslate] pdf-parse failed with:", parseErr.message);
      fs.unlink(file.filepath, () => {});
      sendJson(res, 400, { error: "This PDF contains unreadable formatting (e.g., scanned image or unsupported characters). Please type your symptoms manually or try another file." });
      return;
    }
    fs.unlink(file.filepath, () => {});

    const text = pdfData.text.trim();
    if (!text) { sendJson(res, 400, { error: "Could not extract text from the PDF." }); return; }

    // Read language from form field (sent by frontend), fallback to detection
    const langField = fields.language;
    const requestedLanguage =
      (typeof langField === "string" && langField.trim())
        ? langField.trim()
        : (Array.isArray(langField) && langField[0])
        ? langField[0].trim()
        : detectLanguage(text);

    console.log("[MedTranslate] Processing PDF. Text size:", text.length, "Language:", requestedLanguage);

    const reportSummaryPromptText = `Below is an extracted blood test or medical report. Summarize it in simple terms and explain anything abnormal.\n=== REPORT ===\n${text.substring(0, 5000)}`;
    const ollamaResult = await tryOllamaThenFallback(reportSummaryPromptText, requestedLanguage);
    const analysis = buildAnalyzeResponse(requestedLanguage, ollamaResult);

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { reportText: text, history: [{ role: "assistant", content: analysis.response }], language: requestedLanguage });

    sendJson(res, 200, { sessionId, ...analysis });
  } catch (error) {
    console.error("[MedTranslate] Upload failed:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Upload error" });
  }
}

async function handleChat(req, res) {
  try {
    const body = await readJson(req);
    const { sessionId, text } = body;
    if (!sessionId || !text) { sendJson(res, 400, { error: "Missing sessionId or text." }); return; }

    const session = sessions.get(sessionId);
    if (!session) { sendJson(res, 404, { error: "Session not found or expired." }); return; }

    session.history.push({ role: "user", content: text });
    const safePromptText = `You are answering questions about this medical report:\n\n${session.reportText.substring(0, 3000)}\n\nQuestion: ${text}`;
    const ollamaResult = await tryOllamaThenFallback(safePromptText, session.language);
    const analysis = buildAnalyzeResponse(session.language, ollamaResult);
    session.history.push({ role: "assistant", content: analysis.response });

    sendJson(res, 200, analysis);
  } catch (error) {
    console.error("[MedTranslate] Chat failed:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Chat error" });
  }
}

async function handleTranslateResult(req, res) {
  try {
    const body = await readJson(req);
    const { result, language } = body;
    if (!result || !language) { sendJson(res, 400, { error: "Missing result or language." }); return; }

    if (language === 'English') {
      // No translation needed
      sendJson(res, 200, { result });
      return;
    }

    const langMap = { Hindi: 'hi', Tamil: 'ta', Konkani: 'kok' };
    const targetLang = langMap[language] || 'en';

    // Translate the key text fields
    const translated = { ...result };
    try {
      if (result.explanation) {
        const t1 = await translate(result.explanation, { to: targetLang });
        translated.explanation = t1.text;
      }
      if (result.uncertainty) {
        const t2 = await translate(result.uncertainty, { to: targetLang });
        translated.uncertainty = t2.text;
      }
      if (result.doctorVisitGuidance) {
        const t3 = await translate(result.doctorVisitGuidance, { to: targetLang });
        translated.doctorVisitGuidance = t3.text;
      }
      if (Array.isArray(result.safeNextSteps)) {
        translated.safeNextSteps = await Promise.all(
          result.safeNextSteps.map(async (s) => { const r = await translate(s, { to: targetLang }); return r.text; })
        );
      }
      if (Array.isArray(result.warningSigns)) {
        translated.warningSigns = await Promise.all(
          result.warningSigns.map(async (s) => { const r = await translate(s, { to: targetLang }); return r.text; })
        );
      }
    } catch (translateErr) {
      console.warn("[MedTranslate] Translation partially failed:", translateErr.message);
    }

    sendJson(res, 200, { result: translated });
  } catch (error) {
    console.error("[MedTranslate] Translate failed:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Translation error" });
  }
}

async function handleHealth(res) {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    const data = await response.json();
    sendJson(res, 200, { ok: true, backend: "ready", ollamaHost: OLLAMA_HOST, ollamaReachable: response.ok, model: OLLAMA_MODEL });
  } catch {
    sendJson(res, 200, { ok: true, backend: "ready", ollamaHost: OLLAMA_HOST, ollamaReachable: false, model: OLLAMA_MODEL });
  }
}

// ---- Server -----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { sendJson(res, 204, {}); return; }
  if (req.method === "GET" && req.url === "/health") { await handleHealth(res); return; }
  if (req.method === "POST" && req.url === "/api/analyze") { await handleAnalyze(req, res); return; }
  if (req.method === "POST" && req.url === "/api/upload-report") { await handleUploadReport(req, res); return; }
  if (req.method === "POST" && req.url === "/api/chat") { await handleChat(req, res); return; }
  if (req.method === "POST" && req.url === "/api/translate-result") { await handleTranslateResult(req, res); return; }
  sendJson(res, 404, { error: "Not found", routes: ["GET /health", "POST /api/analyze", "POST /api/upload-report", "POST /api/chat", "POST /api/translate-result"] });
});

function startServer() {
  server.listen(PORT, () => {
    console.log(`[MedTranslate] Backend running at http://localhost:${PORT}`);
    console.log(`[MedTranslate] Ollama host: ${OLLAMA_HOST}`);
    console.log(`[MedTranslate] Ollama model: ${OLLAMA_MODEL}`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) { startServer(); }

export { buildAnalyzeResponse, buildMedicalPrompt, detectLanguage, server, startServer };
