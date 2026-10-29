// System style-prop cases: they compile a vendored props alias built on a `DivProps` from a
// `@reference-ui/*` runtime copy whose `StyleProps` is spelled out. They assert that the table lists
// the alias's own members and the div's own props. They also assert that the system style props stay
// out of it, and that an own member sharing a style prop's name survives with its docs.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'

import { createReferenceDocument } from './document.ts'
import { createReferenceRuntime } from '../browser/Runtime.ts'
import type { ReferenceDocument } from '../browser/types.ts'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'system-style-props')

let outputDir: string
let doc: ReferenceDocument

beforeAll(async () => {
  outputDir = mkdtempSync(join(tmpdir(), 'core-system-style-props-'))
  const built = await buildTasty({ rootDir: fixtureDir, include: ['src/**/*.ts'], outputDir })
  const runtime = createReferenceRuntime({ loadApi: async () => built.api } as unknown as TastyBrowserRuntime)
  const data = await runtime.load('IconProps')
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

describe('system style props', () => {
  it('drops the style props a system runtime copy spells out, and keeps every other member', () => {
    expect(doc.library).toBe('user')
    expect(doc.members.map((member) => member.name).sort()).toEqual(['color', 'css', 'id', 'variant'])
  })

  it('keeps the alias own member that shares a name with a style prop, with its docs', () => {
    const color = doc.members.find((member) => member.name === 'color')
    expect(color?.summary.description ?? color?.jsDoc?.summary).toBe('Glyph colour.')
    const variant = doc.members.find((member) => member.name === 'variant')
    expect(variant?.defaultValue).toBe('outline')
  })
})
