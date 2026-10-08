/**
 * Station specification for TST-AUD-01-audit-alignment.
 * Verifies raw summaries, structural conditionals, and predicate return types.
 * Proves primary SPEC ID anchor TST-AUD-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import { findMember, type TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-AUD-01',
  async verify({ api }) {
    const remoteWidget = await api.loadSymbolByName('RemoteWidget')
    const flatten = await api.loadSymbolByName('Flatten')
    const withPredicate = await api.loadSymbolByName('WithPredicate')

    const remoteUnderlying = remoteWidget.getUnderlyingType()
    expect(remoteUnderlying?.getKind()).toBe('raw')
    expect(remoteUnderlying?.getSummary()).toBe("import('./dep').Widget")

    const flattenRaw = flatten.getUnderlyingType()?.getRaw() as {
      kind?: string
      extendsType?: { kind?: string; element?: { kind?: string; summary?: string } }
      trueType?: { name?: string }
      falseType?: { name?: string }
    }
    expect(flattenRaw.kind).toBe('conditional')
    expect(flattenRaw.extendsType?.kind).toBe('array')
    expect(flattenRaw.extendsType?.element?.kind).toBe('raw')
    expect(flattenRaw.extendsType?.element?.summary).toBe('infer U')
    expect(flattenRaw.trueType?.name).toBe('U')
    expect(flattenRaw.falseType?.name).toBe('T')

    const predicateType = findMember(withPredicate, 'isUser').getType()
    expect(predicateType?.getKind()).toBe('function')
    const predicateRaw = predicateType?.getRaw() as {
      returnType?: { kind?: string; summary?: string }
    }
    expect(predicateRaw.returnType?.kind).toBe('raw')
    expect(predicateRaw.returnType?.summary).toBe('value is User')
  },
}

export default spec
