import { chromium } from 'playwright-core';

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { shortlink } = req.body;
  if (!shortlink) return res.status(400).json({ error: "Shortlink kosong" });

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // wajib di Vercel
    });

    const page = await browser.newPage();
    await page.goto(shortlink, { waitUntil: 'networkidle', timeout: 30000 });

    const realUrl = page.url(); // ini URL setelah JS redirect
    await browser.close();

    res.json({ realUrl });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
