import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const root = process.cwd()
const findings = []
const expectedAssets = new Map([
  ['public/brand/sg-logo-horizontal-reversed-dark.svg', '7ae7b68b6e67266fb5f4abd48c6ea18d67618c01c64976b288460dfc7ceb8ce1'],
  ['public/brand/sg-logo-bridge-1c-deep-blue-96.png', '3bac1bc001d24963ed7a7aeb1094948349c4d022a666fac3b965bbdd584b944f'],
])
const retiredTokens = [
  '#E8A33D',
  '#F0B04E',
  '#925515',
  '#C3A482',
  '#A77C47',
  '#C89A3C',
]
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg', '.ts', '.tsx'])

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const [asset, expected] of expectedAssets) {
  const path = join(root, asset)
  if (!existsSync(path)) {
    findings.push(`Missing registered brand asset: ${asset}`)
    continue
  }
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex')
  if (actual !== expected) findings.push(`Registered brand asset checksum mismatch: ${asset}`)
}

const activeFiles = [join(root, 'index.html'), ...walk(join(root, 'src')), ...walk(join(root, 'public'))]
for (const file of activeFiles) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue
  const content = readFileSync(file, 'utf8')
  const displayPath = relative(root, file).split(sep).join('/')
  for (const token of retiredTokens) {
    if (content.toUpperCase().includes(token)) findings.push(`Retired brand color ${token} in ${displayPath}`)
  }
  if (/\bgold\b/i.test(content)) findings.push(`Retired gold terminology in ${displayPath}`)
}

if (findings.length) {
  console.error('Brand asset audit failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Brand asset audit passed: registered SG assets match and retired gold tokens are absent from active application files.')
