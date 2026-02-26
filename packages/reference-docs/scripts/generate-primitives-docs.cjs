#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Read the tags from reference-core
const tagsPath = path.join(__dirname, '../../reference-core/src/primitives/tags.ts')
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

// Void elements that cannot have children
const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
 'meta', 'param', 'source', 'track', 'wbr', 
])

// Categorize tags (excluding 'other' - it will be auto-populated)
const manualCategories = {
  structure: [
    'div',
    'span',
    'section',
    'article',
    'aside',
    'header',
    'footer',
    'nav',
    'main',
    'address',
    'figure',
    'figcaption',
    'search',
  ],
  headings: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup'],
  text: [
    'p',
    'strong',
    'em',
    'i',
    'b',
    'small',
    'mark',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'sub',
    'sup',
    's',
    'u',
    'del',
    'ins',
    'abbr',
    'cite',
    'dfn',
    'q',
    'blockquote',
    'time',
  ],
  forms: [
    'form',
    'input',
    'textarea',
    'select',
    'option',
    'button',
    'label',
    'fieldset',
    'legend',
    'datalist',
    'optgroup',
    'output',
    'progress',
    'meter',
  ],
  lists: ['ul', 'ol', 'li', 'dl', 'dt', 'dd'],
  media: [
    'img',
    'picture',
    'audio',
    'video',
    'canvas',
    'svg',
    'iframe',
  ],
  tables: [
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
  ],
  interactive: ['a', 'details', 'summary', 'dialog'],
}

// Build set of all categorized tags
const categorizedTags = new Set()
Object.values(manualCategories).forEach(tags => {
  tags.forEach(tag => categorizedTags.add(tag))
})

// Add any uncategorized tags to 'other'
const otherTags = HTML_TAGS.filter(tag => !categorizedTags.has(tag))

// Final categories object with 'other' populated
const categories = {
  ...manualCategories,
  other: otherTags
}

// Get all unique imports from all categories
const allCategoryTags = Object.values(categories).flat()
const allImports = [...new Set(allCategoryTags)].map(escapeTag).sort()

const outPath = path.join(__dirname, '../src/docs/components/primitives.mdx')

// Generate category sections
function generateCategorySection(categoryName, tags) {
  const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
  const elements = tags.map(tag => {
    const name = escapeTag(tag)
    // Void elements can't have children
    if (voidElements.has(tag)) {
      return `#### ${name}

<div style={{ padding: '1rem', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '1.5rem' }}>
  <${name} />
</div>`
    }
    return `#### ${name}

<${name} style={{ padding: '1rem', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '1.5rem', display: 'block' }}></${name}>`
  }).join('\n\n')
  
  return `### ${displayName}

${elements}

`
}

const content = `---
title: Primitives
section: Components
order: 1
slug: primitives
---

import { ${allImports.join(', ')} } from '@reference-ui/core';

# Primitives

Styled HTML elements that integrate with the Panda CSS system. Each primitive supports the box pattern for responsive styling.

${Object.entries(categories).map(([name, tags]) => generateCategorySection(name, tags)).join('\n')}

## All Primitives (${HTML_TAGS.length})

${HTML_TAGS.map(escapeTag).join(', ')}
`

fs.writeFileSync(outPath, content, 'utf8')
console.log('✅ Generated', outPath)
console.log(`📊 Total primitives: ${HTML_TAGS.length}`)
console.log(`📦 Categories: ${Object.keys(categories).length}`)
