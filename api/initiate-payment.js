// Vercel Serverless Function — runs server-side only.
// Your Monetbil Service Key NEVER reaches the browser.
// Set this in Vercel -> Project -> Settings -> Environment Variables:
//   MONETBIL_SERVICE_KEY
//
// 28/08/2026 — Switched to Monetbil after both NotchPay (support
// unresponsive for a month on a stuck transaction) and CinetPay (requires a
// registered business / RCCM + sales approval, not viable for a solo
// entrepreneur without one) didn't work out. Monetbil is a Cameroonian
// company (since 2015) with self-serve signup, no business registration
// required — confirmed on 28/08/2026 by actually signing up.
//
// Unlike the previous two providers, Monetbil's Payment API v1 is a DIRECT
// charge API — no hosted checkout page/iframe needed. One POST call
// directly triggers the Mobile Money USSD prompt on the client's phone.
// Official docs: https://www.monetbil.com/docs/monetbil-payment-api-v1-en.pdf

const MONETBIL_BASE = "https://api.monetbil.com/payment/v1";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { payerPhone, amount } = req.body;

    if (!payerPhone || !amount) {
      return res.status(400).json({ error: "Missing payerPhone or amount" });
    }

    const serviceKey = process.env.MONETBIL_SERVICE_KEY;
    if (!serviceKey) {
      return res.status(500).json({ error: "Payment provider not configured" });
    }

    // Normalize to the full Cameroon international format (237XXXXXXXXX,
    // no + sign — matches Monetbil's own documented examples exactly).
    const digitsOnly = payerPhone.replace(/\D/g, "");
    const localDigits = digitsOnly.startsWith("237") ? digitsOnly.slice(3) : digitsOnly.replace(/^0+/, "");
    const normalizedPhone = `237${localDigits}`;

    const placeRes = await fetch(`${MONETBIL_BASE}/placePayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: serviceKey,
        phonenumber: normalizedPhone,
        amount: Number(amount),
      }),
    });

    const data = await placeRes.json();

    // Log the raw response so we can confirm Monetbil's exact field names
    // in Vercel -> Logs if the frontend ever reports a problem.
    console.log("Monetbil placePayment response", JSON.stringify(data));

    if (data.status !== "REQUEST_ACCEPTED" || !data.paymentId) {
      console.error("Monetbil placePayment error", data);
      return res.status(502).json({ error: data });
    }

    return res.status(200).json({
      reference: data.paymentId,
      channelName: data.channel_name || null, // e.g. "MTN Mobile Money"
      channelUssd: data.channel_ussd || null, // e.g. "*126#"
      status: "PENDING",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Payment initiation failed" });
  }
}
