import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const root = process.cwd()
const findings = []
const expectedAssets = new Map([
  ['public/brand/sg-logo-horizontal-reversed-dark.svg', '7ae7b68b6e67266fb5f4abd48c6ea18d67618c01c64976b288460dfc7ceb8ce1'],
  ['public/brand/favicon.ico', 'fce0ff25881c99188791ab1b894220852c0f1679b4a992f10af6c20bf7f66ec0'],
  ['public/brand/favicon.svg', '81589bf6c59791df20ae637861ec4ae5e4b11e1d70d18907adbe86f913c73897'],
  ['public/brand/favicon-16x16.png', '2bb8a2bce7b26aacc7966b12f08f11d720f1bdb3aedaf66c43b24a270a54c640'],
  ['public/brand/favicon-32x32.png', 'e3f3a6a9c9c7f191651b55ac0d9dd5b4fc019040eb3c4d1fa015959ecb6cf36b'],
  ['public/brand/favicon-48x48.png', '79af7ffda0eee76ebf673fc19a0133d7aa38b3c312a94a3150acc00668e0495b'],
  ['public/brand/favicon-96x96.png', '2df5e82ab66e79c1832a266435b7c6632e3cad054643e2a09321bdcc8b1629d1'],
  ['public/brand/apple-touch-icon.png', '8521bd750beac5b81e2e4ab467657a9ff77b66951965d3e8af657ba954bc0b6e'],
  ['public/brand/android-chrome-192x192.png', 'd8c2a762aab9de98178a97fd8d505dcf617795df30ce89f78c30124035ef1e9b'],
  ['public/brand/android-chrome-512x512.png', '1ced33bd2374f861898bcdb217ee9ac9991f26a943883aaa83030fb21249a8ca'],
  ['public/brand/maskable-icon-512x512.png', 'd29a68dd678dabd2df2c60319a74309ef0cc8b8b00ea4048d778bfd46024a08b'],
  ['public/fonts/SORA-OFL.txt', 'ba0b9729c9428ba79a0459ab8ec575791b51509dbec213e383d0316d37fec299'],
  ['public/fonts/SOURCE-SANS-3-OFL.md', '56af9b9c6715597e458284a474dc118a50a4150e9d547c70f7b4a33c3e6a9328'],
  ['public/fonts/sora-latin-var.woff2', 'd2909123a6a8ed2f928055f002c32f63ee93496b470c1a344873f955111fca53'],
  ['public/fonts/source-sans-3-latin-var.woff2', 'ac057a5593cbe3df0d2585da5dd5f33b8efa84aa30550c710fe061b37fc5c54b'],
  ['assets/icon.svg', '4c14fd0d5f57712ccd46ca992058070ede9ceff7f366973309a733a22109a0ec'],
  ['assets/icon-only.png', '781559e2fe412b3574b7d1cfe3e64aa42d4b0f38a9ce9ec39689eb29fab0fc10'],
  ['assets/splash.svg', 'fb9ca2470085b158dca4655b14404bf0492d37d565dd5d8867da00d8abdc167d'],
  ['assets/splash.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['assets/splash-dark.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', '781559e2fe412b3574b7d1cfe3e64aa42d4b0f38a9ce9ec39689eb29fab0fc10'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany-dark.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany-dark.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
  ['ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany-dark.png', '87c3f0486c734aae62c467bd7a4bd5a3027029d49deb22078333b5cd1dc1dbe5'],
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
    '/brand/favicon-32x32.png',
    '/brand/apple-touch-icon.png',
  ]],
  ['vite.config.ts', [
    "name: 'Energy Management as a Service (EMaaS) Pro — Sustainable Gaps'",
    "short_name: 'EMaaS Pro'",
    "theme_color: '#0E151C'",
    "background_color: '#0E151C'",
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
