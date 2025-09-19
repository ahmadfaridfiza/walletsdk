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
    await page.goto(shortlink, { waitUntil: 'networkidle', timeout: 60000 });

    // Ambil data produk
    const nama = await page.title();

    const hargaDiskon = await page.$eval(
      '.pdp-v2-product-price-content-salePrice-amount',
      el => el.innerText
    ).catch(() => null);

    const hargaAsli = await page.$eval(
      '.pdp-v2-product-price-content-originalPrice-amount',
      el => el.innerText
    ).catch(() => hargaDiskon);

    const gambar = await page.$eval(
      'meta[property="og:image"]',
      el => el.getAttribute("content")
    ).catch(() => null);

    await browser.close();

    res.json({
      realUrl: page.url(),
      nama,
      hargaDiskon: hargaDiskon || "Tidak ditemukan",
      hargaAsli: hargaAsli || "Tidak ditemukan",
      gambar: gambar || "Tidak ditemukan",
    });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
