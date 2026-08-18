import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const port = process.env.E2E_PORT ?? '5174'
const baseUrl = `http://127.0.0.1:${port}`

const server = spawn(
  'npm',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', port, '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' },
)

let serverOutput = ''
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

function stopServer() {
  if (server.killed) return

  try {
    if (process.platform === 'win32') {
      server.kill('SIGTERM')
    } else {
      process.kill(-server.pid, 'SIGTERM')
    }
  } catch {
    server.kill('SIGTERM')
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      await delay(500)
    }
  }
  throw new Error(`Timed out waiting for ${baseUrl}\n${serverOutput}`)
}

async function clearDisclaimer(page) {
  const button = page.getByRole('button', { name: /continue to/i })
  if (await button.count()) {
    await button.first().click()
  }
}

async function expectText(page, pattern, label) {
  const count = await page.getByText(pattern).count()
  if (count < 1) {
    throw new Error(`Expected to find ${label}`)
  }
}

async function run() {
  await waitForServer()

  const browser = await chromium.launch({ headless: true })
  const errors = []

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`${baseUrl}/power/generator`, { waitUntil: 'networkidle' })
  await clearDisclaimer(page)
  await page.getByLabel('Voltage').selectOption('208')
  await expectText(page, /Suggested Equipment Setup/i, 'generator suggested setup')

  await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle' })
  await expectText(page, /EMaaS\.pro Tutorial/i, 'start-here tutorial')
  await expectText(page, /Basic operating path/i, 'tutorial operating path')

  await page.goto(`${baseUrl}/bess/sizing`, { waitUntil: 'networkidle' })
  await expectText(page, /250 kW \/ 575 kWh BESS/i, 'Sunbelt-style BESS unit option')
  await expectText(page, /Suggested Equipment Setup/i, 'BESS suggested setup')

    await page.goto(`${baseUrl}/scenarios/temp-power`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /edit requirements/i }).click()
    await page.getByLabel('Site Voltage').selectOption('208')
    await page.getByLabel('Rental Period', { exact: true }).selectOption('weekly')
    await page.getByLabel('Number of Rental Periods').fill('2')
    await page.getByLabel('Operating Schedule').selectOption('shift_8')
    await expectText(page, /112 operating hours/i, 'rental-derived operating hours')
    if (await page.getByLabel('Target Temperature').count()) {
      throw new Error('Cooling fields should be hidden for the generator-only scope')
    }
    await page.getByRole('button', { name: 'Add Temporary Cooling' }).click()
    await page.getByLabel('Target Temperature').fill('72')
    await page.getByRole('button', { name: /Apply Requirements/i }).click()
    await expectText(page, /Unknown \/ add contingency/i, 'clear risk posture wording')
    await expectText(page, /Recommended Energy Plan/i, 'decision-first temp power recommendation')
    await expectText(page, /Why this fits/i, 'plain-language recommendation rationale')
    await expectText(page, /Standalone generator with temporary cooling/i, 'generator-first selected scope')
    await expectText(page, /Both views show only the equipment included in this scope/i, 'scope-matched visuals')
    await expectText(page, /Save PDF/i, 'PDF save action')
    await expectText(page, /Share PDF/i, 'PDF share action')

    await page.goto(`${baseUrl}/scenarios/hybrid-energy`, { waitUntil: 'networkidle' })
    await page.getByLabel('Site Voltage').selectOption('208')
    await page.getByLabel('BESS Rate Period').selectOption('weekly')
    await page.getByLabel('Generator Rate Period').selectOption('monthly')
    await page.getByLabel('Redundancy Level').selectOption('field_verify')
    await expectText(page, /Field verify uses N\+1 planning capacity/i, 'field-verify redundancy note')
    await expectText(page, /Streamlined Hybrid Spec/i, 'streamlined hybrid spec summary')
    await expectText(page, /Operating Path/i, 'streamlined operating path')
    await expectText(page, /24\/7 Hybrid Coverage Scenarios/i, 'hybrid 24/7 coverage scenarios')
    await expectText(page, /Battery-first hybrid microgrid/i, 'battery-first hybrid dispatch scenario')
    await expectText(page, /Printable Electrical One-Line/i, 'printable electrical one-line diagram')
    await expectText(page, /Print One-Line/i, 'one-line print action')
    await expectText(page, /300 kW legacy \/ large-system BESS/i, 'selected legacy BESS recommendation')

    await page.goto(`${baseUrl}/scenarios/bess-project`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Next: Financial Parameters/i }).click()
    await page.getByRole('button', { name: /Next: View Results/i }).click()
    await expectText(page, /Suggested Equipment Setup/i, 'BESS project suggested setup')
    await expectText(page, /Fuel-cell|Fuel cell/i, 'fuel-cell guidance')

    await page.goto(`${baseUrl}/privacy`, { waitUntil: 'networkidle' })
    await expectText(page, /does not collect, store, or transmit any personal data/i, 'privacy policy content')

    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(`${baseUrl}/scenarios/temp-power`, { waitUntil: 'networkidle' })
    await expectText(page, /Recommended Energy Plan/i, 'mobile recommendation view')
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    if (hasHorizontalOverflow) throw new Error('Temporary power recommendation overflows the mobile viewport')

    if (errors.length > 0) {
      throw new Error(`Browser errors detected:\n${errors.join('\n')}`)
    }
  } finally {
    await browser.close()
  }
}

try {
  await run()
  console.log('E2E smoke checks passed')
} finally {
  stopServer()
}
