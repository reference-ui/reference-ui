// Callable member cases: they compile a vendored interface with a call signature, a method,
// an overloaded method and a function-typed property, and assert that each shows the same
// signature text and param rows in the API table. Each case reads the document the Reference runtime
// builds from the fixture, so the rows are what a reader sees.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { createReferenceDocument } from './document.ts'
import { createReferenceRuntime } from '../browser/Runtime.ts'
import type { ReferenceDocument, ReferenceMemberDocument } from '../browser/types.ts'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'callable-members')

let outputDir: string
let doc: ReferenceDocument

beforeAll(async () => {
  outputDir = mkdtempSync(join(tmpdir(), 'core-callable-members-'))
  const built = await buildTasty({ rootDir: fixtureDir, include: ['**/*.ts'], outputDir })
  const runtime = createReferenceRuntime({ loadApi: async () => built.api } as unknown as TastyBrowserRuntime)
  const data = await runtime.load('Notifier')
  doc = createReferenceDocument(data.symbol, data.members, {
    extendsChain: data.extendsChain,
    memberOrigins: data.memberOrigins,
    relatedSymbols: data.relatedSymbols,
    warnings: data.warnings,
  })
}, 60000)

afterAll(() => {
  rmSync(outputDir, { recursive: true, force: true })
})

function membersNamed(name: string): ReferenceMemberDocument[] {
  return doc.members.filter((m) => m.name === name)
}

function signature(m: ReferenceMemberDocument): string | undefined {
  const summary = m.summary.memberTypeSummary
  return summary?.kind === 'callSignature' ? summary.text : undefined
}

function paramRows(m: ReferenceMemberDocument): Array<[string, boolean | undefined, string | undefined]> {
  return m.summary.paramDocs.map((p) => [p.name, p.optional, p.description])
}

describe('callable members', () => {
  it('shows a call signature with its params and their @param text', () => {
    const [call] = membersNamed('[call]')
    expect(call?.kind).toBe('call')
    expect(signature(call!)).toBe('(message: string, options?: NotifyOptions) => string')
    expect(paramRows(call!)).toEqual([
      ['message', false, 'The text to show.'],
      ['options', true, 'Options for this message.'],
    ])
  })

  it('shows a method like a function-typed property', () => {
    const [success] = membersNamed('success')
    expect(success?.kind).toBe('method')
    expect(signature(success!)).toBe('(message: string, options?: NotifyOptions) => string')
    expect(paramRows(success!)).toEqual([
      ['message', false, 'The text to show.'],
      ['options', true, 'Options for this message.'],
    ])
    expect(success?.summary.description).toBe('Shows a success message.')
  })

  it('shows a method without params as an empty signature', () => {
    const [clear] = membersNamed('clear')
    expect(signature(clear!)).toBe('() => void')
    expect(paramRows(clear!)).toEqual([])
  })

  it('lists each overload as its own row with its own signature', () => {
    const finds = membersNamed('find')
    expect(finds.map(signature)).toEqual([
      '(id: string) => string',
      '(id: number, fallback?: string) => string | undefined',
    ])
    expect(finds.map(paramRows)[0]).toEqual([['id', false, 'The message id.']])
  })

  it('keeps the type label of a callable member as function', () => {
    expect(membersNamed('success')[0]?.typeLabel).toBe('function')
  })

  it('leaves a function-typed property unchanged', () => {
    const [onChange] = membersNamed('onChange')
    expect(onChange?.kind).toBe('property')
    expect(signature(onChange!)).toBe('(count: number, previous: number) => void')
    expect(paramRows(onChange!)).toEqual([
      ['count', false, 'The new count.'],
      ['previous', false, undefined],
    ])
  })
})
