import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createTastyApi } from '@reference-ui/rust/tasty'
import {
  typesPackageDir,
  typesPackageManifestPath,
  typesTastyDir,
  waitForReferenceArtifacts,
} from './helpers'

describe('reference output', () => {
  it('emits Tasty artifacts under .reference-ui/types/tasty', async () => {
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

  it('loads known symbols from the reference-unit source fixture', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createTastyApi({
      manifestPath: typesPackageManifestPath,
    })

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

  it('loads StyleProps after export type re-export from @reference-ui/react', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createTastyApi({
      manifestPath: typesPackageManifestPath,
    })
    await api.ready()

    const style = await api.loadSymbolByName('StyleProps')
    expect(style.getName()).toBe('StyleProps')
    expect(style.getKind()).toBe('typeAlias')
  })

  it('projects display members for composed type aliases in generated reference artifacts', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createTastyApi({
      manifestPath: typesPackageManifestPath,
    })
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

  it('flattens inherited display members when an interface extends a type alias', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createTastyApi({
      manifestPath: typesPackageManifestPath,
    })
    await api.ready()

    const symbol = await api.loadSymbolByName('DocsReferenceTypeExtendsProps')
    const displayMembers = await symbol.getDisplayMembers()

    expect(symbol.getKind()).toBe('interface')
    expect(displayMembers.map(member => member.getName())).toEqual(
      expect.arrayContaining(['label', 'size', 'tone', 'hasMenu'])
    )
  })

  it('still projects direct alias targets in the raw Tasty API', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
      true
    )

    const api = createTastyApi({
      manifestPath: typesPackageManifestPath,
    })
    await api.ready()

    const alias = await api.loadSymbolByName('DocsReferencePinnedTargetAlias')
    const displayMembers = await alias.getDisplayMembers()

    expect(alias.getKind()).toBe('typeAlias')
    expect(alias.getUnderlyingType()?.describe()).toBe('DocsReferencePinnedTarget')
    expect(displayMembers.map(member => member.getName())).toEqual(['label', 'disabled'])
  })
})
