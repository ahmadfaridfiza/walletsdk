// pages/api/scrape.js
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36");
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const title = await page.title();
    const price = await page.$eval(
      'span.pdp-v2-product-price-content-salePrice-amount',
      el => el.innerText
    ).catch(() => null);

    await browser.close();
    res.status(200).json({ title, price });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
