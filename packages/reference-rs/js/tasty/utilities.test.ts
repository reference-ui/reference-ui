import { describe, expect, it } from 'vitest'

import {
  createTastyApi,
  dedupeTastyMembers,
  getTastyCallableParameters,
  getTastyJsDocParamDescriptions,
  getTastyMemberDefaultValue,
} from './index'

const baseDir = new URL('../../tests/tasty/cases/', import.meta.url)

function manifestPath(caseName: string): string {
  return new URL(`./${caseName}/output/manifest.js`, baseDir).pathname
}

describe('tasty utilities', () => {
  it('builds useful member utilities for jsdoc-rich interfaces', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('jsdoc'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const members = dedupeTastyMembers(await api.graph.flattenInterfaceMembers(buttonProps))
    const size = members.find(member => member.getName() === 'size')
    const disabled = members.find(member => member.getName() === 'disabled')
    const disabledType = disabled?.getType()

    expect(buttonProps.getDescription()).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(size?.getDescription()).toBe('Preferred size variant.')
    expect(size ? getTastyMemberDefaultValue(size) : undefined).toBe('sm')
    expect(disabledType?.describe()).toBe('boolean')
    expect(disabledType?.isUnion()).toBe(false)
  })

  it('formats function signatures and parameter details for callback members', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('signatures'),
    })

    const withCallback = await api.loadSymbolByName('WithCallback')
    const onClick = withCallback.getMembers().find(member => member.getName() === 'onClick')
    const onClickType = onClick?.getType()
    const paramDescriptions = onClick ? getTastyJsDocParamDescriptions(onClick) : new Map()

    expect(onClickType ? getTastyCallableParameters(onClickType) : []).toEqual([
      {
        name: 'event',
        type: 'MouseEvent',
        optional: false,
      },
    ])
    expect(paramDescriptions.get('event')).toBeUndefined()
  })

  it('classifies constructor-like members without inventing missing signature data', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('signatures'),
    })

    const constructible = await api.loadSymbolByName('Constructible')
    const ctor = constructible.getMembers().find(member => member.getName() === '[new]')

    expect(ctor?.getKind()).toBe('construct')
    expect(getTastyCallableParameters(ctor?.getType())).toEqual([])
  })
})
