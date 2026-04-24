// Direct fetch helpers for SHADOW endpoints (not in OpenAPI codegen).
const BASE = "/api";

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export const shadowApi = {
  // Keywords
  listKeywords: () => j<{ keywords: any[] }>("/keywords"),
  addKeyword: (word: string) => j<{ success: boolean; keyword: any; message?: string }>("/keywords", { method: "POST", body: JSON.stringify({ word }) }),
  toggleKeyword: (id: number, enabled: boolean) => j(`/keywords/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  deleteKeyword: (id: number) => j(`/keywords/${id}`, { method: "DELETE" }),

  // Auto-replies
  listAutoreplies: () => j<{ autoreplies: any[] }>("/autoreplies"),
  addAutoreply: (data: { trigger: string; reply: string; matchType?: string }) => j("/autoreplies", { method: "POST", body: JSON.stringify(data) }),
  toggleAutoreply: (id: number, enabled: boolean) => j(`/autoreplies/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  deleteAutoreply: (id: number) => j(`/autoreplies/${id}`, { method: "DELETE" }),

  // Forwarding
  listForwarding: () => j<{ filters: any[] }>("/forwarding"),
  addForward: (data: { sourceChat: string; destChat: string; keyword?: string; mediaType?: string }) =>
    j("/forwarding", { method: "POST", body: JSON.stringify(data) }),
  toggleForward: (id: number, enabled: boolean) => j(`/forwarding/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  deleteForward: (id: number) => j(`/forwarding/${id}`, { method: "DELETE" }),

  // Mirrors
  listMirrors: () => j<{ mirrors: any[] }>("/mirrors"),
  addMirror: (data: { ownerName: string; ownerTelegramId: string }) => j("/mirrors", { method: "POST", body: JSON.stringify(data) }),
  deleteMirror: (id: number) => j(`/mirrors/${id}`, { method: "DELETE" }),
  mirrorSendCode: (id: number, data: { apiId: number; apiHash: string; phone: string }) =>
    j(`/mirrors/${id}/auth/send-code`, { method: "POST", body: JSON.stringify(data) }),
  mirrorVerifyCode: (id: number, code: string) =>
    j<{ status: string; needPassword?: boolean }>(`/mirrors/${id}/auth/verify-code`, { method: "POST", body: JSON.stringify({ code }) }),
  mirrorVerifyPassword: (id: number, password: string) =>
    j<{ status: string }>(`/mirrors/${id}/auth/verify-password`, { method: "POST", body: JSON.stringify({ password }) }),
  mirrorStart: (id: number) => j<{ status: string }>(`/mirrors/${id}/start`, { method: "POST" }),
  mirrorStop: (id: number) => j<{ status: string }>(`/mirrors/${id}/stop`, { method: "POST" }),
  mirrorStatus: (id: number) => j<{ status: string; running: boolean; phone?: string; error?: string }>(`/mirrors/${id}/status`),

  // Logs
  listLogs: (eventType?: string, limit = 100) => j<{ logs: any[] }>(`/logs?limit=${limit}${eventType && eventType !== "all" ? `&eventType=${eventType}` : ""}`),
  clearLogs: () => j("/logs/all", { method: "DELETE" }),

  // Profiles
  listProfiles: () => j<{ profiles: any[] }>("/profiles"),
  deleteProfile: (id: number) => j(`/profiles/${id}`, { method: "DELETE" }),

  // Support
  listTickets: () => j<{ tickets: any[] }>("/support"),
  createTicket: (data: { subject: string; message: string }) => j("/support", { method: "POST", body: JSON.stringify(data) }),
  replyTicket: (id: number, reply: string) =>
    j<{ success: boolean; ticket: any }>(`/support/${id}/reply`, { method: "PATCH", body: JSON.stringify({ reply }) }),
  updateTicketStatus: (id: number, status: string) =>
    j<{ success: boolean; ticket: any }>(`/support/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTicket: (id: number) => j(`/support/${id}`, { method: "DELETE" }),

  // Backup / Export
  exportAll: () => fetch(BASE + "/system/export").then((r) => r.blob()),

  // Stats
  shadowStats: () => j<{ keywords: number; autoreplies: number; forwardFilters: number; mirrors: number; messageLogs: number; contactProfiles: number; supportTickets: number }>("/shadow/stats"),

  // OCR & Voice
  ocr: async (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    const r = await fetch(BASE + "/ocr/recognize", { method: "POST", body: fd });
    return r.json() as Promise<{ success: boolean; text?: string; detail?: string }>;
  },
  transcribe: async (file: File) => {
    const fd = new FormData();
    fd.append("audio", file);
    const r = await fetch(BASE + "/voice/transcribe", { method: "POST", body: fd });
    return r.json() as Promise<{ success: boolean; text?: string; language?: string; detail?: string }>;
  },
};
