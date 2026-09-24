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
    primitivesPath: '/abs/primitives.mjs',
  })
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
    expect([...bound].sort()).toEqual([...PRIMITIVE_JSX_NAMES].sort())
  })

  it('never emits a Box, Flex, or Grid (map rule)', () => {
    const source = entrySource()
    expect(source).not.toMatch(/[{,]\s*(Box|Flex|Grid)\b/)
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
    expect(source).not.toMatch(/react-dom|createRoot/)
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
        `const arrayProps: DivProps = { css: [{ color: 'blue.300' }, { backgroundColor: 'green.300' }] }`,
        'export const el = createElement(Div, props)',
        'export const arrayEl = createElement(Div, arrayProps)',
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
    ]) {
      expect(surface).toContain(line)
    }
    expect(surface).not.toMatch(/react-dom|createRoot/)
  })
})
