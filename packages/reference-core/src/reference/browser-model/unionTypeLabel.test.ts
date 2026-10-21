// Union label cases: they compile vendored union-label fixtures and assert the API table's unions.
// The public tasty build runs the fixtures; the model decides the labels, so the cases pin them
// without rendering React. The last block drives the browser reference runtime over a
// diamond compiled in a temporary project: a root whose projection ran out of steps
// carries the budget warning on its document, and a complete one carries none.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyApi, TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { createReferenceDocument } from './document.ts'
import { createReferenceRuntime } from '../browser/Runtime.ts'

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '__fixtures__',
  'union-labels',
)

let api: TastyApi
let outputDir: string

beforeAll(async () => {
  outputDir = mkdtempSync(join(tmpdir(), 'core-union-labels-'))
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

const DIAMOND_DEPTH = 16

function diamondSource(depth: number): string {
  let source = 'export interface I0a { a0: 1 }\nexport interface I0b { b0: 1 }\n'
  for (let level = 1; level <= depth; level++) {
    source += `export interface I${level}a extends I${level - 1}a, I${level - 1}b { a${level}: 1 }\n`
    source += `export interface I${level}b extends I${level - 1}a, I${level - 1}b { b${level}: 1 }\n`
  }
  return source
}

describe('reference runtime projection warnings', () => {
  let diamondDir: string
  let diamondApi: TastyApi

  beforeAll(async () => {
    diamondDir = mkdtempSync(join(tmpdir(), 'core-projection-budget-'))
    mkdirSync(join(diamondDir, 'src'))
    writeFileSync(join(diamondDir, 'src', 'a.ts'), diamondSource(DIAMOND_DEPTH))
    const built = await buildTasty({
      rootDir: diamondDir,
      include: ['src/**/*.ts'],
      outputDir: join(diamondDir, 'artifacts'),
    })
    diamondApi = built.api
  }, 60000)

  afterAll(() => {
    rmSync(diamondDir, { recursive: true, force: true })
  })

  function runtimeOver(api: TastyApi) {
    return createReferenceRuntime({ loadApi: async () => api } as unknown as TastyBrowserRuntime)
  }

  it('attaches the budget warning to the document when the root projection ran out of steps', async () => {
    const data = await runtimeOver(diamondApi).load(`I${DIAMOND_DEPTH}a`)

    expect(data.warnings).toEqual([expect.objectContaining({ code: 'TST-W-PROJECTION-BUDGET' })])
    expect(data.warnings[0]?.message).toContain(`"I${DIAMOND_DEPTH}a"`)
  })

  it('attaches no warning when every projection of the document completed', async () => {
    const data = await runtimeOver(diamondApi).load('I1a')

    expect(data.warnings).toEqual([])
  })
})
