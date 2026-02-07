#!/usr/bin/env node
/**
 * Generates src/primitives/index.tsx with explicit primitive components.
 * Run: node scripts/generate-primitives.cjs
 *
 * Each primitive = styled[tag] composed with box pattern (r, container).
 * Simple composition, no createElement.
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
  if (tag === 'var') return 'Var'
  return toPascalCase(tag)
}

const outDir = path.join(__dirname, '../src/primitives')
const outPath = path.join(outDir, 'index.tsx')

const header = `/**
 * Reference UI Primitives (generated - do not edit)
 * Run: node scripts/generate-primitives.cjs
 *
 * styled[tag] + box pattern (r, container). Simple composition.
 */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types.js'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags.js'
export type { PrimitiveElement, PrimitiveProps } from './types.js'

`

function genPrimitive(tag, exportName) {
  const styledVar = `Styled${exportName}`
  return [
    `const ${styledVar} = styled['${tag}']`,
    `export const ${exportName} = forwardRef((props, ref) => {`,
    `  const [p, r] = splitProps(props, ['r', 'container'])`,
    `  return <${styledVar} ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />`,
    `}) as React.ForwardRefExoticComponent<PrimitiveProps<'${tag}'> & React.RefAttributes<PrimitiveElement<'${tag}'>>>`,
    '',
  ].join('\n')
}

const lines = [header]
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(genPrimitive(tag, exportName))
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Generated', outPath)
