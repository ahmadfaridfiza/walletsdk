import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url in request body." });

  try {
    // Ambil HTML
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.lazada.co.id/"
      },
      timeout: 15000
    });

    const $ = cheerio.load(html);

    // Ambil title
    const title = $("title").text().trim() || null;

    // Ambil harga (beberapa fallback selector)
    const priceSelectors = [
      "span.pdp-v2-product-price-content-salePrice-amount",
      "span[class*='salePrice-amount']",
      ".pdp-price",
      ".pdp-price_type_normal",
      "meta[property='product:price:amount']"
    ];

    let price = null;
    for (const sel of priceSelectors) {
      if (sel.startsWith("meta")) {
        price = $(`${sel}`).attr("content");
      } else {
        price = $(sel).first().text().trim();
      }
      if (price) break;
    }

    // Deteksi captcha sederhana
    const captchaDetected = /captcha|interception|bot detection|access denied/i.test(html);
    if (captchaDetected) {
      return res.json({
        ok: false,
        reason: "captcha",
        detail: "Detected anti-bot. HTML contains captcha",
        url
      });
    }

    return res.json({
      ok: true,
      url,
      title,
      price
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
