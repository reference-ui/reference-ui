import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  type TastyApi,
} from '../../api-test-helpers'

const CASE = 'intersection_patterns'

async function displayMemberNames(api: TastyApi, symbolName: string): Promise<Map<string, string>> {
  const symbol = await api.loadSymbolByName(symbolName)
  const members = await api.graph.getDisplayMembers(symbol)
  return new Map(
    members.map((m) => [m.getName(), m.getType()?.describe() ?? '']),
  )
}

describe('intersection_patterns tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'MergedBasic')
  addCaseEmittedSnapshotTests(CASE)

  describe('intersection_basic', () => {
    it('merges members from both sides of A & B', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'MergedBasic')
      expect([...names.keys()].sort()).toEqual(['a', 'b', 'shared'])
    })
  })

  describe('intersection_with_override', () => {
    it('keeps a single field member; later object type wins (string over number)', async () => {
      const api = createCaseApi(CASE)
      const byName = await displayMemberNames(api, 'IntersectionOverride')
      expect([...byName.keys()].sort()).toEqual(['field', 'other'])
      expect(byName.get('field')).toMatch(/string/i)
    })
  })

  describe('intersection_utility_and_literal', () => {
    it('combines Omit with an overriding object literal for one key', async () => {
      const api = createCaseApi(CASE)
      const byName = await displayMemberNames(api, 'IntersectionUtilityLiteral')
      expect([...byName.keys()].sort()).toEqual(['x', 'y'])
      expect(byName.get('x')).toMatch(/string/i)
    })
  })

  describe('intersection_multiple', () => {
    it('flattens A & B & C & D into one member set', async () => {
      const api = createCaseApi(CASE)
      const names = await displayMemberNames(api, 'IntersectionMultiple')
      expect([...names.keys()].sort()).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('intersection_with_generics', () => {
    it('projects Merge<FooG, BarG> after alias instantiation', async () => {
      const api = createCaseApi(CASE)
      const byName = await displayMemberNames(api, 'MergedGeneric')
      expect([...byName.keys()].sort()).toEqual(['extra', 'flag', 'id', 'name'])
      expect(byName.get('name')).toMatch(/number/i)
    })
  })
})
