// Vercel Serverless Function — checks NotchPay payment status by reference.
// Called repeatedly (polling) by the frontend after initiate-payment.

const NOTCHPAY_BASE = "https://api.notchpay.co";

export default async function handler(req, res) {
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
