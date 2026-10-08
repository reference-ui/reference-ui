/**
 * Station specification for TST-MAP-01-mapped-types.
 * Verifies mapped type extraction, modifiers, key remapping with template literals, and member types.
 * Proves primary SPEC ID anchor TST-MAP-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-MAP-01',
  async verify({ api }) {
    const optionalTokens = await api.loadSymbolByName('OptionalTokens')
    const tokenLabels = await api.loadSymbolByName('TokenLabels')
    const withMappedTypes = await api.loadSymbolByName('WithMappedTypes')

    const optionalRaw = optionalTokens.getUnderlyingType()?.getRaw() as {
      kind?: string
      typeParam?: string
      sourceType?: { kind?: string; operator?: string; target?: { name?: string } }
      optionalModifier?: string
      readonlyModifier?: string
      valueType?: { kind?: string; object?: { name?: string }; index?: { name?: string } }
    }
    expect(optionalRaw.kind).toBe('mapped')
    expect(optionalRaw.typeParam).toBe('K')
    expect(optionalRaw.sourceType?.operator).toBe('keyof')
    expect(optionalRaw.optionalModifier).toBe('add')
    expect(optionalRaw.readonlyModifier).toBe('preserve')
    expect(optionalRaw.valueType?.kind).toBe('indexed_access')
    expect(optionalRaw.valueType?.object?.name).toBe('T')
    expect(optionalRaw.valueType?.index?.name).toBe('K')

    const tokenLabelsRaw = tokenLabels.getUnderlyingType()?.getRaw() as {
      readonlyModifier?: string
      nameType?: { kind?: string; parts?: Array<{ kind?: string; value?: unknown }> }
    }
    expect(tokenLabelsRaw.readonlyModifier).toBe('add')
    expect(tokenLabelsRaw.nameType?.kind).toBe('template_literal')
    expect(tokenLabelsRaw.nameType?.parts?.[0]).toEqual({ kind: 'text', value: 'token-' })

    const labelsType = findMember(withMappedTypes, 'labels').getType()?.getRaw() as {
      kind?: string
      nameType?: { kind?: string }
    }
    expect(labelsType.kind).toBe('mapped')
    expect(labelsType.nameType?.kind).toBe('template_literal')
  },
}

export default spec
