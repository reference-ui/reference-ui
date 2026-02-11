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

// Scan primitives/css/*.style.ts and map tag -> recipe (from system/recipes after panda codegen)
const cssDir = path.join(__dirname, '../src/primitives/css')
const PRIMITIVE_RECIPES = {}
if (fs.existsSync(cssDir)) {
  for (const name of fs.readdirSync(cssDir)) {
    const m = name.match(/^(\w+)\.style\.ts$/)
    if (m) PRIMITIVE_RECIPES[m[1]] = m[1]
  }
}

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

// Import recipes from system (Panda-generated) - only those we have style files for
const recipeImports = Object.keys(PRIMITIVE_RECIPES).length
  ? `import { ${Object.keys(PRIMITIVE_RECIPES).join(', ')} } from '../system/recipes'`
  : ''

const header = `/** Generated. Run: node scripts/generate-primitives.cjs */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { cx } from '../system/css/index.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types'
${recipeImports ? '\n' + recipeImports + '\n' : ''}
export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags'
export type { PrimitiveElement, PrimitiveProps } from './types'

/** Apply box pattern. When tag has a matching recipe, applies that recipe's static className (user css prop still overrides). */
function applyBoxPattern(props: object, recipeClassName?: string): object {
  const [boxProps, rest] = splitProps(props, ['r', 'container'])
  const { className, ...restProps } = rest as Record<string, unknown>
  return {
    ...(box.raw(boxProps as Parameters<typeof box.raw>[0]) as object),
    ...restProps,
    className: cx(recipeClassName, className as string | undefined),
  }
}

`

function genPrimitive(tag, exportName) {
  const recipeRef = PRIMITIVE_RECIPES[tag] ? `${tag}()` : 'undefined'
  return `export const ${exportName} = forwardRef<PrimitiveElement<'${tag}'>, PrimitiveProps<'${tag}'>>((props, ref) => <styled.${tag} ref={ref} {...applyBoxPattern(props, ${recipeRef})} />) as React.ForwardRefExoticComponent<PrimitiveProps<'${tag}'> & React.RefAttributes<PrimitiveElement<'${tag}'>>>`
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
