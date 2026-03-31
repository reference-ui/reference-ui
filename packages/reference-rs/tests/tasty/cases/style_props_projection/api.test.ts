import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

function memberNames(
  members: Array<{ getName(): string }> | undefined
): string[] | undefined {
  return members?.map(member => member.getName())
}

describe('style_props_projection tasty api', () => {
  addCaseRuntimeSmokeTests('style_props_projection', 'PublicReferenceSystemStyleObject')
  addCaseEmittedSnapshotTests('style_props_projection')

  it('projects a style-props alias chain into one object-like surface', async () => {
    const api = createCaseApi('style_props_projection')
    const systemStyle = await api.loadSymbolByName('SystemStyleObject')
    const styleProps = await api.loadSymbolByName('ReferenceSystemStyleObject')
    const publicStyleProps = await api.loadSymbolByName(
      'PublicReferenceSystemStyleObject'
    )

    const systemMembers = await systemStyle.getDisplayMembers()
    const styleMembers = await styleProps.getDisplayMembers()
    const publicMembers = await publicStyleProps.getDisplayMembers()

    expect(memberNames(systemMembers)).toEqual([
      'color',
      'font',
      'weight',
      'container',
      '--accent',
      '[index]',
    ])
    expect(memberNames(styleMembers)).toEqual([
      'color',
      '--accent',
      '[index]',
      'container',
      'r',
      'font',
      'weight',
    ])
    expect(memberNames(publicMembers)).toEqual([
      'color',
      '--accent',
      '[index]',
      'container',
      'r',
      'font',
      'weight',
    ])
    expect(styleProps.getMembers()).toEqual([])
    expect(publicStyleProps.getMembers()).toEqual([])
    expect(styleProps.getUnderlyingType()?.describe()).toBe(
      "Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceBoxPatternProps"
    )
  })

  it('displays enhanced type information for complex style props', async () => {
    const api = createCaseApi('style_props_projection')
    const styleProps = await api.loadSymbolByName('PublicReferenceSystemStyleObject')
    const members = await styleProps.getDisplayMembers()

    // Get type descriptions for members
    const containerMember = members?.find(m => m.getName() === 'container')
    const rMember = members?.find(m => m.getName() === 'r')

    // These should show detailed type information, not just '{ ... }'
    expect(containerMember?.getType()?.describe()).toContain('ConditionalValue')
    expect(rMember?.getType()?.describe()).toContain('Record')

    // Should not be the old generic '{ ... }' format for complex objects
    expect(containerMember?.getType()?.describe()).not.toBe('{ ... }')
  })
})
