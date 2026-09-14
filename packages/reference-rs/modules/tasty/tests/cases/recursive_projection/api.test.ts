import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((member) => member.getName())
}

describe('recursive_projection tasty api', () => {
  addCaseRuntimeSmokeTests('recursive_projection', 'PublicSystemStyleObject')
  addCaseEmittedSnapshotTests('recursive_projection')

  it('projects top-level members while preserving recursive boundaries as members', async () => {
    const api = createCaseApi('recursive_projection')
    const nested = await api.loadSymbolByName('Nested')
    const systemStyle = await api.loadSymbolByName('SystemStyleObject')
    const publicSystemStyle = await api.loadSymbolByName('PublicSystemStyleObject')

    const nestedMembers = await nested.getDisplayMembers()
    const systemStyleMembers = await systemStyle.getDisplayMembers()
    const publicMembers = await publicSystemStyle.getDisplayMembers()

    expect(memberNames(nestedMembers)).toEqual(['[index]'])
    expect(memberNames(systemStyleMembers)).toEqual(['color', '--accent', '[index]', 'gap'])
    expect(memberNames(publicMembers)).toEqual(['color', '--accent', '[index]', 'gap'])
    expect(systemStyle.getMembers()).toEqual([])
    expect(publicSystemStyle.getMembers()).toEqual([])
  })
})
