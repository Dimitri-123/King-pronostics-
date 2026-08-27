// Vercel Serverless Function — runs server-side only.
// Your NotchPay private key and hash key NEVER reach the browser.
// Set these in Vercel -> Project -> Settings -> Environment Variables:
//   NOTCHPAY_PUBLIC_KEY   (starts with pk. or sb_pk. for sandbox)
//   RECIPIENT_NAME        display name shown to clients before they confirm
//
// This uses NotchPay's hosted checkout (the same reliable payment page
// their own "Quick Links" feature uses) instead of a custom direct-charge
// call — more reliable since NotchPay handles the MTN prompt themselves.
// Flow: 1) initialize a payment -> get an authorization_url
//       2) the client completes payment on NotchPay's own page
//       3) poll /api/verify-payment to confirm success

const NOTCHPAY_BASE = "https://api.notchpay.co";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { payerPhone, amount } = req.body;

    if (!payerPhone || !amount) {
      return res.status(400).json({ error: "Missing payerPhone or amount" });
    }

    const publicKey = process.env.NOTCHPAY_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: "Payment provider not configured" });
    }

    // Normalize to the full Cameroon international format (237XXXXXXXXX).
    // Mobile money operators need this to route the USSD prompt correctly —
    // a local 9-digit number ("670000000") without the country code can
    // silently fail to trigger any prompt at all, which matches the "stuck
    // on Payment in Progress forever" symptom reported on 27/08/2026.
    const digitsOnly = payerPhone.replace(/\D/g, "");
    const normalizedPhone = digitsOnly.startsWith("237")
      ? digitsOnly
      : `237${digitsOnly.replace(/^0+/, "")}`;

    const initRes = await fetch(`${NOTCHPAY_BASE}/payments/initialize`, {
      method: "POST",
      headers: {
        Authorization: publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: "XAF",
        email: "client@kingpronostics.com",
        phone: normalizedPhone,
        reference: `kp-${Date.now()}`,
        description: "King Pronostics - Ticket du jour",
      }),
    });

    const initData = await initRes.json();
    if (!initRes.ok) {
      console.error("NotchPay initialize error", initRes.status, initData);
      return res.status(initRes.status).json({ error: initData });
    }

    // Log the raw response so we can confirm NotchPay's exact field names in
    // Vercel -> Logs if the frontend ever reports a missing authorizationUrl.
    console.log("NotchPay initialize response", JSON.stringify(initData));

    const authorizationUrl = initData.authorization_url || initData.transaction?.authorization_url;
    const reference = initData.transaction?.reference || initData.reference;

    if (!authorizationUrl || !reference) {
      console.error("NotchPay response missing authorizationUrl or reference", initData);
      return res.status(502).json({ error: "Unexpected NotchPay response shape", raw: initData });
    }

    return res.status(200).json({
      reference,
      authorizationUrl,
      recipientName: process.env.RECIPIENT_NAME || "King Pronostics",
      status: "PENDING",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Payment initiation failed" });
  }
}
