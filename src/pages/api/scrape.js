import { get_shopee_product_detail } from "../../lib/sp.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL produk kosong" });

  try {
    const data = await get_shopee_product_detail(url);

    if (data.error || !data.name) {
      throw new Error(data.message || "Gagal mengambil data produk.");
    }

    res.json({
      success: true,
      name: data.name,
      price: data.price_min / 100000,
      rating: data.item_rating.rating_star,
      stock: data.stock,
      images: data.images.map(img => `https://cf.shopee.co.id/file/${img}`),
      url,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
