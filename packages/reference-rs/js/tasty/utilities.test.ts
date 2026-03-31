import { describe, expect, it } from 'vitest'

import {
  createTastyApi,
  dedupeTastyMembers,
  formatTastyCallableSignature,
  getTastyResolvedType,
  getTastyMemberSemanticKind,
  getTastyTypeInlineVariants,
  getTastyTypeSemanticKind,
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
    const members = await api.graph.getDisplayMembers(buttonProps)
    const size = members.find(member => member.getName() === 'size')
    const disabled = members.find(member => member.getName() === 'disabled')
    const disabledType = disabled?.getType()

    expect(buttonProps.getDescription()).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(size?.getDescription()).toBe('Preferred size variant.')
    expect(size?.getDefaultValue()).toBe('sm')
    expect(disabledType?.describe()).toBe('boolean')
    expect(disabledType?.isUnion()).toBe(false)
  })

  it('formats function signatures and parameter details for callback members', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('signatures'),
    })

    const withCallback = await api.loadSymbolByName('WithCallback')
    const onClick = withCallback.getMembers().find(member => member.getName() === 'onClick')

    expect(onClick?.getParameters()).toEqual([
      {
        name: 'event',
        type: 'MouseEvent',
        optional: false,
        description: undefined,
      },
    ])
    expect(onClick?.getType() ? formatTastyCallableSignature(onClick.getType()!) : undefined).toBe(
      '(event: MouseEvent) => void',
    )
  })

  it('classifies constructor-like members without inventing missing signature data', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('signatures'),
    })

    const constructible = await api.loadSymbolByName('Constructible')
    const ctor = constructible.getMembers().find(member => member.getName() === '[new]')

    expect(ctor?.getKind()).toBe('construct')
    expect(ctor?.getParameters()).toEqual([])
  })

  it('exposes neutral semantic kinds for members and types', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('jsdoc'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const size = buttonProps.getMembers().find(member => member.getName() === 'size')
    const disabled = buttonProps.getMembers().find(member => member.getName() === 'disabled')

    expect(size ? getTastyMemberSemanticKind(size) : undefined).toBe('string')
    expect(disabled?.getType() ? getTastyTypeSemanticKind(disabled.getType()) : undefined).toBe('boolean')
  })

  it('collects inline variants for literal, boolean, and callable types', async () => {
    const jsdocApi = createTastyApi({
      manifestPath: manifestPath('jsdoc'),
    })
    const signaturesApi = createTastyApi({
      manifestPath: manifestPath('signatures'),
    })

    const buttonProps = await jsdocApi.loadSymbolByName('ButtonProps')
    const size = buttonProps.getMembers().find(member => member.getName() === 'size')
    const disabled = buttonProps.getMembers().find(member => member.getName() === 'disabled')
    const withCallback = await signaturesApi.loadSymbolByName('WithCallback')
    const onClick = withCallback.getMembers().find(member => member.getName() === 'onClick')

    expect(getTastyTypeInlineVariants(size?.getType())).toEqual(['sm', 'lg'])
    expect(getTastyTypeInlineVariants(disabled?.getType())).toEqual(['true', 'false'])
    expect(getTastyTypeInlineVariants(onClick?.getType())).toEqual(['(event: MouseEvent) => void'])
  })

  it('keeps utility helpers aligned with member and graph methods', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')

    expect(await api.graph.getDisplayMembers(buttonProps)).toEqual(
      dedupeTastyMembers(await api.graph.flattenInterfaceMembers(buttonProps)),
    )
  })

  it('surfaces resolved value-derived types without losing the declared wrapper shape', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('value_resolution'),
    })

    const intentKey = await api.loadSymbolByName('IntentKey')
    const sizeValue = await api.loadSymbolByName('SizeValue')
    const toneLabel = await api.loadSymbolByName('ToneLabel')
    const variantTone = await api.loadSymbolByName('VariantTone')
    const concreteVariantMeta = await api.loadSymbolByName('ConcreteVariantMeta')
    const intentFromInterface = await api.loadSymbolByName('IntentFromInterface')

    expect(intentKey.getUnderlyingType()?.describe()).toBe('keyof typeof intents')
    expect(getTastyResolvedType(intentKey.getUnderlyingType())?.describe()).toBe(
      "'primary' | 'danger'",
    )
    expect(sizeValue.getUnderlyingType()?.getResolved()?.describe()).toBe("'sm' | 'md' | 'lg'")
    expect(getTastyResolvedType(toneLabel.getUnderlyingType())?.describe()).toBe(
      "'tone-sm' | 'tone-md' | 'tone-lg'",
    )
    expect(getTastyResolvedType(variantTone.getUnderlyingType())?.describe()).toBe(
      "'tone-solid' | 'tone-ghost' | 'tone-outline'",
    )
    const concreteVariantMetaResolved = getTastyResolvedType(concreteVariantMeta.getUnderlyingType())
    expect(concreteVariantMetaResolved?.getRaw()).toEqual({
      kind: 'union',
      types: [
        {
          kind: 'object',
          members: [
            { name: 'emphasis', optional: false, readonly: false, kind: 'property', type: { kind: 'literal', value: "'high'" } },
            { name: 'fill', optional: false, readonly: false, kind: 'property', type: { kind: 'literal', value: 'true' } },
          ],
        },
        {
          kind: 'object',
          members: [
            { name: 'emphasis', optional: false, readonly: false, kind: 'property', type: { kind: 'literal', value: "'low'" } },
            { name: 'fill', optional: false, readonly: false, kind: 'property', type: { kind: 'literal', value: 'false' } },
          ],
        },
      ],
    })
    expect(getTastyResolvedType(intentFromInterface.getUnderlyingType())?.describe()).toBe(
      "'primary' | 'danger'",
    )
  })
})
