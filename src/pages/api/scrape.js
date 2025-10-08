import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL tidak diberikan" });

    // Launch Chromium yang kompatibel dengan Vercel
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Ambil harga
    const harga_selectors = [
      "span.pdp-v2-product-price-content-salePrice-amount",
      "span[class*='salePrice-amount']",
      "div[data-testid='product-price']", // tambahan umum
    ];

    let price = null;
    for (const selector of harga_selectors) {
      price = await page.$eval(selector, el => el.textContent.trim()).catch(() => null);
      if (price) break;
    }

    await browser.close();

    if (!price) {
      return res.status(404).json({ success: false, message: "Harga tidak ditemukan" });
    }

    res.json({ success: true, price });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({
      success: false,
      message: "Gagal scraping harga.",
      error: err.message,
    });
  }
}
