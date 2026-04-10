import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import formidable from "formidable";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const sessions = new Map();

const PORT = Number(process.env.PORT || 8000);
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const SAFETY_NOTICE =
  "MedTranslate explains health information in simple words. It does not diagnose, prescribe medicine, or replace a doctor.";



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
  ]
}`,
    "homeRemedies should include safe, well-known remedies for temporary relief. For urgent symptoms, frame them as temporary comfort measures while the patient seeks immediate care.",
    `Patient text: """${text}"""`
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


function buildAnalyzeResponse(language, ollamaResult) {
  const response = typeof ollamaResult.response === "string" ? ollamaResult.response.trim() : "";

  return {
    model: OLLAMA_MODEL,
    safetyNotice: SAFETY_NOTICE,
    response
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

    sendJson(res, 200, buildAnalyzeResponse(requestedLanguage, ollamaResult));
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
    console.log("[MedTranslate] --- PDF EXTRACTED TEXT BEGIN ---");
    console.log(text);
    console.log("[MedTranslate] --- PDF EXTRACTED TEXT END ---");

    // Provide a report summarizing prompt
    const reportSummaryPromptText = `Below is an extracted blood test or medical report. Summarize it in simple terms and explain anything abnormal.\n=== REPORT ===\n${text.substring(0, 5000)}`;
    const ollamaResult = await askOllama(reportSummaryPromptText, requestedLanguage);
    const analysis = buildAnalyzeResponse(requestedLanguage, ollamaResult);

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

    const contextPrefix = `You are answering questions about this medical report:\n\n${session.reportText.substring(0, 3000)}\n\n`;
    const safePromptText = contextPrefix + `Question: ${text}`;

    const ollamaResult = await askOllama(safePromptText, session.language);
    const analysis = buildAnalyzeResponse(session.language, ollamaResult);

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
