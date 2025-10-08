import axios from "axios";

/**
 * Ambil detail produk Shopee dari URL.
 * @param {string} url - URL produk Shopee
 */
export async function get_shopee_product_detail(url) {
  try {
    // Ekstrak shopid & itemid dari URL Shopee
    const match = url.match(/i\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error("URL produk Shopee tidak valid.");
    }
    const [, shopid, itemid] = match;

    // Request API Shopee resmi (v4)
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

    return response.data.data;
  } catch (err) {
    console.error("Shopee API Error:", err.message);
    return { error: true, message: err.message };
  }
}
