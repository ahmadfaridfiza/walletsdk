import axios from "axios";

export async function get_shopee_product_detail(url) {
  try {
    // Ambil shopid dan itemid dari semua variasi URL Shopee
    const match = url.match(/i\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error("URL Shopee tidak valid atau tidak mengandung shopid/itemid.");
    }
    const [, shopid, itemid] = match;

    // Panggil API Shopee resmi
    const response = await axios.get(
      `https://shopee.co.id/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36",
          "Referer": url,
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const data = response.data?.data;
    if (!data) throw new Error("Data produk tidak ditemukan.");

    return {
      success: true,
      name: data.name,
      price: data.price_min / 100000,
      rating: data.item_rating?.rating_star,
      stock: data.stock,
      images: data.images?.map((img) => `https://cf.shopee.co.id/file/${img}`),
      url,
    };
  } catch (err) {
    console.error("Shopee Fetch Error:", err.message);
    return { success: false, message: err.message };
  }
}
