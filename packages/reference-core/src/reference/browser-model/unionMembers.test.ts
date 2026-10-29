// Union member cases: they compile vendored picker unions and assert the merged member list the
// API table shows when every branch of a union alias is an object type. The browser reference
// runtime loads each alias, so the cases pin what the renderer receives without rendering React.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { createReferenceDocument } from './document.ts'
import { formatReferenceType } from './type.ts'
import { createReferenceRuntime } from '../browser/Runtime.ts'
import type { ReferenceDocument, ReferenceMemberDocument } from '../browser/types.ts'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'union-members')

let outputDir: string
let load: (name: string) => Promise<ReferenceDocument>

beforeAll(async () => {
  outputDir = mkdtempSync(join(tmpdir(), 'core-union-members-'))
  const built = await buildTasty({ rootDir: fixtureDir, include: ['**/*.ts'], outputDir })
  const runtime = createReferenceRuntime({ loadApi: async () => built.api } as unknown as TastyBrowserRuntime)
  load = async (name) => {
    const data = await runtime.load(name)
    return createReferenceDocument(data.symbol, data.members, {
      extendsChain: data.extendsChain,
      memberOrigins: data.memberOrigins,
      relatedSymbols: data.relatedSymbols,
      warnings: data.warnings,
    })
  }
}, 60000)

afterAll(() => {
  rmSync(outputDir, { recursive: true, force: true })
})

function member(doc: ReferenceDocument, name: string): ReferenceMemberDocument {
  const found = doc.members.find((m) => m.name === name)
  if (!found) throw new Error(`no member ${name} in ${doc.name}`)
  return found
}

function valueOptions(m: ReferenceMemberDocument): string[] {
  const summary = m.summary.memberTypeSummary
  return summary?.kind === 'valueSet' ? summary.options.map((o) => o.label) : []
}

describe('discriminated union of object branches', () => {
  it('lists each member once, in first-seen order', async () => {
    const doc = await load('PickerProps')
    expect(doc.members.map((m) => m.name)).toEqual(['label', 'size', 'mode', 'value', 'onPick', 'onChange'])
  })

  it('turns a literal discriminant into a value set with its default', async () => {
    const mode = member(await load('PickerProps'), 'mode')
    expect(mode.typeLabel).toBe('Union')
    expect(valueOptions(mode)).toEqual(['day', 'range'])
    expect(mode.defaultValue).toBe('day')
    expect(mode.summary.memberTypeSummary).toMatchObject({
      kind: 'valueSet',
      options: expect.arrayContaining([{ label: 'day', isDefault: true }]),
    })
  })

  it('unions the differing branch types, deduplicated', async () => {
    const doc = await load('PickerProps')
    expect(member(doc, 'value').type?.kind).toBe('union')
    expect(member(doc, 'value').typeLabel).toContain('string | null')
    expect(member(doc, 'value').typeLabel).toContain('{ start: string; end: string }')
    expect(member(doc, 'label').typeLabel).toBe('string')
    expect(member(doc, 'size').typeLabel).toBe('Union')
  })

  it('shows a member missing from some branches as optional, and keeps required ones required', async () => {
    const doc = await load('PickerProps')
    expect(member(doc, 'onPick').optional).toBe(true)
    expect(member(doc, 'label').optional).toBe(false)
    expect(member(doc, 'value').optional).toBe(false)
  })

  it('takes JSDoc from the first branch that has it', async () => {
    const doc = await load('PickerProps')
    expect(member(doc, 'label').jsDoc.summary).toBe('Visible label.')
    expect(member(doc, 'onPick').jsDoc.summary).toBe('Called with the picked day.')
    expect(member(doc, 'onChange').jsDoc.summary).toBeUndefined()
    expect(member(doc, 'mode').jsDoc.summary).toBe('What a selection picks.')
  })

  it('lists function branch types as value options and parenthesizes them in the printed union', async () => {
    const onSelect = member(await load('MixedFunctions'), 'onSelect')
    expect(onSelect.type && formatReferenceType(onSelect.type)).toBe(
      '((value: string) => void) | ((value: number) => void)',
    )
    expect(valueOptions(onSelect)).toHaveLength(2)
  })
})

describe('union branches written inline', () => {
  it('keeps inherited-from grouping for members every branch gets from the same interface', async () => {
    const doc = await load('InlinePickerProps')
    expect(doc.members.map((m) => m.name)).toEqual(['label', 'size', 'kind', 'text', 'icon'])
    expect(member(doc, 'label').inheritedFrom?.name).toBe('PickerShared')
    expect(member(doc, 'size').inheritedFrom?.name).toBe('PickerShared')
    expect(member(doc, 'kind').inheritedFrom).toBeUndefined()
    expect(valueOptions(member(doc, 'kind'))).toEqual(['text', 'icon'])
    expect(member(doc, 'text').optional).toBe(true)
  })

  it('merges object literal branches', async () => {
    const doc = await load('LiteralUnion')
    expect(doc.members.map((m) => m.name)).toEqual(['kind', 'a', 'b'])
    expect(valueOptions(member(doc, 'kind'))).toEqual(['a', 'b'])
    expect(member(doc, 'a').jsDoc.summary).toBe('The a payload.')
    expect(member(doc, 'a').optional).toBe(true)
  })
})

describe('unions that are not all object-like', () => {
  it('keeps the definition when one branch is not an object type', async () => {
    const doc = await load('MixedUnion')
    expect(doc.members).toEqual([])
    expect(doc.definition).toBe('PickerShared | string')
  })

  it('keeps the definition for a plain literal union', async () => {
    const doc = await load('PlainUnion')
    expect(doc.members).toEqual([])
    expect(doc.definition).toContain('number')
  })
})
