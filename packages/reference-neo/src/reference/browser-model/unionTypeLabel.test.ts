// Union label cases: they compile the vendored union-label fixtures with the
// public tasty build and assert the API table's union type lines (`Union`,
// widenings) plus literal value-set chips. Neo port of the core union
// display-label suite; the model decides the labels, so the cases pin them
// without rendering React.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyApi } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { createReferenceDocument } from './document.ts'

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '__fixtures__',
  'union-labels',
)

let api: TastyApi
let outputDir: string

beforeAll(async () => {
  outputDir = mkdtempSync(join(tmpdir(), 'neo-union-labels-'))
  const built = await buildTasty({ rootDir: fixtureDir, include: ['**/*.ts'], outputDir })
  api = built.api
}, 60000)

afterAll(() => {
  rmSync(outputDir, { recursive: true, force: true })
})

describe('union display type label', () => {
  it('uses Union for pure inline literal unions and keeps named alias names', async () => {
    const [buttonProps, buttonPropsNamedSize] = await Promise.all([
      api.loadSymbolByName('ButtonProps'),
      api.loadSymbolByName('ButtonPropsNamedSize'),
    ])

    const buttonMembers = await api.graph.getDisplayMembers(buttonProps)
    const namedMembers = await api.graph.getDisplayMembers(buttonPropsNamedSize)

    const buttonDoc = createReferenceDocument(buttonProps, buttonMembers)
    const namedDoc = createReferenceDocument(buttonPropsNamedSize, namedMembers)

    expect(buttonDoc.members.find((m) => m.name === 'size')?.typeLabel).toBe('Union')
    expect(namedDoc.members.find((m) => m.name === 'size')?.typeLabel).toBe('NamedButtonSize')
  })

  it('uses Union | string for literal ∪ string and lists literal chips only', async () => {
    const themeColorProp = await api.loadSymbolByName('ThemeColorProp')
    const themeMembers = await api.graph.getDisplayMembers(themeColorProp)
    const themeDoc = createReferenceDocument(themeColorProp, themeMembers)

    const colorMember = themeDoc.members.find((m) => m.name === 'color')
    expect(colorMember?.typeLabel).toBe('Union | string')
    expect(colorMember?.summary.memberTypeSummary?.kind).toBe('valueSet')
    if (colorMember?.summary.memberTypeSummary?.kind === 'valueSet') {
      expect(colorMember.summary.memberTypeSummary.options.map((o) => o.label)).toEqual([
        'default',
        'primary',
        'secondary',
      ])
    }
  })

  it('uses Union | object for literal ∪ object', async () => {
    const slotOrObject = await api.loadSymbolByName('SlotOrObjectProp')
    const members = await api.graph.getDisplayMembers(slotOrObject)
    const doc = createReferenceDocument(slotOrObject, members)

    const slotMember = doc.members.find((m) => m.name === 'slot')
    expect(slotMember?.typeLabel).toBe('Union | object')
    expect(slotMember?.summary.memberTypeSummary?.kind).toBe('valueSet')
    if (slotMember?.summary.memberTypeSummary?.kind === 'valueSet') {
      expect(slotMember.summary.memberTypeSummary.options.map((o) => o.label)).toEqual(['header', 'footer'])
    }
  })

  it('uses Union | string | object when both widenings are present', async () => {
    const combo = await api.loadSymbolByName('WideningComboProp')
    const members = await api.graph.getDisplayMembers(combo)
    const doc = createReferenceDocument(combo, members)

    const modeMember = doc.members.find((m) => m.name === 'mode')
    expect(modeMember?.typeLabel).toBe('Union | string | object')
    expect(modeMember?.summary.memberTypeSummary?.kind).toBe('valueSet')
    if (modeMember?.summary.memberTypeSummary?.kind === 'valueSet') {
      expect(modeMember.summary.memberTypeSummary.options.map((o) => o.label)).toEqual(['a', 'b'])
    }
  })
})
