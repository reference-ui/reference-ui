/**
 * Station specification for TST-QRY-01-type-queries.
 * Verifies typeof query expressions across aliases and member wrappers.
 * Proves primary SPEC ID anchor TST-QRY-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-QRY-01',
  async verify({ api }) {
    const themeConfig = await api.loadSymbolByName('ThemeConfig')
    const spacingScale = await api.loadSymbolByName('SpacingScale')
    const withTypeQueries = await api.loadSymbolByName('WithTypeQueries')

    expect(themeConfig.getUnderlyingType()?.getKind()).toBe('type_query')
    expect(
      (themeConfig.getUnderlyingType()?.getRaw() as { expression?: string }).expression
    ).toBe('themeConfig')
    expect(
      (spacingScale.getUnderlyingType()?.getRaw() as { expression?: string }).expression
    ).toBe('tokens.spacing')

    const configType = findMember(withTypeQueries, 'config').getType()?.getRaw() as {
      kind?: string
      expression?: string
    }
    const spacingType = findMember(withTypeQueries, 'spacing').getType()?.getRaw() as {
      kind?: string
      expression?: string
    }
    expect(configType.kind).toBe('type_query')
    expect(configType.expression).toBe('themeConfig')
    expect(spacingType.kind).toBe('type_query')
    expect(spacingType.expression).toBe('tokens.spacing')
  },
}

export default spec
