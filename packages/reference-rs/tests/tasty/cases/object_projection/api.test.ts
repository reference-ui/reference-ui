import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((member) => member.getName())
}

describe('object_projection tasty api', () => {
  addCaseRuntimeSmokeTests('object_projection', 'PublicProjectedStyleProps')
  addCaseEmittedSnapshotTests('object_projection')

  it('projects object-like members for aliases by reusing interface and object member paths', async () => {
    const api = createCaseApi('object_projection')
    const base = await api.loadSymbolByName('BaseStyleProps')
    const objectAlias = await api.loadSymbolByName('ObjectAliasProps')
    const projected = await api.loadSymbolByName('ProjectedStyleProps')
    const publicProjected = await api.loadSymbolByName('PublicProjectedStyleProps')
    const unprojectable = await api.loadSymbolByName('UnprojectableStyleProps')

    const baseMembers = await base.getDisplayMembers()
    const objectAliasMembers = await objectAlias.getDisplayMembers()
    const projectedMembers = await projected.getDisplayMembers()
    const publicProjectedMembers = await publicProjected.getDisplayMembers()
    const unprojectableMembers = await unprojectable.getDisplayMembers()

    expect(memberNames(baseMembers)).toEqual(['tone', 'color', 'size'])
    expect(memberNames(objectAliasMembers)).toEqual(['radius'])
    expect(memberNames(projectedMembers)).toEqual(['tone', 'size', 'gap', 'display'])
    expect(memberNames(publicProjectedMembers)).toEqual(['tone', 'size', 'gap', 'display'])
    expect(unprojectableMembers).toEqual([])
    expect(projected.getMembers()).toEqual([])
    expect(publicProjected.getMembers()).toEqual([])
  })
})
