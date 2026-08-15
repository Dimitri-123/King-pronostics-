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

export async function addPrognostic(p) {
  return postJSON("/api/prognostics", p);
}
export async function getPrognostics() {
  return getJSON("/api/prognostics");
}

export async function getSettings() {
  const s = await getJSON("/api/settings");
  return Array.isArray(s) ? { sharePercent: 50 } : s;
}
export async function setSharePercent(sharePercent) {
  return postJSON("/api/settings", { sharePercent });
}

const CONTACT_MESSAGES_KEY = "kp_contact_messages";
export function addContactMessage(msg) {
  const list = JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || "[]");
  list.unshift({ id: `msg-${Date.now()}`, date: new Date().toISOString(), ...msg });
  localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(list));
}
export function getContactMessages() {
  return JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || "[]");
}
