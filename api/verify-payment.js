// Vercel Serverless Function — checks Monetbil payment status by paymentId
// (called "reference" in our own frontend contract).
// Called repeatedly (polling) by the frontend after initiate-payment.
//
// 28/08/2026 — switched to Monetbil (see initiate-payment.js header for
// why). Keeps the no-store cache header that fixed a real bug on the old
// NotchPay integration: without it, Vercel's edge served a cached 304 for
// every repeated poll (same URL = same cache key), so the frontend kept
// seeing the FIRST response forever even after the real payment succeeded.

const MONETBIL_BASE = "https://api.monetbil.com/payment/v1";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = req.query;
  if (!reference) {
    return res.status(400).json({ error: "Missing reference" });
  }

  try {
    const checkRes = await fetch(`${MONETBIL_BASE}/checkPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: reference }),
    });

    const data = await checkRes.json();

    // Monetbil transaction.status: 1 = success, -1 = cancelled, anything
    // else = still pending/failed. See docs.
    const status = data?.transaction?.status;
    const normalized =
      status === 1 ? "SUCCESSFUL" :
      status === -1 ? "FAILED" : "PENDING";

    return res.status(200).json({ status: normalized });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verification failed" });
  }
}
