import { describe, expect, it } from 'vitest'

import {
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

function memberNames(members: Array<{ getName(): string }> | undefined): string[] | undefined {
  return members?.map((member) => member.getName())
}

describe('style_props_key_alias_projection tasty api', () => {
  addCaseRuntimeSmokeTests('style_props_key_alias_projection', 'PublicStyleProps')

  it('projects omit keys through aliased literal unions', async () => {
    const api = createCaseApi('style_props_key_alias_projection')
    const narrowedStyle = await api.loadSymbolByName('NarrowedStyleObject')
    const publicStyleProps = await api.loadSymbolByName('PublicStyleProps')

    const narrowedMembers = await narrowedStyle.getDisplayMembers()
    const publicMembers = await publicStyleProps.getDisplayMembers()

    expect(memberNames(narrowedMembers)).toEqual(['color', 'padding', 'font', 'container', 'r'])
    expect(memberNames(publicMembers)).toEqual(['color', 'padding', 'container', 'r'])
    expect(narrowedStyle.getMembers()).toEqual([])
    expect(publicStyleProps.getMembers()).toEqual([])
  })
})
