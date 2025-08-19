import axios from "axios";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { shortlink } = req.body;
  if (!shortlink) return res.status(400).json({ error: "Shortlink kosong" });

  try {
    const response = await axios.get(shortlink, {
      maxRedirects: 10,         // ikuti redirect sampai 10 kali
      validateStatus: null,     // supaya status 3xx tidak error
    });

    // response.request.res.responseUrl kadang undefined, fallback ke shortlink
    const realUrl = response.request?.res?.responseUrl || shortlink;

    res.json({ realUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
