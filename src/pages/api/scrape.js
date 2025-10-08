// Node.js Express + Puppeteer
import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const price = await page.$eval(
    "span.pdp-v2-product-price-content-salePrice-amount",
    el => el.textContent.trim()
  );

  await browser.close();
  res.json({ price });
});

app.listen(3000);
