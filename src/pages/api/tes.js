import { chromium as playwrightChromium } from "playwright-core";
import chromium from "@sparticuz/chromium";

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
    // Launch serverless Chromium
    browser = await playwrightChromium.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
    });

    const page = await browser.newPage();

    // User-Agent + viewport supaya tidak kena captcha
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewportSize({ width: 1366, height: 768 });

    // Buka halaman produk
    await page.goto(shortlink, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Tunggu elemen judul produk
    await page.waitForSelector("h1.pdp-mod-product-badge-title", { timeout: 15000 });

    // Ambil data produk
    const nama = await page.$eval(
      "h1.pdp-mod-product-badge-title",
      (el) => el.textContent.trim()
    );

    const hargaDiskon = await page.$eval(
      ".pdp-price.pdp-price_type_normal",
      (el) => el.textContent.trim()
    ).catch(() => null);

    const hargaAsli = await page.$eval(
      ".pdp-price.pdp-price_type_deleted",
      (el) => el.textContent.trim()
    ).catch(() => null);

    const gambar = await page.$eval(
      ".pdp-mod-common-image.gallery-preview-panel__image",
      (el) => el.src
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
