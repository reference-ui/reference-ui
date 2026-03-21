import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

describe('value_resolution tasty api', () => {
  addCaseRuntimeSmokeTests('value_resolution', 'IntentKey')

  it('emits additive resolved payloads for value-derived types', async () => {
    const api = createCaseApi('value_resolution')
    const intentKey = await api.loadSymbolByName('IntentKey')
    const intentValue = await api.loadSymbolByName('IntentValue')
    const sizeValue = await api.loadSymbolByName('SizeValue')
    const toneLabel = await api.loadSymbolByName('ToneLabel')
    const variantTone = await api.loadSymbolByName('VariantTone')
    const concreteVariantMeta = await api.loadSymbolByName('ConcreteVariantMeta')
    const intentFromInterface = await api.loadSymbolByName('IntentFromInterface')
    const withValueResolution = await api.loadSymbolByName('WithValueResolution')

    const intentKeyRaw = intentKey.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(intentKeyRaw.kind).toBe('type_operator')
    expect(intentKeyRaw.resolved?.kind).toBe('union')
    expect(intentKeyRaw.resolved?.types?.map((item) => item.value)).toEqual(["'primary'", "'danger'"])

    const intentValueRaw = intentValue.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(intentValueRaw.kind).toBe('indexed_access')
    expect(intentValueRaw.resolved?.kind).toBe('union')
    expect(intentValueRaw.resolved?.types?.map((item) => item.value)).toEqual(["'blue'", "'red'"])

    const sizeValueRaw = sizeValue.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(sizeValueRaw.kind).toBe('indexed_access')
    expect(sizeValueRaw.resolved?.kind).toBe('union')
    expect(sizeValueRaw.resolved?.types?.map((item) => item.value)).toEqual(["'sm'", "'md'", "'lg'"])

    const toneLabelRaw = toneLabel.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(toneLabelRaw.kind).toBe('template_literal')
    expect(toneLabelRaw.resolved?.kind).toBe('union')
    expect(toneLabelRaw.resolved?.types?.map((item) => item.value)).toEqual([
      "'tone-sm'",
      "'tone-md'",
      "'tone-lg'",
    ])

    const variantToneRaw = variantTone.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(variantToneRaw.kind).toBe('template_literal')
    expect(variantToneRaw.resolved?.kind).toBe('union')
    expect(variantToneRaw.resolved?.types?.map((item) => item.value)).toEqual([
      "'tone-solid'",
      "'tone-ghost'",
      "'tone-outline'",
    ])

    const concreteVariantMetaRaw = concreteVariantMeta.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; members?: Array<{ name?: string }> }> }
    }
    expect(concreteVariantMetaRaw.kind).toBe('conditional')
    expect(concreteVariantMetaRaw.resolved?.kind).toBe('union')
    expect(concreteVariantMetaRaw.resolved?.types?.map((item) => item.kind)).toEqual([
      'object',
      'object',
    ])
    expect(
      concreteVariantMetaRaw.resolved?.types?.map((item) =>
        item.members?.map((member) => member.name).join(','),
      ),
    ).toEqual(['emphasis,fill', 'emphasis,fill'])

    const intentFromInterfaceRaw = intentFromInterface.getUnderlyingType()?.getRaw() as {
      kind?: string
      resolved?: { kind?: string; types?: Array<{ kind?: string; value?: string }> }
    }
    expect(intentFromInterfaceRaw.kind).toBe('indexed_access')
    expect(intentFromInterfaceRaw.resolved?.kind).toBe('union')
    expect(intentFromInterfaceRaw.resolved?.types?.map((item) => item.value)).toEqual([
      "'primary'",
      "'danger'",
    ])

    const sizeMember = findMember(withValueResolution, 'size').getType()
    expect(sizeMember?.getResolved()?.describe()).toBe("'sm' | 'md' | 'lg'")
  })
})
