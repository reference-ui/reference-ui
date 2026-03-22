import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('type_queries tasty api', () => {
  addCaseRuntimeSmokeTests('type_queries', 'ThemeConfig')
  addCaseEmittedSnapshotTests('type_queries')

  it('surfaces type query expressions through aliases and member wrappers', async () => {
    const api = createCaseApi('type_queries')
    const themeConfig = await api.loadSymbolByName('ThemeConfig')
    const spacingScale = await api.loadSymbolByName('SpacingScale')
    const withTypeQueries = await api.loadSymbolByName('WithTypeQueries')

    expect(themeConfig.getUnderlyingType()?.getKind()).toBe('type_query')
    expect((themeConfig.getUnderlyingType()?.getRaw() as { expression?: string }).expression).toBe(
      'themeConfig'
    )
    expect((spacingScale.getUnderlyingType()?.getRaw() as { expression?: string }).expression).toBe(
      'tokens.spacing'
    )

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
  })
})
