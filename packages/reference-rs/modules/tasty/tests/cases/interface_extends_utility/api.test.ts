import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

describe('interface_extends_utility tasty api', () => {
  addCaseRuntimeSmokeTests('interface_extends_utility', 'StyleProps')
  addCaseEmittedSnapshotTests('interface_extends_utility')

  it('does not require a manifest symbol for Omit in interface heritage', async () => {
    const api = createCaseApi('interface_extends_utility')
    const styleProps = await api.loadSymbolByName('StyleProps')
    await expect(api.graph.loadExtendsChain(styleProps)).resolves.toEqual([])
    expect(api.hasManifestSymbol('Omit')).toBe(false)
  })

  it('projects Omit members from extends and merges declared members', async () => {
    const api = createCaseApi('interface_extends_utility')
    const styleProps = await api.loadSymbolByName('StyleProps')
    const members = await api.graph.getDisplayMembers(styleProps)
    const names = new Set(members.map((m) => m.getName()))
    expect(names.has('keep')).toBe(true)
    expect(names.has('font')).toBe(false)
    expect(names.has('weight')).toBe(false)
    expect(names.has('extra')).toBe(true)
  })

  it('walks manifest-backed extends after utility heritage', async () => {
    const api = createCaseApi('interface_extends_utility')
    const child = await api.loadSymbolByName('ChildProps')
    const chain = await api.graph.loadExtendsChain(child)
    expect(chain.map((s) => s.getName())).toEqual(['StyleProps'])
    const display = await api.graph.getDisplayMembers(child)
    const keep = display.find((m) => m.getName() === 'keep')
    expect(keep).toBeDefined()
  })
})
