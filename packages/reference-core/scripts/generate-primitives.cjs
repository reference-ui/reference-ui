#!/usr/bin/env node
/**
 * Generates src/primitives/index.tsx with explicit primitive components.
 * Each primitive = styled[tag] composed with box pattern (r, container, font, weight).
 * Applies recipes where they exist (h1, p, code, etc.).
 */

const fs = require('fs')
const path = require('path')

// Read and parse tags from tags.ts
const tagsPath = path.join(__dirname, '../src/primitives/tags.ts')
const tagsContent = fs.readFileSync(tagsPath, 'utf8')
const match = tagsContent.match(/\[([\s\S]*?)\]\s+as const/)
if (!match) throw new Error('Could not parse TAGS from tags.ts')
const HTML_TAGS = match[1]
  .split(',')
  .map(s => s.replace(/['"]/g, '').trim())
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

// Map tag names to recipe export names from src/system/recipes/
const TAG_TO_RECIPE = {
  h1: 'h1Style',
  h2: 'h2Style',
  h3: 'h3Style',
  h4: 'h4Style',
  h5: 'h5Style',
  h6: 'h6Style',
  p: 'pStyle',
  strong: 'strongStyle',
  em: 'emStyle',
  b: 'bStyle',
  i: 'iStyle',
  u: 'uStyle',
  s: 'sStyle',
  small: 'smallStyle',
  mark: 'markStyle',
  sub: 'subStyle',
  sup: 'supStyle',
  abbr: 'abbrStyle',
  code: 'codeStyle',
  pre: 'preStyle',
  kbd: 'kbdStyle',
  samp: 'sampStyle',
  var: 'varStyle',
  blockquote: 'blockquoteStyle',
  q: 'qStyle',
  cite: 'citeStyle',
}

const recipesUsed = new Set()
HTML_TAGS.forEach(tag => {
  if (TAG_TO_RECIPE[tag]) {
    recipesUsed.add(TAG_TO_RECIPE[tag])
  }
})

const recipeImports = Array.from(recipesUsed).sort().join(', ')

const outDir = path.join(__dirname, '../src/primitives')
const outPath = path.join(outDir, 'index.tsx')

const header = `/** Generated. Run: node scripts/generate-primitives.cjs
 * styled[tag] + box pattern (r, container, font, weight) + recipes where available.
 */

import * as React from 'react'
import { forwardRef } from 'react'
// @ts-expect-error - Panda codegen helpers.js has no declaration file
import { splitProps } from '../system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
${recipeImports ? `import { ${recipeImports} } from '../system/recipes/index.js'` : ''}
import type { PrimitiveElement, PrimitiveProps } from './types'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags'
export type { PrimitiveElement, PrimitiveProps } from './types'

const BOX_KEYS = ['font', 'weight', 'container', 'r'] as const
const splitBoxProps = <T extends Record<string, unknown>>(props: T) => splitProps(props, BOX_KEYS)

`

function genPrimitive(tag, exportName) {
  const styledVar = `Styled${exportName}`
  const recipe = TAG_TO_RECIPE[tag]

  // All primitives use styled[tag]
  const styledCall = `styled['${tag}']`

  // If recipe exists, merge its className into props
  if (recipe) {
    return `const ${styledVar} = ${styledCall}; export const ${exportName} = forwardRef<PrimitiveElement<'${tag}'>, PrimitiveProps<'${tag}'>>(({ className, ...props }, ref) => { const [p, r] = splitBoxProps(props); const recipeClass = ${recipe}(); return <${styledVar} ref={ref} className={recipeClass + (className ? ' ' + className : '')} {...(box.raw(p) as object)} {...(r as object)} /> })`
  } else {
    return `const ${styledVar} = ${styledCall}; export const ${exportName} = forwardRef((props, ref) => { const [p, r] = splitBoxProps(props); return <${styledVar} ref={ref} {...(box.raw(p) as object)} {...(r as object)} /> }) as React.ForwardRefExoticComponent<PrimitiveProps<'${tag}'> & React.RefAttributes<PrimitiveElement<'${tag}'>>>`
  }
}

const lines = [header]
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(genPrimitive(tag, exportName))
}

lines.push('')
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(`export type ${exportName}Props = PrimitiveProps<'${tag}'>`)
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Generated', outPath)
