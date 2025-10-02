import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

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
    // Launch serverless-ready Chromium
    browser = await playwrightChromium.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    });

    const page = await browser.newPage();

    // 1. Set user agent dan viewport supaya lebih "manusia"
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // 2. Set headers tambahan
    await page.setExtraHTTPHeaders({
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "referer": "https://www.lazada.co.id/",
    });

    // 3. Go to page & tunggu network idle
    await page.goto(shortlink, { waitUntil: 'networkidle', timeout: 30000 });

    // 4. Scroll sedikit agar JS content load
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 800)); // delay kecil

    const realUrl = page.url(); // URL setelah JS redirect
    const bodyText = await page.evaluate(() => document.body.innerText);

    // 5. Deteksi captcha / anti-bot
    if (/captcha|interception|x5sec|bot detection/i.test(bodyText) || /punish|x5secdata/.test(realUrl)) {
      await browser.close();
      return res.json({
        ok: false,
        reason: "captcha",
        detail: "Lazada memblokir permintaan. Gunakan proxy/residential IP atau cookies login",
        url: realUrl
      });
    }

    // 6. Ambil title dan price
    const title = await page.title();
    const price = await page.$eval(
      "span.pdp-v2-product-price-content-salePrice-amount",
      el => el.innerText
    ).catch(() => null);

    await browser.close();
    res.json({ ok: true, realUrl, title, price });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
