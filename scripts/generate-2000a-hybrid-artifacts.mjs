import { mkdir, copyFile, readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.EMAAS_BASE_URL ?? 'http://127.0.0.1:5174'
const outputPdf = path.join(root, 'output', 'pdf', 'EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf')
const sitePdf = path.join(root, 'public', 'examples', 'EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf')
const outputPng = path.join(root, 'output', 'screenshots', 'EMAAS-Pro-2000A-Hybrid-Linked-Plan.png')
const sitePng = path.join(root, 'public', 'examples', 'EMAAS-Pro-2000A-Hybrid-Linked-Plan.png')

await Promise.all([
  mkdir(path.dirname(outputPdf), { recursive: true }),
  mkdir(path.dirname(outputPng), { recursive: true }),
  mkdir(path.dirname(sitePdf), { recursive: true }),
])

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1488, height: 1060 }, deviceScaleFactor: 1 })
await page.goto(`${baseUrl}/examples/2000a-hybrid`, { waitUntil: 'networkidle' })
const disclaimerButton = page.getByRole('button', { name: 'Continue to EMaaS Pro' })
if (await disclaimerButton.isVisible().catch(() => false)) {
  await disclaimerButton.click()
}
await page.waitForTimeout(250)
await page.screenshot({ path: outputPng, fullPage: true })
const screenshotData = await readFile(outputPng)
const pdfPage = await browser.newPage({ viewport: { width: 1488, height: 1060 } })
await pdfPage.setContent(`<!doctype html><html><head><style>
  @page { size: 16in 10in; margin: 0; }
  html, body { margin: 0; width: 100%; height: 100%; background: #0e151c; overflow: hidden; }
  body { display: flex; align-items: center; justify-content: center; }
  img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style></head><body><img alt="EMaaS Pro 2,000 A hybrid linked plan and one-line" src="data:image/png;base64,${screenshotData.toString('base64')}"></body></html>`, { waitUntil: 'load' })
await pdfPage.pdf({
  path: outputPdf,
  width: '16in',
  height: '10in',
  landscape: true,
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
})
await browser.close()

await Promise.all([
  copyFile(outputPdf, sitePdf),
  copyFile(outputPng, sitePng),
])

console.log(outputPdf)
console.log(outputPng)
