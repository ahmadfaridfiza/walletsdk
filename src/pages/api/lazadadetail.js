import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { shortlink } = req.body;
  if (!shortlink) return res.status(400).json({ error: "Shortlink kosong" });

  let browser = null;
  try {
    browser = await playwrightChromium.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    });

    const page = await browser.newPage();
    await page.goto(shortlink, { waitUntil: 'networkidle', timeout: 30000 });

    // ambil URL asli setelah redirect
    const realUrl = page.url();

    // scrape nama produk
    const productName = await page.$eval(
      'h1', // biasanya nama produk ada di <h1>
      el => el.textContent?.trim() || null
    );

    // scrape harga
    const price = await page.$eval(
      '[class*="pdp-price"]', // biasanya ada class pdp-price atau sejenis
      el => el.textContent?.replace(/\D/g,'') || null // ambil angka saja
    );

    // ambil productId dari URL (misal -i123456-s123456)
    const match = realUrl.match(/-i(\d+)-s\d+/);
    const productId = match ? match[1] : null;

    await browser.close();

    res.json({ realUrl, productId, productName, price });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
