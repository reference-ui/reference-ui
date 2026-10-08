/**
 * Golden suite for the primitives generator (E1 vocabulary.json + E2 primitives.mjs
 * + E4 primitives.d.ts). Rebuilds all three artifacts in memory and pins the committed
 * bytes, the 101-element HTML roster, the bound-roster seam, and the style-prop parity
 * with the live napi and typegen goldens. Refreshes only via the generator itself —
 * hand edits to generated/ fail here.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as roster from '../generated/primitives.mjs'
import { buildArtifacts } from '../generate/generate.js'
import { primitivesVocabulary } from '../../typegen/js/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const generatedDir = resolve(here, '../generated')

interface VocabularyDocument {
  version: number
  elements: Array<{ dom: string; jsx: string; family: string }>
  stylePropNames: string[]
  conditions: string[]
  conditionRule: string
  aliases: Record<string, string>
  reserved: string[]
  elementOverrides: Record<string, string>
}

function readCommitted(name: string): string {
  return readFileSync(resolve(generatedDir, name), 'utf8')
}

function readVocabulary(): VocabularyDocument {
  return JSON.parse(readCommitted('vocabulary.json')) as VocabularyDocument
}

function goldenStylePropKeys(): string[] {
  const golden = readFileSync(
    resolve(here, '../../typegen/tests/goldens/styles.d.ts'),
    'utf8'
  )
  const lines = golden.split('\n')
  const head = lines.findIndex(line => line === 'export type StyleProps = FontProps & {')
  const keys: string[] = []
  for (const line of lines.slice(head + 1)) {
    if (line === '};') break
    const match = /^  (\S+?)\?: StylePropValue/.exec(line)
    if (!match || match[1].startsWith('[K in')) continue
    keys.push(match[1].replace(/^'|'$/g, ''))
  }
  return keys.sort()
}

const FAMILIES = [
  'html-flow',
  'html-text',
  'html-form',
  'html-table',
  'html-media',
  'html-interactive',
  'special',
]

describe('primitives generator goldens', () => {
  it('PRIMGEN-01 rebuilds byte-identical E1, E2, and E4 from live sources', () => {
    const fresh = buildArtifacts()

    expect(fresh.vocabularyJson).toBe(readCommitted('vocabulary.json'))
    expect(fresh.primitivesMjs).toBe(readCommitted('primitives.mjs'))
    expect(fresh.primitivesDts).toBe(readCommitted('primitives.d.ts'))
  })

  it('PRIMGEN-02 vocabulary carries exactly the 101 HTML elements', () => {
    const vocabulary = readVocabulary()

    expect(vocabulary.version).toBe(1)
    expect(vocabulary.elements).toHaveLength(101)
    const jsx = vocabulary.elements.map(row => row.jsx)
    expect([...jsx].sort()).toEqual(jsx)
    expect(new Set(jsx).size).toBe(101)
    for (const row of vocabulary.elements) {
      expect(row.dom).toBe(row.dom.toLowerCase())
      expect(FAMILIES).toContain(row.family)
    }
    expect(jsx).not.toContain('Box')
    expect(jsx).not.toContain('Flex')
    expect(jsx).not.toContain('Grid')
    expect(jsx).toContain('Map')
    expect(jsx).toContain('Obj')
    expect(jsx).toContain('Var')
    expect(vocabulary).not.toHaveProperty('deferred')
  })

  it('PRIMGEN-03 style props equal the live napi set and the typegen golden keys', () => {
    const vocabulary = readVocabulary()

    expect(vocabulary.stylePropNames).toEqual(primitivesVocabulary().props)
    expect(vocabulary.stylePropNames).toEqual(goldenStylePropKeys())
    expect(vocabulary.aliases['bg']).toBe('background')
    expect(vocabulary.aliases['mt']).toBe('marginTop')
    expect(vocabulary.aliases['p']).toBe('padding')
    expect(vocabulary.conditions.every(key => !key.startsWith('@'))).toBe(true)
    expect(vocabulary.reserved).toEqual([
      'className',
      'children',
      'colorMode',
      'variant',
      'css',
      'ref',
    ])
    expect(vocabulary.elementOverrides).toEqual({
      caption: 'HTMLTableCaptionElement',
      menu: 'HTMLMenuElement',
    })
  })

  it('PRIMGEN-04 raw types carry the exact surface with no forbidden members', () => {
    const dts = readCommitted('primitives.d.ts')

    expect(dts).toContain('export type PrimitiveTag = ')
    expect(dts).toContain('export type StylePropName = ')
    expect(dts).toContain('export type PrimitiveProps<T extends PrimitiveTag>')
    expect(dts).toContain('export type PrimitiveElement<T extends PrimitiveTag>')
    expect(dts).toContain('export declare function useColorMode(): string | undefined')
    expect(dts.match(/export declare const \w+: \(props: /g)).toHaveLength(101)
    expect(dts).not.toMatch(/\b(Box|Flex|Grid)\b/)
    expect(dts).not.toMatch(/^\s*as\?:/m)
    expect(dts).not.toContain('styled.')
    expect(dts).not.toContain('styled(')
    expect(dts).not.toContain('jsx(')
    expect(dts).not.toMatch(/\bslot\b/i)
    expect(dts).not.toContain('rounded')
    expect(dts).not.toMatch(/"c_[0-9a-z]{5,}"/)
    expect(dts).not.toMatch(/pandacss/i)
  })

  it('PRIMGEN-05 bound-roster module carries 101 exports plus the configure seam', () => {
    const vocabulary = readVocabulary()
    const names = new Set(Object.keys(roster))
    const seam = [
      'configurePrimitives',
      'Fragment',
      'createElement',
      'LayerScopeContext',
      'ColorModeContext',
      'DocumentContext',
      'useColorMode',
    ]

    expect(names.size).toBe(101 + seam.length)
    for (const row of vocabulary.elements) expect(names.has(row.jsx)).toBe(true)
    for (const name of seam) expect(names.has(name)).toBe(true)
    expect(roster.Div.displayName).toBe('Div')
    expect(roster.Map.displayName).toBe('Map')

    const bound = roster.configurePrimitives({
      layerName: 'test-layer',
      stylePropNames: ['color'],
      css: () => 'mock-class',
    })
    expect(Object.keys(bound)).toHaveLength(101)
    const html = renderToStaticMarkup(
      createElement(bound.Div, { color: 'brand', className: 'extra', children: 'prim' })
    )
    expect(html).toContain('class="ref-div mock-class extra"')
    expect(html).toContain('data-layer="test-layer"')

    expect(() => renderToStaticMarkup(createElement(roster.Div, {}))).toThrow(
      /configurePrimitives/
    )
  })
})
