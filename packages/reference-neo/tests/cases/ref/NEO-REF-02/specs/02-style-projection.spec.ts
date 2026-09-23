// style-projection.spec.ts — spec for NEO-REF-02, the StyleProps projection port. Takes { case } with the
// world freshly synced and the background manifest awaited explicitly. Emits nothing on success; throws naming
// the first style query whose members drift from the matrix oracle on failure.
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

function memberNames(members: NamedMember[]): string[] {
  return members.map((member) => member.getName())
}

// Matrix unit tests 1+3 (style half): exactly one StyleProps resolves, and it projects the style surface.
// Was D-OPEN-1 (resolved): single-root closure + RS scoped-external-ref fix; the bare lookup is unambiguous.
async function checkStyleProps(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const matches = await api.findSymbolsByName('StyleProps')
  assert.equal(matches.length, 1, `exactly one StyleProps indexed, got ${matches.length}`)
  const styleProps = await api.loadSymbolByName('StyleProps')
  const names = memberNames(await styleProps.getDisplayMembers())
  assert.equal(styleProps.getName(), 'StyleProps')
  assert.equal(styleProps.getKind(), 'typeAlias')
  assert.ok(names.length > 90, `style surface projects broadly, got ${names.length} members`)
  for (const name of ['accentColor', 'container']) {
    assert.ok(names.includes(name), `StyleProps members include ${name}`)
  }
}

// Matrix unit test 3 (extends half): local fixtures extending StyleProps inherit the surface plus locals.
async function checkStyleExtends(worldDir: string): Promise<void> {
  const api = await loadReferenceApi(worldDir)
  const extended = await api.loadSymbolByName('ReferenceStylePropsExtendsFixture')
  const extendedNames = memberNames(await extended.getDisplayMembers())
  assert.ok(extendedNames.length > 90, `extends fixture projects broadly, got ${extendedNames.length}`)
  for (const name of ['accentColor', 'container', 'localTone']) {
    assert.ok(extendedNames.includes(name), `extends members include ${name}`)
  }
  const extendedAlias = await api.loadSymbolByName('ReferenceStylePropsTypeExtendsFixture')
  const aliasNames = memberNames(await extendedAlias.getDisplayMembers())
  assert.ok(aliasNames.length > 90, `extends alias projects broadly, got ${aliasNames.length}`)
  for (const name of ['accentColor', 'container', 'localFlag', 'localTone']) {
    assert.ok(aliasNames.includes(name), `extends alias members include ${name}`)
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  await checkStyleProps(c.worldDir)
  await checkStyleExtends(c.worldDir)
}
