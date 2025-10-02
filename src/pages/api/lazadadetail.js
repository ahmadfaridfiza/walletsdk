// /pages/api/scrape.js
import { Scraper, Root, CollectContent } from 'nodejs-web-scraper';

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const scraper = new Scraper({
    root: new Root(url),
    collect: [
      new CollectContent({ selector: 'title', name: 'title' }),
      new CollectContent({ selector: 'span.pdp-v2-product-price-content-salePrice-amount', name: 'price' }),
    ],
  });

  try {
    const data = await scraper.scrape();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
