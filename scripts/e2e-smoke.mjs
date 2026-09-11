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
  await expectText(page, /EMaaS guided learning/i, 'guided learning page')
  await expectText(page, /Basic operating path/i, 'tutorial operating path')

    await page.goto(`${baseUrl}/hvac/heating`, { waitUntil: 'networkidle' })
    await expectText(page, /Temporary Heating Plan/i, 'temporary heating workflow')
    await expectText(page, /135,000/i, 'calculated temporary heating requirement')
    await expectText(page, /Propane at Full Fire/i, 'propane fuel result')
    await expectText(page, /Auxiliary Generator Allowance/i, 'propane auxiliary power result')
    await page.getByRole('button', { name: 'Electric Heater' }).click()
    await expectText(page, /Electric Heater Demand/i, 'electric resistance demand')
    await expectText(page, /Generator Planning Rating/i, 'electric heater generator sizing')

    await page.goto(`${baseUrl}/bess/sizing`, { waitUntil: 'networkidle' })
  await expectText(page, /250 kW \/ 575 kWh BESS/i, 'Sunbelt-style BESS unit option')
    await expectText(page, /Suggested Equipment Setup/i, 'BESS suggested setup')

    await page.goto(`${baseUrl}/bess/runtime?pf=2`, { waitUntil: 'networkidle' })
    await expectText(page, /Power factor must be greater than 0 and no more than 1/i, 'invalid power factor explanation')
    if (await page.getByText('Estimated Runtime').count()) {
      throw new Error('Invalid power factor should withhold BESS runtime results')
    }

    await page.goto(`${baseUrl}/scenarios/temp-power`, { waitUntil: 'networkidle' })
    const returnToSg = page.getByRole('link', { name: 'Back to Sustainable Gaps' })
    if ((await returnToSg.getAttribute('href')) !== 'https://www.sustainablegaps.com/emaas/') {
      throw new Error('EMaaS header is missing the governed return route to Sustainable Gaps')
    }
    await page.getByRole('button', { name: /Use as My Starting Point/i }).click()
    await page.getByLabel('Client / Account').fill('E2E Account')
    await page.getByLabel('Project / Phase').fill('Temporary Power Review')
    await page.getByLabel('Source Voltage').selectOption('208')
    await page.getByLabel('Load Voltage').selectOption('208')
    await page.getByLabel('Rental Period', { exact: true }).selectOption('weekly')
    await page.getByLabel('Number of Rental Periods').fill('2')
    await page.getByLabel('Operating Schedule').selectOption('shift_8')
    await expectText(page, /112 scheduled hours/i, 'rental-derived scheduled coverage')
    if (await page.getByLabel('Cooling Equipment Demand').count()) {
      throw new Error('Cooling fields should be hidden for the generator-only scope')
    }
    await page.getByRole('button', { name: 'Power + Cooling' }).click()
    await page.getByLabel('Cooling Equipment Demand').fill('42')
    await page.getByLabel('Cooling Capacity').fill('35')
    await page.getByRole('button', { name: /^Done$/i }).click()
    await expectText(page, /Unknown \/ needs confirmation/i, 'clear risk posture wording')
    await expectText(page, /Temporary Power Planning Brief/i, 'customer-safe temp power planning brief')
    await expectText(page, /Equipment comes after verification/i, 'equipment release boundary')
    await expectText(page, /entered cooling-equipment demand/i, 'entered cooling load carried into planning scope')
    await expectText(page, /Planning Path/i, 'conversation-first planning path')
    await expectText(page, /Calculation check passed/i, 'calculation verification gate')
    await expectText(page, /internal arithmetic only/i, 'calculation verification boundary')
    await expectText(page, /Continuity/i, 'continuity intent step')
    await expectText(page, /Voltage/i, 'voltage requirement step')
    await expectText(page, /Save Draft/i, 'draft PDF save action')
    await expectText(page, /Share Draft/i, 'draft PDF share action')
    const [planningBriefDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Save Draft' }).click(),
    ])
    if (!planningBriefDownload.suggestedFilename().toLowerCase().endsWith('.pdf')) {
      throw new Error('Temporary-power planning brief did not download as a PDF')
    }
    await planningBriefDownload.createReadStream()
    await expectText(page, /Draft planning brief saved/i, 'browser PDF generation with controlled report fonts')

    await page.goto(`${baseUrl}/learn`, { waitUntil: 'networkidle' })
    await page.goto(`${baseUrl}/scenarios/temp-power`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Review temporary power inputs' }).click()
    if ((await page.getByLabel('Client / Account').inputValue()) !== 'E2E Account') {
      throw new Error('Temporary-power customer draft did not persist across navigation')
    }
    if ((await page.getByLabel('Cooling Equipment Demand').inputValue()) !== '42') {
      throw new Error('Temporary-power cooling demand did not persist across navigation')
    }
    await page.getByRole('button', { name: /^Done$/i }).click()
    await page.getByRole('button', { name: 'Add to Estimate' }).click()
    await page.getByRole('heading', { name: 'Build Estimate' }).waitFor()
    await expectText(page, /Temporary Power Requirement/i, 'imported temporary-power requirement')
    await page.getByLabel('Jobsite Address').fill('100 Test Yard Road')
    await page.getByRole('button', { name: /Add line/i }).click()
    await page.getByLabel('Description').fill('Generator package')
    await page.getByLabel('Model / SKU').fill('GEN-TEST-100')
    await page.getByLabel('Quantity').fill('2')
    await page.getByLabel('Rate', { exact: true }).fill('500')
    await page.getByLabel('Periods').fill('3')
    await expectText(page, /\$3,000\.00/i, 'calculated estimate line total')
    await expectText(page, /Discount Amount/i, 'visible discount amount')
    await expectText(page, /Tax Amount/i, 'visible tax amount')

    await page.goto(`${baseUrl}/hvac/cooling`, { waitUntil: 'networkidle' })
    await page.getByLabel('Relative Humidity').fill('120')
    await expectText(page, /must be between 0% and 100%/i, 'humidity physical-range validation')
    if (await page.getByRole('button', { name: 'Generate EMaaS PDF' }).count()) {
      throw new Error('Cooling PDF remained available for invalid relative humidity')
    }

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
    await expectText(page, /does not receive or transmit the customer, job, or calculator information/i, 'privacy policy content')

    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(`${baseUrl}/hvac/heating`, { waitUntil: 'networkidle' })
    await expectText(page, /Temporary Heating Plan/i, 'mobile temporary heating workflow')
    const heatingHasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    if (heatingHasHorizontalOverflow) throw new Error('Temporary heating plan overflows the mobile viewport')

    await page.evaluate(() => {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith('power-calc:/scenarios/temp-power:'))
        .forEach((key) => window.localStorage.removeItem(key))
    })
    await page.goto(`${baseUrl}/scenarios/temp-power`, { waitUntil: 'networkidle' })
    await expectText(page, /Temporary Power Planning Brief/i, 'mobile planning brief')
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    if (hasHorizontalOverflow) throw new Error('Temporary power recommendation overflows the mobile viewport')

    await page.getByRole('button', { name: 'Toggle menu' }).click()
    const mobileNavigation = page.getByRole('dialog', { name: 'EMaaS navigation' })
    if (!(await mobileNavigation.isVisible())) throw new Error('Mobile navigation did not open as a modal dialog')
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Close menu')
    await page.keyboard.press('Escape')
    if (await mobileNavigation.isVisible()) throw new Error('Mobile navigation did not close with Escape')

    await page.getByRole('button', { name: /Use as My Starting Point/i }).click()
    await page.getByLabel('Client / Account').fill('Mobile E2E Account')
    await page.getByLabel('Project / Phase').fill('Mobile Trailer Review')
    await page.getByRole('button', { name: 'Base Camp / Multi-Facility' }).click()
    const requirementsDialog = page.getByRole('dialog', { name: 'Edit temporary power requirements' })
    const scrollState = await requirementsDialog.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }
    })
    if (scrollState.scrollHeight <= scrollState.clientHeight || scrollState.scrollTop <= 0) {
      throw new Error(`Base Camp requirements did not scroll on mobile: ${JSON.stringify(scrollState)}`)
    }
    await expectText(page, /Jobsite Trailer Model/i, 'mobile jobsite trailer selector')
    await page.getByLabel('Jobsite Trailer Model').selectOption('mobile-modular-2161-8x20')
    await expectText(page, /Manufacturer context/i, 'sourced trailer manufacturer context')
    await expectText(page, /No operating load is inferred/i, 'no inferred trailer operating load')
    await page.getByLabel('Planned Load').last().fill('6.6')
    await page.getByRole('button', { name: /^Done$/i }).click()
    await expectText(page, /Temporary Power Planning Brief/i, 'mobile trailer planning brief')

    await page.goto(`${baseUrl}/estimate`, { waitUntil: 'networkidle' })
    await expectText(page, /Build Estimate/i, 'mobile estimate builder')
    const estimateHasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    if (estimateHasHorizontalOverflow) throw new Error('Estimate builder overflows the mobile viewport')

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
