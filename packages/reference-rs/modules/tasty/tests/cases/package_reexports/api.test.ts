import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('package_reexports tasty api', () => {
  addCaseRuntimeSmokeTests('package_reexports', 'UsesExternalAliases')
  addCaseEmittedSnapshotTests('package_reexports')

  it('keeps canonical library symbols for package type re-exports', async () => {
    const api = createCaseApi('package_reexports')
    const usesExternalAliases = await api.loadSymbolByName('UsesExternalAliases')
    const jsonSchema = await api.loadSymbolByName('JSONSchema4')
    const cssProperties = await api.loadSymbolByName('Properties')

    const schemaMatches = await api.findSymbolsByName('JSONSchema4')
    const cssMatches = await api.findSymbolsByName('Properties')
    const aliasedCssMatches = await api.findSymbolsByName('CSSProperties')

    expect(api.getWarnings().some((warning) => warning.includes('Duplicate symbol name'))).toBe(false)
    expect(schemaMatches).toHaveLength(1)
    expect(cssMatches).toHaveLength(1)
    expect(aliasedCssMatches).toHaveLength(0)
    expect(jsonSchema.getLibrary()).toBe('json-schema')
    expect(cssProperties.getLibrary()).toBe('csstype')
    expect(cssProperties.getName()).toBe('Properties')

    const schemaType = findMember(usesExternalAliases, 'schema').getType()?.getRaw() as {
      name?: string
      library?: string
    }
    const cssType = findMember(usesExternalAliases, 'css').getType()?.getRaw() as {
      name?: string
      library?: string
    }

    expect(schemaType.name).toBe('JSONSchema4')
    expect(schemaType.library).toBe('json-schema')
    expect(cssType.name).toBe('Properties')
    expect(cssType.library).toBe('csstype')
  })
})
