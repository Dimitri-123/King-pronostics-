// Vercel Serverless Function — checks NotchPay payment status by reference.
// Called repeatedly (polling) by the frontend after initiate-payment.
//
// FIX (27/08/2026): this was the only API route missing a no-cache header.
// Vercel's edge was serving a cached 304 for every repeated poll (same URL
// + query string = same cache key), so the frontend kept receiving the
// FIRST response ("PENDING") forever, even after the real payment on
// NotchPay's side had completed. This is very likely the actual cause of
// the "stuck on Payment in Progress forever" symptom — more so than the
// phone number formatting fixed earlier, though that fix was still correct
// and worth keeping.

const NOTCHPAY_BASE = "https://api.notchpay.co";

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
    const publicKey = process.env.NOTCHPAY_PUBLIC_KEY;

    const notchRes = await fetch(`${NOTCHPAY_BASE}/payments/${reference}`, {
      headers: { Authorization: publicKey },
    });

    const data = await notchRes.json();

    // NotchPay statuses: pending, processing, complete, failed
    const status = data?.transaction?.status;
    const normalized =
      status === "complete" ? "SUCCESSFUL" :
      status === "failed" ? "FAILED" : "PENDING";

    return res.status(200).json({ status: normalized });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verification failed" });
  }
}
