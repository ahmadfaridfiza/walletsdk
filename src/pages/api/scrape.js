import { get_shopee_product_detail } from '../../lib/shopee.js'; // sesuaikan path kamu

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
    if (data.error) throw new Error(data.message);

    res.json({
      success: true,
      name: data.name,
      price: data.models[0]?.price / 100000 ?? data.price / 100000,
      rating: data.item_rating.rating_star,
      stock: data.stock,
      images: data.images,
      url: data.url,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
