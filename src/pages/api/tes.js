import { chromium as playwrightChromium } from "playwright-extra";
import stealth from "playwright-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

playwrightChromium.use(stealth());

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

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
    });

    const page = await context.newPage();
    await page.goto(shortlink, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Coba cari JSON-LD dulu (lebih aman dari scraping elemen)
    const content = await page.content();
    let nama = "Tidak ditemukan",
      hargaDiskon = "Tidak ditemukan",
      hargaAsli = "Tidak ditemukan",
      gambar = "Tidak ditemukan";

    const match = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (match) {
      try {
        const jsonData = JSON.parse(match[1]);
        nama = jsonData.name || nama;
        hargaDiskon = jsonData.offers?.price || hargaDiskon;
        gambar = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image || gambar;
      } catch (e) {}
    }

    await browser.close();
    res.json({ realUrl: page.url(), nama, hargaDiskon, hargaAsli, gambar });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
}
