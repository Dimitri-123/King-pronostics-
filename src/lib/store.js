// Demo persistence using localStorage so the dashboard has something to show
// out of the box. This is PER BROWSER, not shared between your phone and
// Mr Kelvin's phone. Before going live, swap these functions for calls to a
// real database (Vercel Postgres, Supabase, or Firebase all work well and
// have free tiers). Keep the function names the same and only the internals
// need to change — nothing else in the app has to be touched.

const PAYMENTS_KEY = "kp_payments";
const TICKETS_KEY = "kp_tickets";
const PROGNOSTICS_KEY = "kp_prognostics";
const CONTACT_MESSAGES_KEY = "kp_contact_messages"; // private, never rendered publicly

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

export function recordPayment(payment) {
  const list = readList(PAYMENTS_KEY);
  list.unshift({ id: `pay-${Date.now()}`, ...payment });
  writeList(PAYMENTS_KEY, list);
}
export function getPayments() {
  return readList(PAYMENTS_KEY);
}

export function addTicketImage(ticket) {
  const list = readList(TICKETS_KEY);
  list.unshift({ id: `tk-${Date.now()}`, timestamp: new Date().toISOString(), ...ticket });
  writeList(TICKETS_KEY, list);
}
export function getTicketImages() {
  return readList(TICKETS_KEY);
}

export function addPrognostic(p) {
  const list = readList(PROGNOSTICS_KEY);
  list.unshift({ id: `pg-${Date.now()}`, buyers: 0, isNew: true, ...p });
  writeList(PROGNOSTICS_KEY, list);
}
export function getPrognostics() {
  return readList(PROGNOSTICS_KEY);
}

// Client-submitted messages: saved privately, deliberately NEVER surfaced
// on any public page. Only readable from the admin dashboard.
export function addContactMessage(msg) {
  const list = readList(CONTACT_MESSAGES_KEY);
  list.unshift({ id: `msg-${Date.now()}`, date: new Date().toISOString(), ...msg });
  writeList(CONTACT_MESSAGES_KEY, list);
}
export function getContactMessages() {
  return readList(CONTACT_MESSAGES_KEY);
}
