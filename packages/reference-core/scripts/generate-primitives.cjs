#!/usr/bin/env node
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

const header = `/** Generated. Run: node scripts/generate-primitives.cjs */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '@reference-ui/core/system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags'
export type { PrimitiveElement, PrimitiveProps } from './types'

function applyBoxPattern(props: object): object {
  const [boxProps, rest] = splitProps(props, ['r', 'container'])
  const styles = box.raw(boxProps as Parameters<typeof box.raw>[0]) as object
  return { ...styles, ...(rest as object) }
}

`

function genPrimitive(tag, exportName) {
  return `export const ${exportName} = forwardRef<PrimitiveElement<'${tag}'>, PrimitiveProps<'${tag}'>>((props, ref) => <styled.${tag} ref={ref} {...applyBoxPattern(props)} />) as React.ForwardRefExoticComponent<PrimitiveProps<'${tag}'> & React.RefAttributes<PrimitiveElement<'${tag}'>>>`
}

function genTypeExport(tag, exportName) {
  return `export type ${exportName}Props = PrimitiveProps<'${tag}'>`
}

const lines = [header]

// Generate type exports
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(genTypeExport(tag, exportName))
}

lines.push('') // Add a blank line between types and components

// Generate component exports
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(genPrimitive(tag, exportName))
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Generated', outPath)
