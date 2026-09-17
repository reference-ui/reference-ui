// Unit tests for the Neo react entry generator.
// They take system names plus prop lists and assert the emitted shapes.
// The compile test shells the package tsc over emitted types plus a probe.

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { PRIMITIVE_JSX_NAMES, TAGS } from '../tags.ts'
import { generateReactEntrySource, generateReactTypesSource } from './generate.ts'

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
    factoryPath: '/abs/runtime/factory.ts',
    splitPath: '/abs/runtime/split.ts',
    contextPath: '/abs/runtime/context.ts',
  })
}

describe('generateReactEntrySource', () => {
  it('bakes the layer name plus style props and shares the react-bound css', () => {
    const source = entrySource()
    expect(source).toContain(`const layerName = "neo-prim"`)
    expect(source).toContain(`createPropSplitter(["backgroundColor","color","p"])`)
    expect(source).toContain('split: splitPrimitiveProps, css')
    expect(source).not.toContain('styled/')
    expect(source).toContain(`from 'react'`)
    expect(source).toContain(`from 'react-dom/client'`)
    expect(source).toContain('export { Fragment, createElement, createRoot }')
  })

  it('emits one factory component per tag', () => {
    const source = entrySource()
    expect(source).toContain(
      `export const Div = createPrimitive({ tag: "div", displayName: "Div", layerName, split: splitPrimitiveProps, css })`
    )
    const exported = source.match(/export const \w+ = createPrimitive\(/g) ?? []
    expect(exported.length).toBe(PRIMITIVE_JSX_NAMES.length)
  })

  it('never emits a Box, Flex, or Grid (map rule)', () => {
    const source = entrySource()
    expect(source).not.toMatch(/export const (Box|Flex|Grid)\b/)
  })
})

describe('generateReactTypesSource', () => {
  it('emits the style prop union plus per-tag props', () => {
    const source = generateReactTypesSource({ stylePropNames: NAMES })
    expect(source).toContain(
      'export type StylePropName = "backgroundColor" | "color" | "p"'
    )
    expect(source).toContain('export type DivProps = ')
    expect(source).toContain(`React.ComponentRef<"div">`)
    expect(source).toContain(`export { createRoot } from 'react-dom/client'`)
  })

  it('emits never for an empty prop list so the union still compiles', () => {
    const source = generateReactTypesSource({ stylePropNames: [] })
    expect(source).toContain('export type StylePropName = never')
  })

  it('declares the primitive tag and element types over the full tag set', () => {
    const source = generateReactTypesSource({ stylePropNames: NAMES })
    const tagLine = source.split('\n').find(line => line.startsWith('export type PrimitiveTag = '))
    expect(tagLine).toBeDefined()
    for (const tag of TAGS) {
      expect(tagLine).toContain(JSON.stringify(tag))
    }
    expect(source).toContain('export type PrimitiveElement<T extends PrimitiveTag>')
    expect(source).toContain('caption: HTMLTableCaptionElement')
    expect(source).toContain('menu: HTMLMenuElement')
  })

  it('emits types that compile under strict tsc with a typed probe', () => {
    const dir = join(
      PACKAGE_ROOT,
      'tests',
      '.artifacts',
      `__prim-types-${process.pid}-${Date.now()}`
    )
    mkdirSync(dir, { recursive: true })
    tempDirs.push(dir)
    writeFileSync(join(dir, 'index.d.mts'), generateReactTypesSource({ stylePropNames: NAMES }))
    writeFileSync(
      join(dir, 'probe.ts'),
      [
        `import { createElement } from 'react'`,
        `import { Div, type DivProps, type PrimitiveElement, type PrimitiveTag } from './index.mjs'`,
        '',
        `const props: DivProps = { color: 'brand', id: 'prim' }`,
        'export const el = createElement(Div, props)',
        `const tag: PrimitiveTag = 'div'`,
        `const host: PrimitiveElement<'div'> = null as unknown as HTMLDivElement`,
        `const captionHost: PrimitiveElement<'caption'> = null as unknown as HTMLTableCaptionElement`,
        `const menuHost: PrimitiveElement<'menu'> = null as unknown as HTMLMenuElement`,
        'export const tagCheck = [tag, host, captionHost, menuHost]',
        '',
      ].join('\n')
    )
    const tsc = join(PACKAGE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
    execFileSync(
      process.execPath,
      [
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
        'index.d.mts',
        'probe.ts',
      ],
      { cwd: dir, stdio: 'pipe', timeout: 120000 }
    )
  }, 150000)
})

function readSurface(): string {
  return readFileSync(join(PACKAGE_ROOT, 'src/primitives/generate/react-surface.d.ts'), 'utf8')
}

describe('react surface contract', () => {
  it('declares the same tag set the generator emits', () => {
    const declared = [...readSurface().matchAll(/export declare const (\w+): \(props: \w+Props/g)].map((m) => m[1])
    expect([...declared].sort()).toEqual([...PRIMITIVE_JSX_NAMES].sort())
  })

  it('declares the same primitive tag union the generator emits', () => {
    const line = readSurface()
      .split('\n')
      .find(candidate => candidate.startsWith('export type PrimitiveTag = '))
    expect(line).toBeDefined()
    for (const tag of TAGS) {
      expect(line).toContain(`'${tag}'`)
    }
  })

  it('keeps the shared surface app code touches', () => {
    const surface = readSurface()
    for (const line of [
      'export type StylePropName',
      'export type StyleProps',
      'export type PrimitiveTag',
      'export type PrimitiveElement',
      'export declare const LayerScopeContext',
      'export declare const ColorModeContext',
      'export declare const DocumentContext',
      'export declare function useColorMode',
      `export { Fragment } from 'react'`,
      `export { createElement } from 'react'`,
      `export { createRoot } from 'react-dom/client'`,
    ]) {
      expect(surface).toContain(line)
    }
  })
})
