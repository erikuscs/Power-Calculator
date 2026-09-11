import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const root = process.cwd()
const distDir = join(root, 'dist')
const viteConfigPath = join(root, 'vite.config.ts')
const findings = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

if (!existsSync(distDir)) {
  findings.push(`Missing production build: ${distDir}. Run npm run build first.`)
} else {
  for (const file of walk(distDir)) {
    const artifact = relative(distDir, file).split(sep).join('/')
    const extension = extname(file).toLowerCase()

    if (extension === '.map') {
      findings.push(`Browser source map must not ship: ${artifact}`)
      continue
    }

    if (artifact.startsWith('assets/') && extension === '.js') {
      const usesGenericProductionName = /^assets\/(app|chunks)\/[A-Za-z0-9_-]+\.js$/.test(artifact)
      if (!usesGenericProductionName) {
        findings.push(`Production JavaScript chunk exposes a descriptive filename: ${artifact}`)
      }
    }

    if (!['.js', '.css'].includes(extension) || statSync(file).size === 0) continue
    const content = readFileSync(file, 'utf8')
    if (/sourceMappingURL\s*=/.test(content)) {
      findings.push(`Source-map reference must not ship: ${artifact}`)
    }
    if (/(?:webpack|vite):\/\//.test(content) || /[/\\]src[/\\](?:features|lib|components)[/\\]/.test(content)) {
      findings.push(`Production bundle exposes a source-module path: ${artifact}`)
    }
  }
}

const viteConfig = readFileSync(viteConfigPath, 'utf8')
for (const requirement of [
  "sourcemap: false",
  "minify: 'oxc'",
  "entryFileNames: 'assets/app/[hash].js'",
  "chunkFileNames: 'assets/chunks/[hash].js'",
]) {
  if (!viteConfig.includes(requirement)) findings.push(`Vite production guard is missing: ${requirement}`)
}

if (findings.length) {
  console.error('Production artifact audit failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Production artifact audit passed: EMaaS ships minified, generically named JavaScript without browser source maps.')
