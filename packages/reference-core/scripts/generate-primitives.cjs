#!/usr/bin/env node
/**
 * Generates src/primitives/index.tsx with explicit primitive components.
 * Run: node scripts/generate-primitives.cjs
 *
 * Reads tags from src/primitives/tags.ts (hardcoded - math, rb, rtc excluded).
 * Panda's styled doesn't support math, rb, rtc.
 */

const fs = require('fs')
const path = require('path')
const tagsPath = path.join(__dirname, '../src/primitives/tags.ts')
const tagsContent = fs.readFileSync(tagsPath, 'utf8')
const match = tagsContent.match(/\[([\s\S]*?)\]\s+as const/)
if (!match) throw new Error('Could not parse TAGS from tags.ts')
const HTML_TAGS = match[1]
  .split(',')
  .map((s) => s.replace(/['"]/g, '').trim())
  .filter(Boolean)

function toPascalCase(tag) {
  if (tag.length === 0) return tag
  if (tag.length === 1) return tag.toUpperCase()
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

function escapeTag(tag) {
  if (tag === 'object') return 'Obj'
  if (tag === 'var') return 'Var' // 'var' is reserved in JS
  return toPascalCase(tag)
}

const outDir = path.join(__dirname, '../src/primitives')
const outPath = path.join(outDir, 'index.tsx')

const header = `/**
 * Reference UI Primitives (generated - do not edit)
 * Run: node scripts/generate-primitives.cjs
 *
 * Box-based primitives with fixed element. Uses styled[tag] for correct ref types.
 * Public API omits 'as' so consumers get type-safe, non-polymorphic components.
 * Full Box flexibility: r, container, all style props.
 */`

const lines = [
  header,
  '',
  "import { createBoxPrimitive } from './create-box-primitive.js'",
  '',
  "export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags.js'",
  'export type { PrimitiveElement, PrimitiveProps } from \'./types.js\'',
  '',
]

for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(`export const ${exportName} = createBoxPrimitive('${tag}')`)
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Generated', outPath)
