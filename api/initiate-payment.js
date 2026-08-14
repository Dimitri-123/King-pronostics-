// Vercel Serverless Function — runs server-side only.
// Your NotchPay private key and hash key NEVER reach the browser.
// Set these in Vercel -> Project -> Settings -> Environment Variables:
//   NOTCHPAY_PUBLIC_KEY   (starts with pk. or sb_pk. for sandbox)
//   NOTCHPAY_PRIVATE_KEY  (starts with sk. — server-side only)
//   RECIPIENT_NAME        display name shown to clients before they confirm
//   RECIPIENT_MSISDN      the receiving MTN number (Mr Kelvin's number)
//
// NotchPay flow: 1) initialize a payment -> get a reference
//                2) process it with the client's mobile money number
//                3) poll /api/verify-payment to confirm success

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

    // Step 1: initialize the payment
    const initRes = await fetch(`${NOTCHPAY_BASE}/payments/initialize`, {
      method: "POST",
      headers: {
        Authorization: publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: "XAF",
        email: "client@kingpronostics.com", // NotchPay requires an email; a generic one is fine for guest checkout
        phone: payerPhone,
        reference: `kp-${Date.now()}`,
        description: "King Pronostics - Ticket du jour",
      }),
    });

    const initData = await initRes.json();
    if (!initRes.ok) {
      return res.status(initRes.status).json({ error: initData });
    }

    const reference = initData.transaction.reference;

    // Step 2: trigger the mobile money prompt on the client's phone
    const processRes = await fetch(`${NOTCHPAY_BASE}/payments/${reference}`, {
      method: "POST",
      headers: {
        Authorization: publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "cm.mtn", // use "cm.orange" for Orange Money later
        account_number: payerPhone,
      }),
    });

    const processData = await processRes.json();
    if (!processRes.ok) {
      return res.status(processRes.status).json({ error: processData });
    }

    return res.status(200).json({
      reference,
      recipientName: process.env.RECIPIENT_NAME || "King Pronostics",
      status: "PENDING",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Payment initiation failed" });
  }
}
