import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createTastyApi } from '@reference-ui/rust/tasty'
import { referenceManifestPath, referenceTastyDir, waitForReferenceArtifacts } from './helpers'

describe('reference output', () => {
  it('emits Tasty artifacts under .reference-ui/reference/tasty', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(true)
    expect(existsSync(referenceTastyDir), '.reference-ui/reference/tasty should exist').toBe(true)
    expect(existsSync(referenceManifestPath), 'reference manifest.js should exist').toBe(true)
  })

  it('loads known symbols from the reference-unit source fixture', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(true)

    const api = createTastyApi({
      manifestPath: referenceManifestPath,
    })

    await api.ready()

    const fixture = await api.loadSymbolByName('ReferenceApiFixture')
    const variant = await api.loadSymbolByName('ReferenceApiVariant')
    const members = fixture.getMembers()
    const memberNames = members.map((member) => member.getName())
    const variantMember = members.find((member) => member.getName() === 'variant')
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
})
