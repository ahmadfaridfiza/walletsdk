import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL kosong" });

  let browser = null;
  try {
    browser = await playwrightChromium.launch({ headless: true, args: chromium.args, executablePath: await chromium.executablePath() });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const realUrl = page.url();
    const productName = await page.$eval('h1', el => el.textContent?.trim() || null);
    const price = await page.$eval('[class*="pdp-price"]', el => el.textContent?.replace(/\D/g,'') || null);
    const match = realUrl.match(/-i(\d+)-s\d+/);
    const productId = match ? match[1] : null;

    await browser.close();
    res.json({ realUrl, productId, productName, price });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
