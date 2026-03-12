import { chromium as playwrightChromium } from 'playwright-core'
import chromium from '@sparticuz/chromium'

export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*")
res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS")
res.setHeader("Access-Control-Allow-Headers", "Content-Type")

if (req.method === "OPTIONS") return res.status(200).end()
if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

const { shortlink } = req.body
if (!shortlink) return res.status(400).json({ error: "Shortlink kosong" })

let browser = null

try {


browser = await playwrightChromium.launch({
  headless: true,
  args: chromium.args,
  executablePath: await chromium.executablePath()
})

const page = await browser.newPage()

await page.goto(shortlink, {
  waitUntil: "networkidle",
  timeout: 30000
})

const realUrl = page.url()

const productPage = await browser.newPage()

await productPage.goto(realUrl, {
  waitUntil: "domcontentloaded",
  timeout: 30000
})

let title = await productPage.title().catch(()=>null)

const image_selectors = [
  "img[data-testid='PDPMainImage']",
  "img[class*='main-image']",
  "img[class*='css']"
]

let image = null

for (const s of image_selectors) {
  image = await productPage.$eval(s, el => el.src).catch(()=>null)
  if (image) break
}

const price_selectors = [
  "div.flex.items-baseline span",
  "div[class*='flex'][class*='items-baseline'] span",
  "span[data-testid='lblPDPDetailProductPrice']",
  "span[class*='price']"
]

let price = null

for (const s of price_selectors) {
  price = await productPage.$eval(s, el => el.textContent.trim()).catch(()=>null)
  if (price) break
}

const sold_selectors = [
  "span[data-testid='lblPDPDetailProductSoldCounter']",
  "span[class*='sold']",
  "div[class*='sold']"
]

let sold = null

for (const s of sold_selectors) {
  sold = await productPage.$eval(s, el => el.textContent.trim()).catch(()=>null)
  if (sold) break
}

await browser.close()

return res.json({
  realUrl,
  title,
  image,
  price,
  sold
})


} catch (err) {


if (browser) await browser.close()

return res.status(500).json({
  error: err.message
})


}
}
