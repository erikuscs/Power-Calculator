import { mkdir, copyFile } from 'node:fs/promises'
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
await page.locator('[data-artifact-actions]').evaluate((element) => {
  element.style.display = 'none'
})
await page.locator('[data-artifact-section="site-layout"]').evaluate((element) => {
  element.style.display = 'none'
})
const oneLineImage = await page.locator('.hybrid-example-report').screenshot()
await page.locator('[data-artifact-section="site-layout"]').evaluate((element) => {
  element.style.display = ''
})
const siteLayoutImage = await page.locator('[data-artifact-section="site-layout"]').screenshot()

const pdfPage = await browser.newPage({ viewport: { width: 1123, height: 1588 } })
await pdfPage.setContent(`<!doctype html><html><head><style>
  @page { size: A3 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0e151c; }
  .page { width: 297mm; height: 420mm; padding: 8mm; display: flex; align-items: center; justify-content: center; page-break-after: always; background: #0e151c; }
  .page:last-child { page-break-after: auto; }
  img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
</style></head><body>
  <section class="page"><img alt="EMaaS Pro 2,000 A hybrid one-line and sizing summary" src="data:image/png;base64,${oneLineImage.toString('base64')}"></section>
  <section class="page"><img alt="EMaaS Pro 2,000 A hybrid conceptual equipment envelope" src="data:image/png;base64,${siteLayoutImage.toString('base64')}"></section>
</body></html>`, { waitUntil: 'load' })
await pdfPage.pdf({
  path: outputPdf,
  format: 'A3',
  landscape: false,
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
