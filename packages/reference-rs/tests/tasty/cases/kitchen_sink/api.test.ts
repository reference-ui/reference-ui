import { describe, expect, it } from 'vitest'

import { addCaseRuntimeSmokeTests, createCaseApi, findMember } from '../../api-test-helpers'

const CASE = 'kitchen_sink'

describe('kitchen_sink tasty api (reference-docs kitchen sink)', () => {
  addCaseRuntimeSmokeTests(CASE, 'DocsReferenceButtonProps')

  it('indexes expected exported symbols from the manifest', async () => {
    const api = createCaseApi(CASE)
    const names = new Set(
      (await api.searchSymbols('DocsReference')).map((entry) => entry.name).sort()
    )
    expect(names.has('DocsReferenceButtonProps')).toBe(true)
    expect(names.has('DocsReferenceToneLabels')).toBe(true)
    expect(names.has('DocsReferenceInteractiveElement')).toBe(true)
    expect(names.has('DocsReferenceVariantMeta')).toBe(true)
    expect(names.has('DocsReferenceAsyncState')).toBe(true)
    expect(names.has('DocsReferenceComposedButtonProps')).toBe(true)
    expect(names.has('DocsReferenceSplitButtonProps')).toBe(true)
    expect(names.has('DocsReferenceCurrentIntent')).toBe(true)
  })

  it('models mapped types, template literals, and conditional aliases', async () => {
    const api = createCaseApi(CASE)
    const toneLabels = await api.loadSymbolByName('DocsReferenceToneLabels')
    const resolvedTone = await api.loadSymbolByName('DocsReferenceResolvedTone')
    const toneKey = await api.loadSymbolByName('DocsReferenceToneKey')
    const variantMeta = await api.loadSymbolByName('DocsReferenceVariantMeta')
    const buttonVariantMeta = await api.loadSymbolByName('DocsReferenceButtonVariantMeta')

    const mapped = toneLabels.getUnderlyingType()?.getRaw() as {
      kind?: string
      typeParam?: string
      nameType?: { kind?: string; parts?: unknown[] }
    }
    expect(mapped.kind).toBe('mapped')
    expect(mapped.typeParam).toBe('K')
    expect(mapped.nameType?.kind).toBe('template_literal')

    expect(resolvedTone.getUnderlyingType()?.getKind()).toBe('template_literal')
    expect(toneKey.getUnderlyingType()?.getKind()).toBe('template_literal')

    const cond = variantMeta.getUnderlyingType()?.getRaw() as { kind?: string; checkType?: { name?: string } }
    expect(cond.kind).toBe('conditional')
    expect(cond.checkType?.name).toBe('T')

    // Alias `DocsReferenceVariantMeta<DocsReferenceButtonVariant>` is represented as the
    // instantiated conditional, not a `reference` indirection, in the emitted contract.
    const instantiated = buttonVariantMeta.getUnderlyingType()?.getRaw() as {
      kind?: string
      checkType?: { name?: string }
    }
    expect(instantiated.kind).toBe('conditional')
    expect(instantiated.checkType?.name).toBe('DocsReferenceButtonVariant')
  })

  it('models unions, intersections, tuples, and indexed-access aliases', async () => {
    const api = createCaseApi(CASE)
    const interactive = await api.loadSymbolByName('DocsReferenceInteractiveElement')
    const composed = await api.loadSymbolByName('DocsReferenceComposedButtonProps')
    const padding = await api.loadSymbolByName('DocsReferenceButtonPadding')
    const currentIntent = await api.loadSymbolByName('DocsReferenceCurrentIntent')

    expect(interactive.getUnderlyingType()?.isUnion()).toBe(true)
    const branches = interactive.getUnderlyingType()?.getUnionTypes() ?? []
    expect(branches).toHaveLength(2)
    expect(branches.every((b) => b.getKind() === 'object')).toBe(true)

    expect(composed.getUnderlyingType()?.getKind()).toBe('intersection')

    const tupleRaw = padding.getUnderlyingType()?.getRaw() as {
      kind?: string
      elements?: Array<{ label?: string }>
    }
    expect(tupleRaw.kind).toBe('tuple')
    expect(tupleRaw.elements?.map((e) => e.label)).toEqual(['inline', 'block'])

    const intentAlias = currentIntent.getUnderlyingType()?.getRaw() as {
      kind?: string
      object?: { name?: string }
      index?: { kind?: string; name?: string; value?: string }
    }
    expect(intentAlias.kind).toBe('indexed_access')
    expect(intentAlias.object?.name).toBe('DocsReferenceButtonProps')
    expect(intentAlias.index?.kind).toBe('literal')
    expect(intentAlias.index?.value).toContain('currentIntent')
  })

  it('surfaces DocsReferenceButtonProps members: indexed access, refs, callbacks, and JSDoc', async () => {
    const api = createCaseApi(CASE)
    const buttonProps = await api.loadSymbolByName('DocsReferenceButtonProps')

    const raw = buttonProps.getRaw() as {
      description?: string
      jsdoc?: { summary?: string; tags?: Array<{ name?: string }> }
    }
    expect(raw.description).toContain('live reference table')
    expect(raw.jsdoc?.summary).toContain('live reference table')

    const currentIntent = findMember(buttonProps, 'currentIntent').getType()?.getRaw() as {
      kind?: string
    }
    expect(currentIntent.kind).toBe('indexed_access')

    const resolvedSize = findMember(buttonProps, 'resolvedSize').getType()
    expect(resolvedSize?.isReference()).toBe(true)
    expect(resolvedSize?.getReferencedSymbol()?.getName()).toBe('DocsReferenceResolvedSize')

    const toneLabelsMember = findMember(buttonProps, 'toneLabels').getType()
    expect(toneLabelsMember?.isReference()).toBe(true)
    expect(toneLabelsMember?.getReferencedSymbol()?.getName()).toBe('DocsReferenceToneLabels')

    const onPress = findMember(buttonProps, 'onPress').getType()
    expect(onPress?.getKind()).toBe('function')
    const onPressRaw = onPress?.getRaw() as { params?: Array<{ name?: string }> }
    expect(onPressRaw.params?.map((p) => p.name)).toEqual(['event', 'state'])

    const renderIcon = findMember(buttonProps, 'renderIcon')
    expect(renderIcon.getJsDocTags().map((t) => t.getName())).toEqual(
      expect.arrayContaining(['param', 'returns', 'see', 'example'])
    )
    expect(renderIcon.getJsDocTag('param')?.getValue()).toContain('icon')

    const formatLabel = findMember(buttonProps, 'formatLabel')
    expect(formatLabel.getJsDocTags().map((t) => t.getName())).toEqual(
      expect.arrayContaining(['param', 'deprecated', 'remarks'])
    )
    expect(formatLabel.getJsDocTag('deprecated')?.getValue()).toContain('direct render')
  })

  it('preserves generic constraints and defaults on DocsReferenceAsyncState', async () => {
    const api = createCaseApi(CASE)
    const asyncState = await api.loadSymbolByName('DocsReferenceAsyncState')

    expect(asyncState.getKind()).toBe('interface')
    const params = asyncState.getTypeParameters()
    expect(params).toHaveLength(1)
    expect(params[0]?.name).toBe('TData')
    expect(params[0]?.constraint).toMatchObject({ kind: 'intrinsic', name: 'string' })
    expect(params[0]?.default).toMatchObject({ name: 'DocsReferenceButtonVariant' })
  })

  it('flattens split button inheritance and collects user-owned references', async () => {
    const api = createCaseApi(CASE)
    const split = await api.loadSymbolByName('DocsReferenceSplitButtonProps')

    const extendsSyms = await split.loadExtendsSymbols()
    expect(extendsSyms.map((s) => s.getName()).sort()).toEqual([
      'DocsReferenceButtonProps',
      'DocsReferencePressableProps',
    ])

    const flattened = await api.graph.flattenInterfaceMembers(split)
    expect(flattened.map((m) => m.getName())).toEqual(expect.arrayContaining(['hasMenu', 'label', 'announceLabel']))

    const refs = await api.graph.collectUserOwnedReferences(split)
    expect(refs.map((r) => r.getName()).sort()).toEqual(
      expect.arrayContaining(['DocsReferenceButtonProps', 'DocsReferencePressableProps'])
    )
  })
})
