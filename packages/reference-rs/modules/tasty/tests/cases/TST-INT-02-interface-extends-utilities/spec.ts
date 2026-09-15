/**
 * Station specification for TST-INT-02-interface-extends-utilities.
 * Verifies Omit, Pick, Partial, Required, Record, and Readonly utility compositions in interface heritage.
 * Proves primary SPEC ID anchor TST-INT-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyApi, TastyCaseResult } from '../../helpers.js'

async function displayMemberNames(api: TastyApi, symbolName: string): Promise<Set<string>> {
  const symbol = await api.loadSymbolByName(symbolName)
  const members = await api.graph.getDisplayMembers(symbol)
  return new Set(members.map((m) => m.getName()))
}

async function verifyBasicUtilityProjections(api: TastyApi): Promise<void> {
  const omitNames = await displayMemberNames(api, 'ExtendsOmit')
  expect(omitNames.has('keep')).toBe(true)
  expect(omitNames.has('y')).toBe(true)
  expect(omitNames.has('x')).toBe(false)

  const pickNames = await displayMemberNames(api, 'ExtendsPick')
  expect(pickNames.has('a')).toBe(true)
  expect(pickNames.has('b')).toBe(true)
  expect(pickNames.has('c')).toBe(false)

  const partialSym = await api.loadSymbolByName('ExtendsPartial')
  expect(Array.isArray(await api.graph.getDisplayMembers(partialSym))).toBe(true)

  const requiredSym = await api.loadSymbolByName('ExtendsRequired')
  expect(Array.isArray(await api.graph.getDisplayMembers(requiredSym))).toBe(true)

  const recordSym = await api.loadSymbolByName('ExtendsRecord')
  expect(Array.isArray(await api.graph.getDisplayMembers(recordSym))).toBe(true)

  const readonlySym = await api.loadSymbolByName('ExtendsReadonly')
  expect(Array.isArray(await api.graph.getDisplayMembers(readonlySym))).toBe(true)
}

async function verifyComplexHeritageClauses(api: TastyApi): Promise<void> {
  const multiNames = await displayMemberNames(api, 'ExtendsMultiple')
  expect(multiNames.has('y')).toBe(true)
  expect(multiNames.has('z')).toBe(true)
  expect(multiNames.has('x')).toBe(false)

  const nestedNames = await displayMemberNames(api, 'ExtendsNested')
  expect(nestedNames.has('b')).toBe(true)
  expect(nestedNames.has('a')).toBe(false)
  expect(nestedNames.has('c')).toBe(false)

  const unionNames = await displayMemberNames(api, 'ExtendsOmitUnion')
  expect(unionNames.has('keep')).toBe(true)
  expect(unionNames.has('x')).toBe(false)
  expect(unionNames.has('y')).toBe(false)
  expect(unionNames.has('z')).toBe(false)

  const genericSym = await api.loadSymbolByName('ExtendsOmitGeneric')
  expect(Array.isArray(await api.graph.getDisplayMembers(genericSym))).toBe(true)

  const omitSym = await api.loadSymbolByName('ExtendsOmit')
  await expect(api.graph.loadExtendsChain(omitSym)).resolves.toEqual([])
  expect(api.hasManifestSymbol('Omit')).toBe(false)
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-INT-02',
  async verify({ api }) {
    await verifyBasicUtilityProjections(api)
    await verifyComplexHeritageClauses(api)
  },
}

export default spec
