// Shared data layer — talks to serverless API routes backed by Vercel KV,
// so Dimitri and Kelvin (and every visitor) see the same live data no
// matter which phone or computer they're on. Previously this used
// localStorage, which only worked on a single device.

async function getJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function recordPayment(payment) {
  return postJSON("/api/payments", payment);
}
export async function getPayments() {
  return getJSON("/api/payments");
}

export async function addTicketImage(ticket) {
  return postJSON("/api/tickets", ticket);
}
export async function getTicketImages() {
  return getJSON("/api/tickets");
}
export async function deleteTicketImage(id) {
  const res = await fetch(`/api/tickets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return res.json();
}

export async function addPrognostic(p) {
  return postJSON("/api/prognostics", p);
}
export async function getPrognostics() {
  return getJSON("/api/prognostics");
}
export async function deletePrognostic(id) {
  const res = await fetch(`/api/prognostics?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  return res.json();
}

export async function getSettings() {
  const s = await getJSON("/api/settings");
  return Array.isArray(s) ? { sharePercent: 50 } : s;
}
export async function setSharePercent(sharePercent) {
  return postJSON("/api/settings", { sharePercent });
}

// Client-submitted feedback messages stay local/private for now — low
// priority since only the admin reads them, not a public-facing feature.
const CONTACT_MESSAGES_KEY = "kp_contact_messages";
export function addContactMessage(msg) {
  const list = JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || "[]");
  list.unshift({ id: `msg-${Date.now()}`, date: new Date().toISOString(), ...msg });
  localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(list));
}
export function getContactMessages() {
  return JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || "[]");
}
