import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL diperlukan" });
  }

  const hargaSelectors = [
    "span.pdp-v2-product-price-content-salePrice-amount",
    "span[class*='salePrice-amount']",
    "div[class*='product-price'] span",
    ".product-price-value",
    ".pdp-price",
  ];

  try {
    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Tunggu elemen harga muncul
    let harga = null;
    for (const selector of hargaSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        harga = await page.$eval(selector, (el) => el.textContent.trim());
        if (harga) break;
      } catch {
        // lanjut ke selector berikutnya
      }
    }

    await browser.close();

    if (!harga) {
      return res.status(404).json({
        success: false,
        message: "Harga tidak ditemukan. Selector mungkin perlu diperbarui.",
      });
    }

    return res.status(200).json({ success: true, harga });
  } catch (error) {
    console.error("Scrape Error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal scraping harga.",
      error: error.message,
    });
  }
}
