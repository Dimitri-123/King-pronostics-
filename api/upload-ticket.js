// Vercel Serverless Function — receives an image (as base64) from the
// admin dashboard and stores it using Vercel Blob storage.
//
// Setup required (one-time, no external account needed):
//   1. Go to your Vercel project -> Storage tab -> Create Database -> Blob
//   2. Click "Create" — Vercel automatically adds the BLOB_READ_WRITE_TOKEN
//      environment variable to your project. Nothing to copy-paste manually.

import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, base64, contentType } = req.body;

    if (!filename || !base64) {
      return res.status(400).json({ error: "Missing filename or image data" });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: "Blob storage not configured — create a Blob store in Vercel's Storage tab first.",
      });
    }

    const buffer = Buffer.from(base64, "base64");
    const safeName = `tickets/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

    const blob = await put(safeName, buffer, {
      access: "public",
      contentType: contentType || "image/jpeg",
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
