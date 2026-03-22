import { describe, expect, it } from 'vitest'

import { addCaseEmittedSnapshotTests, createCaseApi } from '../../api-test-helpers'

describe('duplicate_names tasty api', () => {
  // No addCaseRuntimeSmokeTests: every exported symbol name here is duplicated or ambiguous for bare lookup.
  addCaseEmittedSnapshotTests('duplicate_names')

  it('preserves duplicate-name matches and reports them as warnings', async () => {
    const api = createCaseApi('duplicate_names')
    const manifest = await api.loadManifest()
    const matches = await api.findSymbolsByName('Shared')

    expect(manifest.symbolsByName.Shared).toHaveLength(2)
    expect(matches).toHaveLength(2)
    expect(api.getWarnings().some((warning) => warning.includes('Duplicate symbol name "Shared"'))).toBe(true)
  })

  it('rejects ambiguous bare-name lookup', async () => {
    const api = createCaseApi('duplicate_names')

    await expect(api.loadSymbolByName('Shared')).rejects.toThrow('Ambiguous symbol name "Shared"')
  })
})
