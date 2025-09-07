import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

(async () => {
  const browser = await playwrightChromium.launch({
    headless: false,  // tampilkan browser
    slowMo: 100,
    args: chromium.args,
    executablePath: await chromium.executablePath()
  });

  const page = await browser.newPage();
  await page.goto("https://s.lazada.co.id/s.ZXV40B", { waitUntil: "networkidle", timeout: 30000 });

  console.log("URL saat ini:", page.url());  // URL final setelah redirect

  // tunggu beberapa detik supaya halaman produk render
  await page.waitForTimeout(10000);

  // ambil screenshot untuk cek
  await page.screenshot({ path: "debug_shortlink.png", fullPage: true });

  // tetap biarkan browser terbuka supaya bisa lihat manual
  // await browser.close();
})();
