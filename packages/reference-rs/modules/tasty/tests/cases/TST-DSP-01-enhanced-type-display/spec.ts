/**
 * Station specification for TST-DSP-01-enhanced-type-display.
 * Verifies rich display representations for complex style props and nested object members.
 * Proves primary SPEC ID anchor TST-DSP-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-DSP-01',
  async verify({ api }) {
    const styleProps = await api.loadSymbolByName('StyleProps')
    const members = await styleProps.getDisplayMembers()

    const memberTypes = new Map<string, string | undefined>()
    for (const member of members ?? []) {
      memberTypes.set(member.getName(), member.getType()?.describe())
    }

    expect(memberTypes.get('container')).toBe('StylePropValue<string | boolean>')
    expect(memberTypes.get('r')).toBe('StylePropValue<Record<string, SystemStyleObject>>')

    const complexType = memberTypes.get('complexStyle')
    expect(complexType).not.toBe('{ ... }')
    expect(complexType).toContain('color')

    const nestedProps = await api.loadSymbolByName('NestedStyleProps')
    const nestedMembers = await nestedProps.getDisplayMembers()
    const nestedTypes = new Map<string, string | undefined>()
    for (const member of nestedMembers ?? []) {
      nestedTypes.set(member.getName(), member.getType()?.describe())
    }

    const themeType = nestedTypes.get('theme')
    expect(themeType).not.toBe('{ ... }')
    expect(themeType).toBeTruthy()
  },
}

export default spec
