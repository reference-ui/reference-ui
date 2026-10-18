// symbols.spec.ts — spec for NEO-REF-02, the local symbol query port. Takes { case } with the world
// freshly synced and the background manifest awaited explicitly. Emits nothing on success; throws naming
// the first query whose kind, members, or raw shape drifts from the matrix oracle on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { loadReferenceApi } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  case: NeoCase
}

interface NamedMember {
  getName(): string
}

interface RawIndexedAccess {
  kind?: string
  object?: { name?: string }
  index?: { kind?: string; value?: string }
}

function memberNames(members: NamedMember[]): string[] {
  return members.map((member) => member.getName())
}

// Matrix unit test 1 (local half): the local interface carries exactly its three declared members.
async function checkLocalFixture(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const fixture = await api.loadSymbolByName('ReferenceApiFixture')
  assert.equal(fixture.getKind(), 'interface')
  assert.deepEqual(memberNames(fixture.getMembers()), ['label', 'disabled', 'variant'])
}

// Matrix unit test 2: indexed-access aliases stay readable in the raw API.
async function checkIndexedAccess(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const fixture = await api.loadSymbolByName('ReferenceApiFixture')
  const variant = await api.loadSymbolByName('ReferenceApiVariant')
  const raw = variant.getUnderlyingType()?.getRaw() as unknown as RawIndexedAccess | undefined
  const variantMember = fixture.getMembers().find((member) => member.getName() === 'variant')
  assert.equal(variant.getKind(), 'typeAlias')
  assert.equal(raw?.kind, 'indexed_access')
  assert.equal(raw?.object?.name, 'ReferenceApiFixture')
  assert.equal(raw?.index?.kind, 'literal')
  assert.equal(raw?.index?.value, "'variant'")
  assert.ok(variantMember?.getType()?.describe().includes('solid'))
  assert.ok(variantMember?.getType()?.describe().includes('ghost'))
}

// Matrix unit test 1 (composed half): the composed alias projects every member across the intersection.
async function checkComposedAlias(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const composed = await api.loadSymbolByName('DocsReferenceComposedButtonProps')
  const names = memberNames(await composed.getDisplayMembers())
  assert.equal(composed.getKind(), 'typeAlias')
  for (const name of ['label', 'variant', 'controlId', 'interactionRole', 'announceLabel']) {
    assert.ok(names.includes(name), `composed members include ${name}`)
  }
}

// Matrix unit test 4: an interface extending a type alias flattens the inherited display members.
async function checkTypeExtends(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const symbol = await api.loadSymbolByName('DocsReferenceTypeExtendsProps')
  const names = memberNames(await symbol.getDisplayMembers())
  assert.equal(symbol.getKind(), 'interface')
  for (const name of ['label', 'size', 'tone', 'hasMenu']) {
    assert.ok(names.includes(name), `flattened members include ${name}`)
  }
}

// Matrix unit test 5: direct alias targets project members without losing alias identity.
async function checkPinnedAlias(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const alias = await api.loadSymbolByName('DocsReferencePinnedTargetAlias')
  assert.equal(alias.getKind(), 'typeAlias')
  assert.equal(alias.getUnderlyingType()?.describe(), 'DocsReferencePinnedTarget')
  assert.deepEqual(memberNames(await alias.getDisplayMembers()), ['label', 'disabled'])
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  await checkLocalFixture(c.worldDir)
  await checkIndexedAccess(c.worldDir)
  await checkComposedAlias(c.worldDir)
  await checkTypeExtends(c.worldDir)
  await checkPinnedAlias(c.worldDir)
}
