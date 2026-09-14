import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

describe('enhanced_type_display tasty api', () => {
  addCaseRuntimeSmokeTests('enhanced_type_display', 'StyleProps')
  addCaseEmittedSnapshotTests('enhanced_type_display')

  it('should display complete type information for object members', async () => {
    const api = createCaseApi('enhanced_type_display')
    const styleProps = await api.loadSymbolByName('StyleProps')
    const members = await styleProps.getDisplayMembers()

    // Get the type information for each member
    const memberTypes = new Map()
    for (const member of members ?? []) {
      const type = member.getType()
      memberTypes.set(member.getName(), type?.describe())
    }

    // Currently, object types will show as '{ ... }' which loses information
    // We want to see the actual member details
    expect(memberTypes.get('container')).toBe('StylePropValue<string | boolean>')
    expect(memberTypes.get('r')).toBe('StylePropValue<Record<string, SystemStyleObject>>')
    
    // Test that complex object types show more than just '{ ... }'
    const complexType = memberTypes.get('complexStyle')
    expect(complexType).not.toBe('{ ... }')
    expect(complexType).toContain('color') // Should contain member details
  })

  it('should show detailed type descriptions for nested objects', async () => {
    const api = createCaseApi('enhanced_type_display')
    const nestedProps = await api.loadSymbolByName('NestedStyleProps')
    const members = await nestedProps.getDisplayMembers()

    const memberTypes = new Map()
    for (const member of members ?? []) {
      const type = member.getType()
      memberTypes.set(member.getName(), type?.describe())
    }

    // Should show nested object structure, not just '{ ... }'
    const themeType = memberTypes.get('theme')
    expect(themeType).not.toBe('{ ... }')
    expect(themeType).toBeTruthy()
  })
})
