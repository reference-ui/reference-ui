/**
 * Station specification for TST-CLS-01-class-patterns.
 * Verifies class interface mirrors, implements/extends flattening, and member visibility.
 * Proves primary SPEC ID anchor TST-CLS-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyApi, TastyCaseResult } from '../../helpers.js'

async function verifyClassManifestAndImplements(api: TastyApi): Promise<void> {
  const manifest = await api.loadManifest()
  const names = new Set(Object.values(manifest.symbolsById).map(e => e.name))
  const expectedClasses = [
    'BarForImplements',
    'ClassImplements',
    'AbstractBaseForClass',
    'ClassExtendsAbstract',
    'ClassPrivateFields',
    'ClassStaticMembers',
    'ClassDecorators',
    'ClassParameterProperties',
  ]
  for (const expected of expectedClasses) {
    expect(names.has(expected)).toBe(true)
  }

  const implementsSym = await api.loadSymbolByName('ClassImplements')
  const implementsMembers = (await api.graph.getDisplayMembers(implementsSym)).map(m =>
    m.getName()
  )
  expect(implementsMembers).toContain('x')

  const extendsSym = await api.loadSymbolByName('ClassExtendsAbstract')
  const extendsMembers = new Set(
    (await api.graph.getDisplayMembers(extendsSym)).map(m => m.getName())
  )
  expect(extendsMembers.has('abstractMember')).toBe(true)
  expect(extendsMembers.has('concrete')).toBe(true)
}

async function verifyClassVisibilityAndProperties(api: TastyApi): Promise<void> {
  const privateFields = await api.loadSymbolByName('ClassPrivateFields')
  expect(privateFields.getMembers().map(m => m.getName())).toEqual(['public'])

  const staticMembers = await api.loadSymbolByName('ClassStaticMembers')
  expect(staticMembers.getMembers().map(m => m.getName())).toEqual(['instance'])

  const decorators = await api.loadSymbolByName('ClassDecorators')
  expect(decorators.getMembers().map(m => m.getName())).toEqual(['value'])

  const paramProperties = await api.loadSymbolByName('ClassParameterProperties')
  expect(paramProperties.getMembers().map(m => m.getName())).toContain('x')
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-CLS-01',
  async verify({ api }) {
    await verifyClassManifestAndImplements(api)
    await verifyClassVisibilityAndProperties(api)
  },
}

export default spec
