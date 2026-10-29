// Primitive extras case: it compiles a props alias built on `PrimitiveProps<'div'>` from a vendored
// `@reference-ui/primrt` runtime copy whose three extras are the generator's own lines. It asserts that
// the rendered member list shows css, colorMode and variant under PrimitiveProps, each with a type
// name and a description, and variant as the named PrimitiveVariant, never `unknown`.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { PRIMITIVE_EXTRAS, PRIMITIVE_VARIANT_LINES } from '../../primitives/generate/primitive-props.ts'
import { createReferenceDocument } from './document.ts'
import { createReferenceRuntime } from '../browser/Runtime.ts'
import type { ReferenceDocument, ReferenceMemberDocument } from '../browser/types.ts'

const RUNTIME_COPY = [
  "export type StylePropName = 'color'",
  'export type StyleProps = { color?: string }',
  'export type PrimitiveCssProp = Record<string, unknown>',
  ...PRIMITIVE_VARIANT_LINES,
  "export type PrimitiveTag = 'div'",
  'export type PrimitiveProps<T extends PrimitiveTag> = Omit<',
  '  { id?: string },',
  "  StylePropName | 'css' | 'colorMode' | 'variant'",
  '> & StyleProps & {',
  ...PRIMITIVE_EXTRAS,
  '}',
  '',
].join('\n')

const PROPS_SOURCE = [
  "import type { PrimitiveProps } from '@reference-ui/primrt'",
  '',
  '/** Props of a panel: the div props plus `open`. */',
  "export type PanelProps = PrimitiveProps<'div'> & {",
  '  /** Whether the panel is showing. */',
  '  open?: boolean',
  '}',
  '',
].join('\n')

let rootDir: string
let outputDir: string
let doc: ReferenceDocument

beforeAll(async () => {
  rootDir = mkdtempSync(join(tmpdir(), 'core-primitive-extras-src-'))
  outputDir = mkdtempSync(join(tmpdir(), 'core-primitive-extras-out-'))
  const runtimeDir = join(rootDir, 'node_modules', '@reference-ui', 'primrt')
  mkdirSync(runtimeDir, { recursive: true })
  mkdirSync(join(rootDir, 'src'), { recursive: true })
  writeFileSync(
    join(runtimeDir, 'package.json'),
    '{ "name": "@reference-ui/primrt", "version": "1.0.0", "types": "index.d.ts" }',
  )
  writeFileSync(join(runtimeDir, 'index.d.ts'), RUNTIME_COPY)
  writeFileSync(join(rootDir, 'src', 'props.ts'), PROPS_SOURCE)
  const built = await buildTasty({ rootDir, include: ['src/**/*.ts'], outputDir })
  const runtime = createReferenceRuntime({ loadApi: async () => built.api } as unknown as TastyBrowserRuntime)
  const data = await runtime.load('PanelProps')
  doc = createReferenceDocument(data.symbol, data.members, {
    extendsChain: data.extendsChain,
    memberOrigins: data.memberOrigins,
    relatedSymbols: data.relatedSymbols,
    warnings: data.warnings,
  })
}, 60000)

afterAll(() => {
  rmSync(rootDir, { recursive: true, force: true })
  rmSync(outputDir, { recursive: true, force: true })
})

function member(name: string): ReferenceMemberDocument {
  const found = doc.members.find((candidate) => candidate.name === name)
  if (found === undefined) throw new Error(`member ${name} missing from ${doc.members.map((m) => m.name).join(', ')}`)
  return found
}

function description(row: ReferenceMemberDocument): string | undefined {
  return row.summary.description ?? row.jsDoc?.summary
}

describe('primitive extras', () => {
  it('lists css, colorMode and variant inherited from PrimitiveProps beside the own member', () => {
    expect(doc.members.map((row) => row.name)).toEqual(expect.arrayContaining(['colorMode', 'css', 'open', 'variant']))
    expect(member('open').inheritedFrom).toBeUndefined()
    for (const name of ['css', 'colorMode', 'variant']) {
      expect(member(name).inheritedFrom?.name).toBe('PrimitiveProps')
    }
  })

  it('shows variant as the named PrimitiveVariant with its description, never unknown', () => {
    const variant = member('variant')
    expect(variant.typeLabel).toBe('PrimitiveVariant')
    expect(description(variant)).toBe('Sets `data-variant` on the element, for `globalCss()` rules that select on it.')
  })

  it('gives css and colorMode a description each', () => {
    expect(member('css').typeLabel).toBe('PrimitiveCssProp')
    expect(description(member('css'))).toContain('Style object for this element')
    expect(description(member('colorMode'))).toContain('Sets the color mode for this element')
  })

  it('leaves no extra undocumented or unknown', () => {
    for (const name of ['css', 'colorMode', 'variant']) {
      expect(member(name).typeLabel).not.toBe('unknown')
      expect(description(member(name))).toBeTruthy()
    }
  })
})
