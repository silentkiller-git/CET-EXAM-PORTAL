function resolveApiBase() {
  // Use REACT_APP_API_URL directly if set
  if (process.env.REACT_APP_API_URL) {
    const url = process.env.REACT_APP_API_URL.trim().replace(/\/+$/, "");
    console.log("[API] Using REACT_APP_API_URL:", url);
    return url;
  }

  // Fallback to REACT_APP_BACKEND_ORIGIN
  if (process.env.REACT_APP_BACKEND_ORIGIN) {
    const url = (process.env.REACT_APP_BACKEND_ORIGIN + "/v1").trim().replace(/\/+$/, "");
    console.log("[API] Using REACT_APP_BACKEND_ORIGIN:", url);
    return url;
  }

  // Fallback to localhost:8000
  const defaultUrl = "http://localhost:8000/v1";
  console.log("[API] Using default:", defaultUrl);
  return defaultUrl;
}

const API_BASE = resolveApiBase();

const STORAGE_KEY = "cet_auth";

function getStorage() {
  return window.sessionStorage;
}

function extractErrorMessage(payload) {
  if (!payload) return "Request failed";
  if (typeof payload === "string") return payload;

  const detail = payload.detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string") return first;
    if (first?.msg) return first.msg;
    return JSON.stringify(first);
  }

  if (detail && typeof detail === "object") {
    if (detail.msg) return detail.msg;
    return JSON.stringify(detail);
  }

  if (payload.message && typeof payload.message === "string") return payload.message;

  return "Request failed";
}

export function getAuthState() {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthState(auth) {
  // Comprehensive cleanup: remove auth from ALL sources before setting new
  clearAuthState();
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuthState() {
  // Aggressive cleanup to prevent stale auth states
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("cet_active_exam");
  } catch (e) {}
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("cet_active_exam");
  } catch (e) {}
  
  // Clear any other potential auth keys
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('cet'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {}
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth') || key.includes('token') || key.includes('cet'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {}
}

function authHeaders() {
  const auth = getAuthState();
  if (!auth?.access_token) return {};
  return { Authorization: `Bearer ${auth.access_token}` };
}

async function request(path, options = {}) {
  let url = `${API_BASE}${path}`;
  const method = options.method || 'GET';
  
  // Add cache-busting for GET requests
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}_t=${Date.now()}`;
  }
  
  console.log(`[API] ${method} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = extractErrorMessage(payload);
    throw new Error(message);
  }

  return payload;
}

export async function studentLogin(username, password) {
  // Clear all stale auth before attempt
  clearAuthState();
  return request("/auth/student/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function adminLogin(email, password) {
  // Clear all stale auth before attempt
  clearAuthState();
  return request("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function downloadCredentials(examId) {
  try {
    const url = `${API_BASE}/admin/students/credentials?exam_id=${encodeURIComponent(examId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = 'Failed to download credentials';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.detail || errorMsg;
      } catch { }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `student_credentials_${examId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    console.log('[API] Credentials downloaded successfully');
  } catch (err) {
    console.error('[API] Download credentials failed:', err);
    throw err;
  }
}

export async function fetchStudentExams() {
  return request("/student/exams");
}

export async function startExam(examId) {
  return request(`/student/exams/${examId}/start`, { method: "POST" });
}

export async function fetchExamQuestions(examId) {
  return request(`/student/exams/${examId}/questions`);
}

export async function fetchStudentSections(examId) {
  return request(`/student/exams/${examId}/sections`);
}

export async function saveAnswer(body) {
  return request("/student/answers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchTimer(examId) {
  return request(`/student/exams/${examId}/timer`);
}

export async function submitExam(examId, body = null) {
  return request(`/student/exams/${examId}/submit`, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });
}

export async function fetchStudentResult(examId) {
  return request(`/student/exams/${examId}/result`);
}

export async function fetchExamSections(examId) {
  return request(`/admin/exams/${examId}/sections`);
}

export async function fetchAdminExams() {
  return request("/admin/exams");
}

export async function createExam(body) {
  return request("/admin/exams", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createExamWithFiles(formData) {
  const url = `${API_BASE}/admin/exams`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  if (response.status === 204) return null;

  if (!response.ok) {
    let msg = "Request failed";
    try {
      const errData = await response.json();
      msg = errData.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }

  return response.json();
}

export async function updateExam(examId, body) {
  return request(`/admin/exams/${examId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteExam(examId) {
  return request(`/admin/exams/${examId}`, {
    method: "DELETE",
  });
}

export async function fetchExamMetrics(examId) {
  return request(`/admin/exams/${examId}/monitor`);
}

export async function fetchAdminResults(examId, page = 1, perPage = 50) {
  return request(`/admin/exams/${examId}/results?page=${page}&per_page=${perPage}`);
}

export async function triggerEvaluation(examId) {
  return request(`/admin/exams/${examId}/evaluate`, { method: "POST" });
}

export function getResultsExportCsvUrl(examId) {
  return `${API_BASE}/admin/exams/${examId}/results/export/csv`;
}

export function getResultsExportPdfUrl(examId) {
  return `${API_BASE}/admin/exams/${examId}/results/export/pdf`;
}

export async function downloadAdminFile(url, fallbackFilename) {
  const token = getAuthState()?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Download failed";
    try {
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      message = extractErrorMessage(payload);
    } catch {
      // ignore parse errors and keep fallback message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  const resolvedName = match ? decodeURIComponent(match[1].replace(/"/g, "").trim()) : fallbackFilename;

  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = resolvedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/v1$/, "");
  return `${base}/media/${path.replace(/^\/+/, "")}`;
}

export async function addQuestion(formData) {
  // We use fetch directly here because FormData should not have 'Content-Type': 'application/json'
  const url = `${API_BASE}/admin/questions`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(), 
    // Do NOT set Content-Type header manually when sending FormData
    body: formData,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = extractErrorMessage(payload);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function uploadStudentCsv(examId, file) {
  const url = `${API_BASE}/admin/students/upload?exam_id=${examId}`;
  const formData = new FormData();
  formData.append('csv_file', file);
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = extractErrorMessage(payload);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

export async function createSection(examId, body) {
  return request(`/admin/exams/${examId}/sections`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSection(examId, sectionId, body) {
  return request(`/admin/exams/${examId}/sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteSection(examId, sectionId) {
  return request(`/admin/exams/${examId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export async function updateQuestion(questionId, body) {
  return request(`/admin/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminQuestions(examId, sectionId = null) {
  const url = sectionId ? `/admin/questions?exam_id=${examId}&section_id=${sectionId}` : `/admin/questions?exam_id=${examId}`;
  return request(url);
}

