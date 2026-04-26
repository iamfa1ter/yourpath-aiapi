const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/.netlify/functions";

async function postJSON(path, payload) {
  const endpoint = path.startsWith("/api/") ? path.replace("/api/", "/") : path;
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || "Something went wrong. Please try again.");
    error.details = body.details || {};
    throw error;
  }

  return body;
}

export function analyzeStudent(payload) {
  return postJSON("/api/analyze-student", payload);
}

export function analyzeGraduate(payload) {
  return postJSON("/api/analyze-graduate", payload);
}

export function analyzeAdmissionAdvisor(payload) {
  return postJSON("/api/admission-advisor", payload);
}

export function analyzeAdmissionChat(payload) {
  return postJSON("/api/admission-chat", payload);
}
