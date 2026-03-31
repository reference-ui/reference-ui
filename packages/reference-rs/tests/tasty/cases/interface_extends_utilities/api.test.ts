import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  type TastyApi,
} from '../../api-test-helpers'

const CASE = 'interface_extends_utilities'

async function displayMemberNames(api: TastyApi, symbolName: string): Promise<Set<string>> {
  const symbol = await api.loadSymbolByName(symbolName)
  const members = await api.graph.getDisplayMembers(symbol)
  return new Set(members.map((m) => m.getName()))
}

describe('interface_extends_utilities tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'ExtendsOmit')
  addCaseEmittedSnapshotTests(CASE)

  describe('extends_omit', () => {
    it('projects Omit<Bar, single key>', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'ExtendsOmit')
      expect(names.has('keep')).toBe(true)
      expect(names.has('y')).toBe(true)
      expect(names.has('x')).toBe(false)
    })
  })

  describe('extends_pick', () => {
    it('projects Pick<Bar, union of keys>', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'ExtendsPick')
      expect(names.has('a')).toBe(true)
      expect(names.has('b')).toBe(true)
      expect(names.has('c')).toBe(false)
    })
  })

  describe('extends_partial', () => {
    it('loads; Partial<> is not yet projected from interface heritage (smoke)', async () => {
      const api = createCaseApi(CASE)
      const symbol = await api.loadSymbolByName('ExtendsPartial')
      const members = await api.graph.getDisplayMembers(symbol)
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('extends_required', () => {
    it('loads; Required<Partial<>> composition is not yet projected from heritage (smoke)', async () => {
      const api = createCaseApi(CASE)
      const symbol = await api.loadSymbolByName('ExtendsRequired')
      const members = await api.graph.getDisplayMembers(symbol)
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('extends_record', () => {
    it('loads; Record<> is not yet projected from heritage (smoke)', async () => {
      const api = createCaseApi(CASE)
      const symbol = await api.loadSymbolByName('ExtendsRecord')
      const members = await api.graph.getDisplayMembers(symbol)
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('extends_readonly', () => {
    it('loads; Readonly<> is not yet projected from heritage (smoke)', async () => {
      const api = createCaseApi(CASE)
      const symbol = await api.loadSymbolByName('ExtendsReadonly')
      const members = await api.graph.getDisplayMembers(symbol)
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('extends_multiple_utility', () => {
    it('merges Omit and Pick heritage clauses', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'ExtendsMultiple')
      expect(names.has('y')).toBe(true)
      expect(names.has('z')).toBe(true)
      expect(names.has('x')).toBe(false)
    })
  })

  describe('extends_nested_utility', () => {
    it('projects Omit<Pick<Bar, …>, key>', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'ExtendsNested')
      expect(names.has('b')).toBe(true)
      expect(names.has('a')).toBe(false)
      expect(names.has('c')).toBe(false)
    })
  })

  describe('extends_omit_union_keys', () => {
    it('omits every key in a union of string literals', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'ExtendsOmitUnion')
      expect(names.has('keep')).toBe(true)
      expect(names.has('x')).toBe(false)
      expect(names.has('y')).toBe(false)
      expect(names.has('z')).toBe(false)
    })
  })

  describe('extends_omit_generic', () => {
    it('loads without throwing; generic key param is not concretely projected', async () => {
      const api = createCaseApi(CASE)
      const symbol = await api.loadSymbolByName('ExtendsOmitGeneric')
      const members = await api.graph.getDisplayMembers(symbol)
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('manifest-backed extends chain', () => {
    it('skips non-manifest utility ids (e.g. Omit) in loadExtendsChain', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ExtendsOmit')
      await expect(api.graph.loadExtendsChain(sym)).resolves.toEqual([])
      expect(api.hasManifestSymbol('Omit')).toBe(false)
    })
  })
})
