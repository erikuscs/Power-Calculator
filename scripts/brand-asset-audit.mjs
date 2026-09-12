import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const root = process.cwd()
const findings = []
const expectedAssets = new Map([
  ['public/brand/sg-logo-horizontal-reversed-dark.svg', '7ae7b68b6e67266fb5f4abd48c6ea18d67618c01c64976b288460dfc7ceb8ce1'],
  ['public/brand/favicon.ico', '7c2097a1086fd4d71350e37befac73226ba797321568e7ddcbfd061daefb2741'],
  ['public/brand/favicon.svg', 'ac6d9ffc97737223b2570423631192a14fd3d9f12e33760950ee0acb5c71d17a'],
  ['public/brand/safari-pinned-tab.svg', '42b81639fa1867031a89e9189e25cb57408ebb04bfbc05aa54eb79c6166ec1bf'],
  ['public/brand/favicon-16x16.png', 'e2ddb0132aa88415abc8913c1c855b7e559138b46dee2a577406535533e2c25c'],
  ['public/brand/favicon-20x20.png', '880a1c03960368d31192f924a09cc680d88b269e9603fcad469b0608207e1395'],
  ['public/brand/favicon-24x24.png', '81e949a1e538d33a6cd50d2c1df6998b00146c049b410f46c4e63a3dcf5699e9'],
  ['public/brand/favicon-32x32.png', 'd349383c3b321777d196ac6cfddc1d04faaaa3f9dba9e14a2b0b26ec1dbf3c86'],
  ['public/brand/favicon-48x48.png', '8d895c4492023541c98bd42beeedd97d6e72f456e932a4ec72e5f66d03e707cd'],
  ['public/brand/favicon-96x96.png', '6a1a3ada300e49db355323d459b7ba6bf4b3dc33a9fb7221e79e36214bc6689f'],
  ['public/brand/favicon-128x128.png', '7667e92e4758f88fa09acbbecfa5e2f6ce5421f2c54ea5049e2935a8cf8a8f91'],
  ['public/brand/apple-touch-icon.png', 'f580cf9165b4237d97d209061faac6003902b150404ea619559e62e56784165e'],
  ['public/brand/android-chrome-192x192.png', 'e9e5225a544bbd4180a5d0166fc3c10db80b196b5c358a6bd2bc15b0abac8bbb'],
  ['public/brand/android-chrome-512x512.png', '8c419ecb5b46d3a0f797282701439065a735145b752e8e5e57d470949584bae0'],
  ['public/brand/maskable-icon-512x512.png', '0389419861a0a2ba1f2f9e11777eb7913d0264f620dc1d3784985d45f738dcc3'],
  ['public/fonts/SORA-OFL.txt', 'ba0b9729c9428ba79a0459ab8ec575791b51509dbec213e383d0316d37fec299'],
  ['public/fonts/SOURCE-SANS-3-OFL.md', '56af9b9c6715597e458284a474dc118a50a4150e9d547c70f7b4a33c3e6a9328'],
  ['public/fonts/sora-latin-var.woff2', 'd2909123a6a8ed2f928055f002c32f63ee93496b470c1a344873f955111fca53'],
  ['public/fonts/source-sans-3-latin-var.woff2', 'ac057a5593cbe3df0d2585da5dd5f33b8efa84aa30550c710fe061b37fc5c54b'],
  ['assets/icon.svg', 'bbe61101ff1aa76057d9b7572738e1ed8ad0a82a1725b5a3179b96d02f280a01'],
  ['assets/icon-only.png', '0ae057eb7a000e91144dd5db3c1ce61d4475a06b3c21d286bf4eb0c6d917efb6'],
  ['assets/splash.svg', 'fb9ca2470085b158dca4655b14404bf0492d37d565dd5d8867da00d8abdc167d'],
  ['assets/splash.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['assets/splash-dark.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', '0ae057eb7a000e91144dd5db3c1ce61d4475a06b3c21d286bf4eb0c6d917efb6'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany-dark.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany-dark.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany-dark.png', 'cf926f6bc602cc5a03ad1ac432eeef2e7063bac7022cc4a7bcd7e72de1e757b2'],
])
const retiredTokens = [
  '#E8A33D',
  '#F0B04E',
  '#925515',
  '#C3A482',
  '#A77C47',
  '#C89A3C',
]
const allowedHexColors = new Set([
  '#0E151C',
  '#141D26',
  '#1C2732',
  '#1E2A38',
  '#34495E',
  '#42D392',
  '#5B6673',
  '#ABE1FA',
  '#C27A2C',
  '#C5C6C7',
  '#CCD2E9',
  '#D88A34',
  '#E9E4D6',
  '#F9FAFB',
  '#FFFBF4',
])
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.pbxproj', '.plist', '.storyboard', '.svg', '.ts', '.tsx', '.xcconfig'])

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const [asset, expected] of expectedAssets) {
  const path = join(root, asset)
  if (!existsSync(path)) {
    findings.push(`Missing controlled brand implementation asset: ${asset}`)
    continue
  }
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (actual !== expected) findings.push(`Controlled brand implementation checksum mismatch: ${asset}`)
}

const implementationRequirements = new Map([
  ['index.html', [
    '/brand/favicon.ico',
    '/brand/favicon.svg',
    '/brand/favicon-48x48.png',
    '/brand/favicon-32x32.png',
    '/brand/favicon-16x16.png',
    '/brand/apple-touch-icon.png',
    '/brand/safari-pinned-tab.svg',
  ]],
  ['vite.config.ts', [
    "name: 'Energy Management as a Service (EMaaS) Pro — Sustainable Gaps'",
    "short_name: 'EMaaS Pro'",
    "theme_color: '#0E151C'",
    "background_color: '#0E151C'",
    "'brand/favicon-20x20.png'",
    "'brand/favicon-24x24.png'",
    "'brand/favicon-128x128.png'",
    "'brand/safari-pinned-tab.svg'",
    "src: 'brand/android-chrome-192x192.png'",
    "src: 'brand/android-chrome-512x512.png'",
    "src: 'brand/maskable-icon-512x512.png'",
    "purpose: 'maskable'",
  ]],
  ['capacitor.config.ts', ["appName: 'EMaaS Pro'"]],
  ['ios/App/App/Info.plist', ['<string>EMaaS Pro</string>']],
])

for (const [file, requirements] of implementationRequirements) {
  const content = readFileSync(join(root, file), 'utf8')
  for (const requirement of requirements) {
    if (!content.includes(requirement)) findings.push(`Brand implementation requirement missing from ${file}: ${requirement}`)
  }
}

const activeFiles = [
  join(root, 'index.html'),
  join(root, 'vite.config.ts'),
  ...walk(join(root, 'src')),
  ...walk(join(root, 'public')),
  ...walk(join(root, 'assets')),
  ...walk(join(root, 'ios')),
]
for (const file of activeFiles) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue
  const content = readFileSync(file, 'utf8')
  const displayPath = relative(root, file).split(sep).join('/')
  for (const token of retiredTokens) {
    if (content.toUpperCase().includes(token)) findings.push(`Retired brand color ${token} in ${displayPath}`)
  }
  // The synchronized native bundle contains third-party renderer/chart defaults and
  // generated alpha colors. It is still checked for the retired SG tokens above;
  // the controlled-palette allowlist applies to application-authored source only.
  if (displayPath.startsWith('ios/App/App/public/')) continue
  if (/\bgold\b/i.test(content)) findings.push(`Retired gold terminology in ${displayPath}`)
  for (const match of content.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    const color = match[0].toUpperCase()
    if (displayPath === 'public/brand/safari-pinned-tab.svg' && color === '#000000') continue
    if (!allowedHexColors.has(color)) findings.push(`Off-palette color ${match[0]} in ${displayPath}`)
  }
  if (/(?:rgb|hsl)a?\s*\(/i.test(content)) {
    findings.push(`Non-token RGB/HSL color syntax in ${displayPath}; use a controlled hexadecimal palette value`)
  }
}

if (findings.length) {
  console.error('Brand asset audit failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Brand asset audit passed: controlled web/native assets match and retired gold tokens are absent from active application files.')
