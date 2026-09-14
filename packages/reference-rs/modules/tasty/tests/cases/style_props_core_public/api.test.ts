import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

const CASE = 'style_props_core_public'

function memberNames(
  members: Array<{ getName(): string }> | undefined
): string[] | undefined {
  return members?.map((member) => member.getName())
}

describe('style_props_core_public tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'StylePropsCore')
  addCaseEmittedSnapshotTests(CASE)

  it('merges Omit<SystemStyleObject, …> with ReferenceProps (full public style surface)', async () => {
    const api = createCaseApi(CASE)
    const styleProps = await api.loadSymbolByName('StylePropsCore')

    const names = memberNames(await styleProps.getDisplayMembers())?.sort()

    // If Omit projection fails, Tasty returns only ReferenceProps → container, r, font, weight.
    // Keys from the base (after omit) must appear: display, color.
    expect(names).toEqual(['color', 'container', 'display', 'font', 'r', 'weight'])
    expect(styleProps.getMembers()).toEqual([])
  })
})
