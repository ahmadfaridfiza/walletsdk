// server.js
import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// POST /scrape
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: "Missing 'url' in body" });

  try {
    // Set User-Agent supaya Lazada tidak langsung blok
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const { data: html } = await axios.get(url, { headers, timeout: 15000 });

    if (!html || html.trim().length === 0) {
      return res.status(500).json({ ok: false, error: "Empty HTML response. Maybe blocked or invalid URL" });
    }

    const $ = cheerio.load(html);

    // Detect if Captcha / anti-bot page
    const titleText = $('title').text() || '';
    if (/captcha|interception/i.test(titleText)) {
      return res.status(403).json({ ok: false, reason: 'captcha', detail: 'Detected anti-bot (captcha/interception). Use proxy or cookies.' });
    }

    // Ambil title
    const title = $('title').text().trim() || null;

    // Ambil price
    const priceSelector = 'span.pdp-v2-product-price-content-salePrice-amount';
    const price = $(priceSelector).first().text().trim() || null;

    res.json({ ok: true, url, title, price });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
