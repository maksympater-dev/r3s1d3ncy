import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const scanRoots = ['src']
const extensions = new Set(['.css', '.ts', '.tsx', '.js', '.jsx'])

const rules = [
  {
    id: 'no-img-tags',
    pattern: /<img\b/,
    message: 'Use next/image instead of raw <img> tags.',
  },
  {
    id: 'no-transition-all',
    pattern: /\btransition-all\b/,
    message:
      'Avoid transition-all; explicitly transition transform, opacity, or colors.',
  },
  {
    id: 'no-persistent-will-change',
    pattern: /\bwill-change\s*:/,
    message:
      'Avoid persistent will-change; add it dynamically only around active animations.',
  },
  {
    id: 'no-layout-transition-properties',
    pattern:
      /transition(?:-property)?\s*:[^;]*(?:width|height|margin|padding|top|left)/,
    message:
      'Do not transition layout geometry; use transform and opacity instead.',
  },
  {
    id: 'no-raw-interval-animation',
    pattern: /\bsetInterval\s*\(/,
    message:
      'Avoid setInterval animation loops; use timeline/ticker-driven animation with throttled DOM writes.',
  },
  {
    id: 'no-heavy-blur-filters',
    pattern: /\b(?:backdrop-blur|blur-3xl|\[filter:|filter\s*:)/,
    message:
      'Avoid blur/filter effects on animated or full-screen UI; they are expensive on integrated GPUs.',
  },
  {
    id: 'no-extra-large-arbitrary-shadows',
    pattern: /shadow-\[0_(?:30|34)px_(?:120|130)px_/,
    message:
      'Avoid very large box-shadow radii on large animated surfaces.',
  },
]

function walk(dir) {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') return []
      return walk(path)
    }

    return extensions.has(extname(path)) ? [path] : []
  })
}

const files = scanRoots.flatMap((scanRoot) => walk(join(root, scanRoot)))
const findings = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)

  for (const rule of rules) {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        findings.push({
          file: relative(root, file),
          line: index + 1,
          rule: rule.id,
          message: rule.message,
          code: line.trim(),
        })
      }
    })
  }
}

if (findings.length > 0) {
  console.error('Performance audit failed:')
  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`,
    )
    console.error(`  ${finding.code}`)
  }
  process.exit(1)
}

console.log('Performance audit passed.')
