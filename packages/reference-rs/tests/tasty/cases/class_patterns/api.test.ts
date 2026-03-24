import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
} from '../../api-test-helpers'

const CASE = 'class_patterns'

describe('class_patterns tasty api', () => {
  addCaseRuntimeSmokeTests(CASE, 'ClassImplements')
  addCaseEmittedSnapshotTests(CASE)

  it('indexes interface mirrors for each checklist export (classes are not symbols yet)', async () => {
    const api = createCaseApi(CASE)
    const manifest = await api.loadManifest()
    const names = new Set(Object.values(manifest.symbolsById).map((e) => e.name))
    for (const expected of [
      'BarForImplements',
      'ClassImplements',
      'AbstractBaseForClass',
      'ClassExtendsAbstract',
      'ClassPrivateFields',
      'ClassStaticMembers',
      'ClassDecorators',
      'ClassParameterProperties',
    ]) {
      expect(names.has(expected)).toBe(true)
    }
  })

  describe('class_implements', () => {
    it('extends the implemented interface (flattened for display)', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassImplements')
      const names = (await api.graph.getDisplayMembers(sym)).map((m) => m.getName())
      expect(names).toContain('x')
    })
  })

  describe('class_extends_abstract', () => {
    it('inherits abstract-shaped and concrete members (flattened)', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassExtendsAbstract')
      const names = new Set((await api.graph.getDisplayMembers(sym)).map((m) => m.getName()))
      expect(names.has('abstractMember')).toBe(true)
      expect(names.has('concrete')).toBe(true)
    })
  })

  describe('class_private_fields', () => {
    it('surfaces public structural members only', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassPrivateFields')
      expect(sym.getMembers().map((m) => m.getName())).toEqual(['public'])
    })
  })

  describe('class_static_members', () => {
    it('models instance-side members for the documented shape', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassStaticMembers')
      expect(sym.getMembers().map((m) => m.getName())).toEqual(['instance'])
    })
  })

  describe('class_decorators', () => {
    it('keeps a plain instance interface', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassDecorators')
      expect(sym.getMembers().map((m) => m.getName())).toEqual(['value'])
    })
  })

  describe('class_parameter_properties', () => {
    it('matches constructor public parameter property shape', async () => {
      const api = createCaseApi(CASE)
      const sym = await api.loadSymbolByName('ClassParameterProperties')
      const names = sym.getMembers().map((m) => m.getName())
      expect(names).toContain('x')
    })
  })
})
