import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import pdfParse from "pdf-parse";
import formidable from "formidable";

const sessions = new Map();

const PORT = Number(process.env.PORT || 8000);
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "meditron";

const SAFETY_NOTICE =
  "MedTranslate explains health information in simple words. It does not diagnose, prescribe medicine, or replace a doctor.";

const URGENCY = {
  URGENT: "urgent",
  SOON: "soon",
  SELF_CARE: "self_care"
};

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

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(rawBody);
}

function buildMedicalPrompt(text, language = "English") {
  return [
    "[INST] <<SYS>>",
    "You are MedTranslate, a careful medical explanation assistant for patients.",
    "Explain medical text in simple words only. Do not diagnose disease. Do not prescribe medicine, dosage, or treatment.",
    "Give triage-style guidance only: urgent doctor care, see a doctor soon, or basic self-care.",
    "If the text already says emergency room, severe symptoms, chest pain, trouble breathing, fainting, stroke signs, heavy bleeding, or very abnormal results, choose urgent.",
    `Write in ${language}.`,
    "Return only valid JSON. Do not copy these instructions. Do not use placeholder text.",
    'Use keys: "explanation", "urgency", "uncertainty", "safeNextSteps", "warningSigns", "doctorVisitGuidance".',
    'The "urgency" value must be exactly one of: "urgent", "soon", "self_care".',
    '"safeNextSteps" and "warningSigns" must be arrays of short patient-facing strings.',
    "<</SYS>>",
    `Patient text: """${text}"""`,
    "[/INST]"
  ].join("\n");
}

function detectLanguage(value) {
  return /[\u0900-\u097F]/.test(value) ? "Hindi" : "English";
}

async function askOllama(text, language) {
  const prompt = buildMedicalPrompt(text, language);
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
        num_predict: 350,
        stop: ["</s>", "[/INST]", "Patient text:"]
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

function extractJsonObject(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(value.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function looksLikePromptEcho(responseText, originalText) {
  if (!responseText) {
    return true;
  }

  const normalized = responseText.toLowerCase();
  return (
    normalized.includes("patient text:") ||
    normalized.includes("explain this in simple words") ||
    normalized.includes("do not diagnose") ||
    responseText.trim() === originalText.trim()
  );
}

function inferUrgency(text) {
  const normalized = text.toLowerCase();
  const urgentTerms = [
    "emergency room",
    "urgent",
    "severe",
    "chest pain",
    "trouble breathing",
    "difficulty breathing",
    "faint",
    "stroke",
    "heavy bleeding",
    "unconscious",
    "very high",
    "very low"
  ];

  if (urgentTerms.some((term) => normalized.includes(term))) {
    return URGENCY.URGENT;
  }

  const soonTerms = [
    "high",
    "low",
    "abnormal",
    "pain",
    "fever",
    "dizzy",
    "vomit",
    "swelling",
    "blood"
  ];

  if (soonTerms.some((term) => normalized.includes(term))) {
    return URGENCY.SOON;
  }

  return URGENCY.SELF_CARE;
}

function fallbackResult(text, language) {
  const urgency = inferUrgency(text);
  const urgent = urgency === URGENCY.URGENT;
  const soon = urgency === URGENCY.SOON;

  return {
    explanation:
      "This may mean something in your health information needs attention. A doctor should review the full report, symptoms, and medical history before making any conclusion.",
    urgency,
    uncertainty:
      "This app cannot confirm the cause from this text alone. The exact value, normal range, symptoms, age, and medical history matter.",
    safeNextSteps: urgent
      ? [
          "Please seek urgent medical care now, especially if the report or symptoms feel serious.",
          "Take the report and any medicines list with you."
        ]
      : soon
        ? [
            "Book a doctor visit soon to review this result.",
            "Keep the report available and note any symptoms you have."
          ]
        : [
            "Rest, drink fluids, and watch how you feel if symptoms are mild.",
            "See a doctor if symptoms continue, worsen, or worry you."
          ],
    warningSigns: [
      "Chest pain",
      "Trouble breathing",
      "Fainting or confusion",
      "Severe weakness",
      "Symptoms that get worse quickly"
    ],
    doctorVisitGuidance: urgent
      ? "Go to an emergency room or urgent care now."
      : soon
        ? "See a doctor soon for a proper review."
        : "Use basic self-care only for mild symptoms, and see a doctor if you do not improve.",
    language,
    source: "fallback"
  };
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) {
    const normalized = value
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());
    return normalized.length > 0 ? normalized : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

function normalizeUrgency(value, fallback) {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (["urgent", "immediate", "emergency", "see_doctor_urgently"].includes(normalized)) {
    return URGENCY.URGENT;
  }

  if (["soon", "routine", "see_doctor_soon", "doctor_soon"].includes(normalized)) {
    return URGENCY.SOON;
  }

  if (["self_care", "basic_self_care", "mild", "home_care"].includes(normalized)) {
    return URGENCY.SELF_CARE;
  }

  return fallback;
}

function removeUnsafeClaims(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\byou have\b/gi, "you may have")
    .replace(/\byou are diagnosed with\b/gi, "a doctor may check for")
    .replace(/\btake \d+[^.]*\./gi, "Do not take medicine or dosage advice from this app.")
    .replace(/\bmust take\b/gi, "should ask a doctor about")
    .trim();
}

function normalizeUncertainty(value, fallback) {
  const cleaned = removeUnsafeClaims(value);
  const vagueValues = ["low", "medium", "high", "none", "unknown", "n/a"];

  if (!cleaned || vagueValues.includes(cleaned.toLowerCase()) || cleaned.length < 12) {
    return fallback;
  }

  return cleaned;
}

function normalizeModelResult(parsed, fallback) {
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const hasExpectedFields = [
    "explanation",
    "urgency",
    "uncertainty",
    "safeNextSteps",
    "warningSigns",
    "doctorVisitGuidance"
  ].some((field) => Object.hasOwn(parsed, field));

  if (!hasExpectedFields) {
    return fallback;
  }

  const serialized = JSON.stringify(parsed).toLowerCase();
  const copiedTemplate = [
    "short simple explanation",
    "urgent | soon | self_care",
    "what is unknown or should be checked",
    "safe step 1",
    "warning sign 1",
    "when to see a doctor"
  ].some((placeholder) => serialized.includes(placeholder));

  if (copiedTemplate) {
    return fallback;
  }

  return {
    explanation: removeUnsafeClaims(parsed.explanation) || fallback.explanation,
    urgency: normalizeUrgency(parsed.urgency, fallback.urgency),
    uncertainty: normalizeUncertainty(parsed.uncertainty, fallback.uncertainty),
    safeNextSteps: normalizeList(parsed.safeNextSteps, fallback.safeNextSteps).map(removeUnsafeClaims),
    warningSigns: normalizeList(parsed.warningSigns, fallback.warningSigns).map(removeUnsafeClaims),
    doctorVisitGuidance:
      removeUnsafeClaims(parsed.doctorVisitGuidance) || fallback.doctorVisitGuidance,
    language: fallback.language,
    source: "ollama"
  };
}

function formatPatientResponse(result) {
  return [
    result.explanation,
    "",
    `Urgency: ${result.urgency === URGENCY.URGENT ? "see a doctor urgently" : result.urgency === URGENCY.SOON ? "see a doctor soon" : "basic self-care"}.`,
    `Next steps: ${result.safeNextSteps.join(" ")}`,
    `Warning signs: ${result.warningSigns.join(", ")}.`,
    result.doctorVisitGuidance,
    "",
    SAFETY_NOTICE
  ].join("\n");
}

function buildAnalyzeResponse(text, language, ollamaResult) {
  const rawResponse = typeof ollamaResult.response === "string" ? ollamaResult.response.trim() : "";
  const fallback = fallbackResult(text, language);
  const result = looksLikePromptEcho(rawResponse, text)
    ? fallback
    : normalizeModelResult(extractJsonObject(rawResponse), fallback);

  return {
    model: OLLAMA_MODEL,
    safetyNotice: SAFETY_NOTICE,
    result,
    response: formatPatientResponse(result),
    raw: {
      model: ollamaResult.model,
      created_at: ollamaResult.created_at,
      response: rawResponse,
      done: ollamaResult.done,
      done_reason: ollamaResult.done_reason,
      total_duration: ollamaResult.total_duration,
      prompt_eval_count: ollamaResult.prompt_eval_count,
      eval_count: ollamaResult.eval_count
    }
  };
}

async function handleAnalyze(req, res) {
  try {
    const body = await readJson(req);
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      sendJson(res, 400, {
        error: "Missing text. Send JSON like { \"text\": \"I feel dizzy\" }."
      });
      return;
    }

    const requestedLanguage =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : detectLanguage(text);

    console.log("[MedTranslate] Sending text to Ollama:", text);

    const ollamaResult = await askOllama(text, requestedLanguage);

    console.log("[MedTranslate] Ollama raw response:");
    console.log(ollamaResult);

    sendJson(res, 200, buildAnalyzeResponse(text, requestedLanguage, ollamaResult));
  } catch (error) {
    console.error("[MedTranslate] Analyze failed:", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
}

async function handleUploadReport(req, res) {
  try {
    const form = formidable({ multiples: false, keepExtensions: true });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const fileArray = files.report || files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!file) {
      sendJson(res, 400, { error: "No PDF file uploaded. Use the field name 'report' or 'file'." });
      return;
    }

    console.log("[MedTranslate] Uploaded report:", file.originalFilename || file.newFilename);
    const dataBuffer = fs.readFileSync(file.filepath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Cleanup temp file
    fs.unlink(file.filepath, () => {});

    const text = pdfData.text.trim();
    if (!text) {
      sendJson(res, 400, { error: "Could not extract text from the PDF." });
      return;
    }

    const requestedLanguage = detectLanguage(text);

    console.log("[MedTranslate] Processing PDF report. Extracted text size:", text.length);

    // Provide a report summarizing prompt
    const reportSummaryPromptText = `Below is an extracted blood test or medical report. Summarize it in simple terms and explain anything abnormal.\n=== REPORT ===\n${text.substring(0, 5000)}`;
    const ollamaResult = await askOllama(reportSummaryPromptText, requestedLanguage);
    const analysis = buildAnalyzeResponse(reportSummaryPromptText, requestedLanguage, ollamaResult);

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      reportText: text,
      history: [
        { role: "assistant", content: analysis.response }
      ],
      language: requestedLanguage
    });

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

    if (!sessionId || !text) {
      sendJson(res, 400, { error: "Missing sessionId or text in JSON body." });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      sendJson(res, 404, { error: "Session not found or expired." });
      return;
    }

    console.log("[MedTranslate] Handling chat for session:", sessionId);

    session.history.push({ role: "user", content: text });

    // Build context
    const contextPrefix = `You are a medical assistant answering questions about a previously uploaded report.\n\n=== Report Context ===\n${session.reportText.substring(0, 3000)}\n\n`;
    
    // We append the new question to the underlying system.
    // To preserve medical guardrails, we use the buildMedicalPrompt format but substitute the text with the context + question.
    const combinedText = `(Context: user is asking about the report).\nQuestion: ${text}`;
    
    // Let's use the standard guardrail prompt but inject the report context
    const safePromptText = contextPrefix + combinedText;

    const ollamaResult = await askOllama(safePromptText, session.language);
    const analysis = buildAnalyzeResponse(safePromptText, session.language, ollamaResult);

    session.history.push({ role: "assistant", content: analysis.response });

    sendJson(res, 200, analysis);
  } catch (error) {
    console.error("[MedTranslate] Chat failed:", error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Chat error" });
  }
}

async function handleHealth(res) {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    const data = await response.json();

    sendJson(res, 200, {
      ok: true,
      backend: "ready",
      ollamaHost: OLLAMA_HOST,
      ollamaReachable: response.ok,
      model: OLLAMA_MODEL,
      availableModels: Array.isArray(data.models)
        ? data.models.map((model) => model.name)
        : [],
      responseContract: {
        urgency: Object.values(URGENCY),
        fields: [
          "explanation",
          "urgency",
          "uncertainty",
          "safeNextSteps",
          "warningSigns",
          "doctorVisitGuidance"
        ]
      }
    });
  } catch {
    sendJson(res, 200, {
      ok: true,
      backend: "ready",
      ollamaHost: OLLAMA_HOST,
      ollamaReachable: false,
      model: OLLAMA_MODEL
    });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    await handleHealth(res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/analyze") {
    await handleAnalyze(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/upload-report") {
    await handleUploadReport(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    await handleChat(req, res);
    return;
  }

  sendJson(res, 404, {
    error: "Not found",
    routes: ["GET /health", "POST /api/analyze", "POST /api/upload-report", "POST /api/chat"]
  });
});

server.listen(PORT, () => {
  console.log(`[MedTranslate] Backend running at http://localhost:${PORT}`);
  console.log(`[MedTranslate] Ollama host: ${OLLAMA_HOST}`);
  console.log(`[MedTranslate] Ollama model: ${OLLAMA_MODEL}`);
});
