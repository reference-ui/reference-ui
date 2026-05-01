import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  createReferenceTestApi,
  typesPackageDir,
  typesPackageManifestPath,
  typesTastyDir,
  waitForReferenceArtifacts,
} from './helpers'

describe('reference output', () => {
  // MIGRATED: Covered by matrix/reference/tests/unit/reference-output.test.ts.
  it.skip('emits Tasty artifacts under .reference-ui/types/tasty', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )
    expect(existsSync(typesPackageDir), '.reference-ui/types should exist').toBe(true)
    expect(existsSync(typesTastyDir), '.reference-ui/types/tasty should exist').toBe(true)
    expect(existsSync(typesPackageManifestPath), 'types manifest.js should exist').toBe(
      true
    )
  })

  // TODO(matrix/reference): matrix/reference loads local symbols, but it does
  // not yet lock the raw indexed-access shape for ReferenceApiVariant.
  it('loads known symbols from the reference-unit source fixture', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createReferenceTestApi(typesPackageManifestPath)

    await api.ready()

    const fixture = await api.loadSymbolByName('ReferenceApiFixture')
    const variant = await api.loadSymbolByName('ReferenceApiVariant')
    const members = fixture.getMembers()
    const memberNames = members.map(member => member.getName())
    const variantMember = members.find(member => member.getName() === 'variant')
    const variantAliasRaw = variant.getUnderlyingType()?.getRaw() as {
      kind?: string
      object?: { name?: string }
      index?: { kind?: string; value?: string }
    }

    expect(fixture.getKind()).toBe('interface')
    expect(memberNames).toEqual(['label', 'disabled', 'variant'])
    expect(variant.getKind()).toBe('typeAlias')
    expect(variantAliasRaw.kind).toBe('indexed_access')
    expect(variantAliasRaw.object?.name).toBe('ReferenceApiFixture')
    expect(variantAliasRaw.index?.kind).toBe('literal')
    expect(variantAliasRaw.index?.value).toBe("'variant'")
    expect(variantMember?.getType()?.describe()).toContain('solid')
    expect(variantMember?.getType()?.describe()).toContain('ghost')
  })

  // TODO(matrix/reference): matrix/reference covers StyleProps loading, but not
  // yet this broader inherited member surface across the extends fixtures.
  it('indexes public React StyleProps alongside local fixture symbols', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createReferenceTestApi(typesPackageManifestPath)
    await api.ready()

    const styleProps = await api.loadSymbolByName('StyleProps')
    const extended = await api.loadSymbolByName('ReferenceStylePropsExtendsFixture')
    const extendedAlias = await api.loadSymbolByName('ReferenceStylePropsTypeExtendsFixture')
    const fixture = await api.loadSymbolByName('ReferenceApiFixture')
    const styleMembers = await styleProps.getDisplayMembers()
    const extendedMembers = await extended.getDisplayMembers()
    const extendedAliasMembers = await extendedAlias.getDisplayMembers()
    expect(styleProps.getName()).toBe('StyleProps')
    expect(styleProps.getKind()).toBe('typeAlias')
    expect(styleMembers.length).toBeGreaterThan(100)
    expect(styleMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining(['WebkitAppearance', 'accentColor', 'container'])
    )
    expect(extendedMembers.length).toBeGreaterThan(100)
    expect(extendedMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining(['WebkitAppearance', 'container', 'localTone'])
    )
    expect(extendedAliasMembers.length).toBeGreaterThan(100)
    expect(extendedAliasMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining(['WebkitAppearance', 'container', 'localFlag', 'localTone'])
    )
    expect(fixture.getName()).toBe('ReferenceApiFixture')
    expect(fixture.getKind()).toBe('interface')
  })

  // MIGRATED: Covered by matrix/reference/tests/unit/reference-output.test.ts.
  it.skip('projects display members for composed type aliases in generated reference artifacts', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createReferenceTestApi(typesPackageManifestPath)
    await api.ready()

    const composed = await api.loadSymbolByName('DocsReferenceComposedButtonProps')
    const displayMembers = await composed.getDisplayMembers()

    expect(composed.getKind()).toBe('typeAlias')
    expect(displayMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining([
        'label',
        'variant',
        'controlId',
        'interactionRole',
        'announceLabel',
      ])
    )
  })

  // TODO(matrix/reference): Add unit coverage for flattening display members
  // when an interface extends a type alias.
  it('flattens inherited display members when an interface extends a type alias', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createReferenceTestApi(typesPackageManifestPath)
    await api.ready()

    const symbol = await api.loadSymbolByName('DocsReferenceTypeExtendsProps')
    const displayMembers = await symbol.getDisplayMembers()

    expect(symbol.getKind()).toBe('interface')
    expect(displayMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining(['label', 'size', 'tone', 'hasMenu'])
    )
  })

  // TODO(matrix/reference): matrix/reference locks the direct alias target, but
  // not yet the raw-API display member projection for that alias.
  it('still projects direct alias targets in the raw Tasty API', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createReferenceTestApi(typesPackageManifestPath)
    await api.ready()

    const alias = await api.loadSymbolByName('DocsReferencePinnedTargetAlias')
    const displayMembers = await alias.getDisplayMembers()

    expect(alias.getKind()).toBe('typeAlias')
    expect(alias.getUnderlyingType()?.describe()).toBe('DocsReferencePinnedTarget')
    expect(displayMembers.map(member => member.getName())).toEqual(['label', 'disabled'])
  })
})
