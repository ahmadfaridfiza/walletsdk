import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL kosong" });

  let browser = null;
  try {
    browser = await playwrightChromium.launch({
      headless: false,         // <-- tampilkan browser
      slowMo: 100,             // <-- gerakan lebih lambat untuk debugging
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // tunggu beberapa detik supaya halaman benar-benar load
    await page.waitForTimeout(10000);

    // optional: screenshot untuk cek
    await page.screenshot({ path: 'debug.png', fullPage: true });

    // tetap kembalikan URL final saja
    const realUrl = page.url();
    res.json({ realUrl });

    // jangan langsung close browser, biar kamu bisa lihat halaman
    // await browser.close();  <-- comment dulu

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
