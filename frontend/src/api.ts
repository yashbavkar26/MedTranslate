// ---------------------------------------------------------------------------
// api.ts – Thin wrapper around the MedTranslate backend (localhost:8000).
// All paths are relative ("/api/…", "/health") so Vite's dev-proxy handles
// forwarding. In production, set BASE_URL to wherever the backend lives.
// ---------------------------------------------------------------------------

const BASE_URL = '';  // empty → same origin (proxied by Vite in dev)

// ---- Response types -------------------------------------------------------

export interface HealthResponse {
  ok: boolean;
  backend: string;
  ollamaHost: string;
  ollamaReachable: boolean;
  model: string;
  availableModels?: string[];
}

export interface AnalyzeResponse {
  model: string;
  safetyNotice: string;
  response: string;          // JSON string from the LLM
}

export interface UploadResponse extends AnalyzeResponse {
  sessionId: string;
}

// ---- Helpers --------------------------------------------------------------

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

// ---- Public API -----------------------------------------------------------

/** Check if the backend + Ollama are reachable. */
export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

/** Send free-text symptoms to the LLM for analysis. */
export function analyzeText(
  text: string,
  language?: string,
): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ...(language ? { language } : {}) }),
  });
}

/** Upload a PDF lab report for summarisation. Returns a sessionId for chat. */
export function uploadReport(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('report', file);

  return request<UploadResponse>('/api/upload-report', {
    method: 'POST',
    body: form,                       // browser sets Content-Type + boundary
  });
}

/** Ask a follow-up question about a previously uploaded report. */
export function chatFollowUp(
  sessionId: string,
  text: string,
): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  });
}
