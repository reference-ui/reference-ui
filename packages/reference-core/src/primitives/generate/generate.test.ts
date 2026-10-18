// Unit tests for the Neo react entry generator.
// They take system names plus prop lists and assert the emitted shapes.
// The compile test shells the package tsc over emitted types plus a probe
// and a styled stub, since the bound bake imports the styled graph.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { ELEMENT_DOM_TAGS, ELEMENT_JSX_NAMES } from '../../native/element-vocabulary.ts'
import { generateReactEntrySource, generateReactTypesSource, recipeVariantTypeNames } from './generate.ts'

const PACKAGE_ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const NAMES = ['backgroundColor', 'color', 'p']

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function entrySource(): string {
  return generateReactEntrySource({
    systemName: 'neo-prim',
    stylePropNames: NAMES,
    primitivesPath: '/abs/primitives.mjs',
  })
}

function typesSource(recipes: Record<string, unknown> = {}): string {
  return generateReactTypesSource({ stylePropNames: NAMES, recipes })
}

describe('generateReactEntrySource', () => {
  it('binds the live roster with the layer name plus style props over the shared css', () => {
    const source = entrySource()
    expect(source).toContain(
      `import { configurePrimitives, ColorModeContext, DocumentContext, Fragment, LayerScopeContext, createElement, useColorMode } from "/abs/primitives.mjs"`
    )
    expect(source).toContain(
      `configurePrimitives({ layerName: "neo-prim", stylePropNames: ["backgroundColor","color","p"], css })`
    )
    expect(source).toContain(
      'export { ColorModeContext, DocumentContext, Fragment, LayerScopeContext, createElement, useColorMode }'
    )
    expect(source).not.toContain('styled/')
    expect(source).not.toMatch(/createPrimitive\(|createPropSplitter\(/)
    expect(source).not.toMatch(/react-dom|createRoot/)
  })

  it('destructures one bound component per tag', () => {
    const source = entrySource()
    const line = source.split('\n').find(candidate => candidate.startsWith('export const { '))
    expect(line).toBeDefined()
    if (line === undefined) throw new Error('entry carries no bound destructure')
    expect(line).toContain(' Div, ')
    const bound = line.slice('export const { '.length, line.indexOf(' } =')).split(', ')
    expect([...bound].sort()).toEqual([...ELEMENT_JSX_NAMES].sort())
  })

  it('never emits a Box, Flex, or Grid (map rule)', () => {
    const source = entrySource()
    expect(source).not.toMatch(/[{,]\s*(Box|Flex|Grid)\b/)
  })
})

describe('recipeVariantTypeNames', () => {
  it('stems recipe names to typegen alias names', () => {
    expect(
      recipeVariantTypeNames({
        button: { variants: { tone: { accent: {}, muted: {} }, size: { sm: {}, lg: {} } } },
      })
    ).toEqual(['ButtonVariantProps'])
  })

  it('skips recipes typegen would not print an alias for', () => {
    expect(
      recipeVariantTypeNames({
        plain: { base: { display: 'block' } },
        empty: { variants: { tone: {} } },
        broken: 42,
        '9lives': { variants: { tone: { loud: {} } } },
      })
    ).toEqual([])
  })

  it('sorts and deduplicates pascal collisions', () => {
    expect(
      recipeVariantTypeNames({
        zebra: { variants: { tone: { loud: {} } } },
        apple: { variants: { tone: { quiet: {} } } },
        'my-card': { variants: { tone: { loud: {} } } },
        myCard: { variants: { tone: { quiet: {} } } },
      })
    ).toEqual(['AppleVariantProps', 'MyCardVariantProps', 'ZebraVariantProps'])
  })
})

describe('generateReactTypesSource', () => {
  it('emits the style prop union plus per-tag props', () => {
    const source = typesSource()
    expect(source).toContain(
      'export type StylePropName = "backgroundColor" | "color" | "p"'
    )
    expect(source).toContain('export type DivProps = ')
    expect(source).toContain(`React.ComponentRef<"div">`)
    expect(source).not.toMatch(/react-dom|createRoot/)
  })

  it('emits never for an empty prop list so the union still compiles', () => {
    const source = generateReactTypesSource({ stylePropNames: [], recipes: {} })
    expect(source).toContain('export type StylePropName = never')
  })

  it('declares the primitive tag and element types over the full tag set', () => {
    const source = typesSource()
    const tagLine = source.split('\n').find(line => line.startsWith('export type PrimitiveTag = '))
    expect(tagLine).toBeDefined()
    for (const tag of ELEMENT_DOM_TAGS) {
      expect(tagLine).toContain(JSON.stringify(tag))
    }
    expect(source).toContain('export type PrimitiveElement<T extends PrimitiveTag>')
    expect(source).toContain('caption: HTMLTableCaptionElement')
    expect(source).toContain('menu: HTMLMenuElement')
  })
})

describe('generateReactTypesSource bound bake', () => {
  it('carries the styled wiring plus the named graph with no later rewrite', () => {
    const source = typesSource()
    for (const line of [
      `import type { StyleConditionKey, StyleProps as NarrowStyleProps, SystemStyleObject } from '@reference-ui/styled'`,
      `export type StyleProps = Omit<NarrowStyleProps, 'font' | 'weight'> & {`,
      `export type * from '@reference-ui/styled'`,
      'export type CssStyles = ',
      'export type PrimitiveProps<',
      'export declare function css(',
      'export interface RecipeConfig {',
      'export type RecipeVariantProps<',
      'export interface RecipeRuntimeFn<',
      'export declare function recipe<',
    ]) {
      expect(source).toContain(line)
    }
  })

  it('narrows css with the array arm dropped and font scopes collapsed', () => {
    const source = typesSource()
    expect(source).toContain(
      `export type PrimitiveCssProp = Omit<SystemStyleObject, 'font' | 'weight'> & { font?: unknown; weight?: unknown }`
    )
    expect(source).toContain('export type DivProps = ')
    const divLine = source.split('\n').find(line => line.startsWith('export type DivProps = '))
    expect(divLine).toContain('css?: PrimitiveCssProp')
  })

  it('types the variant alias as never with no recipes while per-tag variant stays open', () => {
    const source = typesSource()
    expect(source).toContain('export type PrimitiveVariantProp = never')
    const divLine = source.split('\n').find(line => line.startsWith('export type DivProps = '))
    expect(divLine).toContain('variant?: unknown')
    expect(source).not.toContain('VariantProps } from')
  })

  it('unions the typegen recipe aliases with recipes', () => {
    const source = typesSource({
      button: { variants: { tone: { accent: {}, muted: {} } } },
      badge: { variants: { tone: { loud: {} } } },
    })
    expect(source).toContain(
      `import type { StyleConditionKey, StyleProps as NarrowStyleProps, SystemStyleObject, BadgeVariantProps, ButtonVariantProps } from '@reference-ui/styled'`
    )
    expect(source).toContain(
      'export type PrimitiveVariantProp = BadgeVariantProps | ButtonVariantProps'
    )
  })

  it('reuses the E4 PrimitiveProps text verbatim', () => {
    const shelf = readFileSync(
      join(PACKAGE_ROOT, 'src', 'native', 'generated', 'primitives', 'primitives.d.ts'),
      'utf-8'
    )
    expect(primitivePropsBlock(typesSource())).toBe(primitivePropsBlock(shelf))
  })
})

describe('generateReactTypesSource tsc probe', () => {
  it('emits types that compile under strict tsc with a typed probe', () => {
    const dir = join(
      PACKAGE_ROOT,
      'tests',
      '.artifacts',
      `__prim-types-${process.pid}-${Date.now()}`
    )
    mkdirSync(dir, { recursive: true })
    tempDirs.push(dir)
    writeFileSync(join(dir, 'index.d.mts'), typesSource())
    writeStyledStub(dir)
    writeTscProbe(dir)
    execFileSync(process.execPath, strictTscArgs(['index.d.mts', 'probe.ts']), {
      cwd: dir,
      stdio: 'pipe',
      timeout: 120000,
    })
  }, 150000)

  it('rejects array css at the narrowed position (red by design)', () => {
    const dir = join(
      PACKAGE_ROOT,
      'tests',
      '.artifacts',
      `__prim-types-array-${process.pid}-${Date.now()}`
    )
    mkdirSync(dir, { recursive: true })
    tempDirs.push(dir)
    writeFileSync(join(dir, 'index.d.mts'), typesSource())
    writeStyledStub(dir)
    writeArrayProbe(dir)
    let failure = ''
    try {
      execFileSync(process.execPath, strictTscArgs(['index.d.mts', 'probe-array.ts']), {
        cwd: dir,
        stdio: 'pipe',
        timeout: 120000,
      })
    } catch (error) {
      const output = error as { stdout?: unknown; stderr?: unknown }
      failure = `${String(output.stdout ?? '')}${String(output.stderr ?? '')}`
    }
    expect(failure).toContain('TS2559')
  }, 150000)
})

function strictTscArgs(files: string[]): string[] {
  const tsc = join(PACKAGE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
  return [
    tsc,
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--skipLibCheck',
    '--target',
    'ES2022',
    '--lib',
    'ES2022,DOM',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    ...files,
  ]
}

function writeStyledStub(dir: string): void {
  const styledDir = join(dir, 'node_modules', '@reference-ui', 'styled')
  mkdirSync(styledDir, { recursive: true })
  writeFileSync(
    join(styledDir, 'package.json'),
    JSON.stringify({ name: '@reference-ui/styled', version: '0.0.0', types: './index.d.ts' })
  )
  writeFileSync(
    join(styledDir, 'index.d.ts'),
    [
      `export type StyleConditionKey = '_hover' | '@sm'`,
      `export type StyleProps = {`,
      `  color?: unknown`,
      `  backgroundColor?: unknown`,
      `  p?: unknown`,
      `}`,
      `export type SystemStyleObject = StyleProps & {`,
      `  [K in StyleConditionKey]?: SystemStyleObject`,
      `}`,
      '',
    ].join('\n')
  )
}

function writeTscProbe(dir: string): void {
  writeFileSync(
    join(dir, 'probe.ts'),
    [
      `import { createElement } from 'react'`,
      `import { Div, type DivProps, type PrimitiveElement, type PrimitiveTag } from './index.mjs'`,
      '',
      `const props: DivProps = { color: 'brand', id: 'prim' }`,
      `const cssProps: DivProps = { css: { color: 'blue.300', backgroundColor: 'green.300' } }`,
      'export const el = createElement(Div, props)',
      'export const cssEl = createElement(Div, cssProps)',
      `const tag: PrimitiveTag = 'div'`,
      `const host: PrimitiveElement<'div'> = null as unknown as HTMLDivElement`,
      `const captionHost: PrimitiveElement<'caption'> = null as unknown as HTMLTableCaptionElement`,
      `const menuHost: PrimitiveElement<'menu'> = null as unknown as HTMLMenuElement`,
      'export const tagCheck = [tag, host, captionHost, menuHost]',
      '',
    ].join('\n')
  )
}

function writeArrayProbe(dir: string): void {
  writeFileSync(
    join(dir, 'probe-array.ts'),
    [
      `import { createElement } from 'react'`,
      `import { Div, type DivProps } from './index.mjs'`,
      '',
      `const arrayProps: DivProps = { css: [{ color: 'blue.300' }, { backgroundColor: 'green.300' }] }`,
      'export const arrayEl = createElement(Div, arrayProps)',
      '',
    ].join('\n')
  )
}

function primitivePropsBlock(dts: string): string {
  const start = dts.indexOf('/** Shared prop shape every primitive accepts')
  if (start === -1) throw new Error('PrimitiveProps block missing its doc comment')
  const end = dts.indexOf('\n}\n', start)
  if (end === -1) throw new Error('PrimitiveProps block missing its closing brace')
  return dts.slice(start, end + 3)
}


