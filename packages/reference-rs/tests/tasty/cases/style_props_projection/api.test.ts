import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((member) => member.getName())
}

describe('style_props_projection tasty api', () => {
  addCaseRuntimeSmokeTests('style_props_projection', 'PublicReferenceSystemStyleObject')
  addCaseEmittedSnapshotTests('style_props_projection')

  it('projects a style-props alias chain into one object-like surface', async () => {
    const api = createCaseApi('style_props_projection')
    const systemStyle = await api.loadSymbolByName('SystemStyleObject')
    const styleProps = await api.loadSymbolByName('ReferenceSystemStyleObject')
    const publicStyleProps = await api.loadSymbolByName('PublicReferenceSystemStyleObject')

    const systemMembers = await api.graph.projectObjectLikeMembers(systemStyle)
    const styleMembers = await api.graph.projectObjectLikeMembers(styleProps)
    const publicMembers = await api.graph.projectObjectLikeMembers(publicStyleProps)

    expect(memberNames(systemMembers)).toEqual(['color', 'font', 'weight', 'container', '--accent', '[index]'])
    expect(memberNames(styleMembers)).toEqual(['color', '--accent', '[index]', 'container', 'r', 'font', 'weight'])
    expect(memberNames(publicMembers)).toEqual(['color', '--accent', '[index]', 'container', 'r', 'font', 'weight'])
  })
})
