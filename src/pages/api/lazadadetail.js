const express = require('express');
const { Scraper, Root, CollectContent } = require('nodejs-web-scraper');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const scraper = new Scraper({
    root: new Root(url),
    collect: [
      new CollectContent({
        selector: 'title',
        name: 'title',
      }),
      new CollectContent({
        selector: '.pdp-price',
        name: 'price',
      }),
    ],
  });

  try {
    const data = await scraper.scrape();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
