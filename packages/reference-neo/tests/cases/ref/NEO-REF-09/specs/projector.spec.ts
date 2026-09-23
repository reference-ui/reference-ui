// projector.spec.ts — spec for NEO-REF-09, the type-parameter projector pin. Takes { case } with the world
// freshly synced and the background manifest awaited explicitly. Emits nothing on success; throws naming the
// first projector number that drifts from the A4 measurement on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import type { TastyApi } from '@reference-ui/rust/tasty'
import { getReferenceUiTastyApiOptions } from '../../../../../src/reference/tasty/api.ts'
import { loadReferenceApi } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  case: NeoCase
}

interface NamedMember {
  getName(): string
}

function memberNames(members: NamedMember[]): string[] {
  return members.map((member) => member.getName())
}

const PROJECTOR_LIBRARIES = ['@reference-ui/styled', '@reference-ui/react', '@reference-ui/system', '@reference-ui/types']

// A4 numbers as widened: bare SystemProperties resolves through the neo decl closure with 1391
// display members — the widened StyleProps key universe (LOG-2 ## Typegen-architect §2: keys mirror
// build_style_prop_names; verified identical to the emitted decl keys, not trusted).
async function checkBareFallback(api: TastyApi): Promise<string[]> {
  const symbol = await api.loadSymbolByName('SystemProperties')
  const names = memberNames(await symbol.getDisplayMembers())
  assert.equal(names.length, 1391, `SystemProperties carries 1391 members, got ${names.length}`)
  for (const name of ['accentColor', 'container']) {
    assert.ok(names.includes(name), `SystemProperties members include ${name}`)
  }
  return names
}

// A4 mechanism: every include-matched file is library user, so scoped lookups miss by construction.
// Documented, not a fault: the projector falls back to the bare name below.
async function checkScopedMiss(api: TastyApi): Promise<void> {
  for (const library of PROJECTOR_LIBRARIES) {
    const hit = await api.findSymbolByScopedName(library, 'SystemProperties')
    assert.equal(hit, undefined, `scoped ${library}/SystemProperties misses`)
  }
}

// The real Crew B projector resolves P to the same 1391 members and declines every other name.
async function checkProjector(api: TastyApi, bareNames: string[]): Promise<void> {
  const project = getReferenceUiTastyApiOptions().projectTypeParameterMembers
  assert.ok(project, 'the reference API options carry a type-parameter projector')
  const projected = await project({ api, reference: { id: 'probe', name: 'P', library: 'user' } })
  assert.ok(projected, 'the projector resolves P')
  assert.deepEqual(memberNames(projected), bareNames, 'P projects the bare SystemProperties set')
  const declined = await project({ api, reference: { id: 'probe', name: 'Q', library: 'user' } })
  assert.equal(declined, undefined, 'the projector declines non-P names')
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const api = await loadReferenceApi(c.worldDir)
  const bareNames = await checkBareFallback(api)
  await checkScopedMiss(api)
  await checkProjector(api, bareNames)
}
