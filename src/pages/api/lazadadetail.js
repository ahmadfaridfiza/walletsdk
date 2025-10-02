import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

export default async function handler(req, res){
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

    // make request look more "human"
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "referer": "https://www.lazada.co.id/"
    });

    // 1) buka shortlink, tunggu redirect
    await page.goto(shortlink, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(600);
    const realUrl = page.url();

    // 2) try to extract actual target if page is a punish/redirect wrapper
    let finalUrl = realUrl;

    if (/punish|x5secdata/i.test(realUrl)) {
      try {
        const u = new URL(realUrl);
        // try common param names that may contain encoded original url
        const candidates = ['x5secdata', 'url', 'u', 'redirect', 'target'];
        let found = null;
        for (const k of candidates) {
          const v = u.searchParams.get(k);
          if (v) { found = v; break; }
        }
        if (found) {
          // sometimes double-encoded; try decodeURIComponent repeatedly
          let decoded = found;
          for (let i=0;i<3;i++){
            try { decoded = decodeURIComponent(decoded); } catch(e){ break; }
          }
          // search for lazada path inside decoded string
          const idx = decoded.indexOf('lazada.co.id');
          if (idx !== -1) {
            // try to build full URL from the substring
            const substring = decoded.slice(idx);
            if (substring.startsWith('lazada.co.id')) {
              finalUrl = 'https://' + substring;
            } else if (substring.startsWith('http')) {
              finalUrl = substring;
            } else {
              finalUrl = substring.includes('http') ? substring : ('https://' + substring);
            }
          } else if (decoded.startsWith('http')) {
            finalUrl = decoded;
          }
        }
      } catch (e) {
        // parsing failed -> keep realUrl as finalUrl
      }
    }

    // If finalUrl is different from current page, navigate to it
    if (finalUrl && finalUrl !== realUrl) {
      await page.goto(finalUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await sleep(600);
    } else {
      // ensure dynamic content loads
      await sleep(800);
      await page.evaluate(()=> window.scrollBy(0, 600));
      await sleep(600);
    }

    const nowUrl = page.url();
    const bodyText = await page.evaluate(()=> document.body.innerText || '');

    // Detect captcha / interception
    const captchaDetected = /captcha|interception|x5sec|bot detection|access denied/i.test(bodyText) || /punish|x5secdata/i.test(nowUrl);
    if (captchaDetected) {
      await browser.close();
      return res.json({
        ok: false,
        reason: "captcha",
        detail: "Detected anti-bot (captcha/interception). Use residential proxy, cookies or captcha solver.",
        realUrl: realUrl,
        attemptedUrl: finalUrl,
        finalResolvedUrl: nowUrl
      });
    }

    // Extract title and price with fallback selectors
    const title = await page.title().catch(()=>null);

    let price = null;
    const priceSelectors = [
      "span.pdp-v2-product-price-content-salePrice-amount",
      "span[class*='salePrice-amount']",
      ".pdp-price",
      ".pdp-price_type_normal",
      "meta[property='product:price:amount']" // meta fallback
    ];

    for (const sel of priceSelectors) {
      try {
        if (sel.startsWith("meta")) {
          const metaSel = sel;
          const val = await page.$eval(metaSel, el => el.getAttribute('content')).catch(()=>null);
          if (val) { price = val; break; }
        } else {
          const val = await page.$eval(sel, el => el.innerText.trim()).catch(()=>null);
          if (val) { price = val; break; }
        }
      } catch(e){ /* ignore and try next */ }
    }

    await browser.close();

    return res.json({
      ok: true,
      realUrl,
      finalUrl,
      resolvedUrl: nowUrl,
      title,
      price
    });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ ok:false, error: err.message });
  }
}
