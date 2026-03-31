import { describe, expect, it } from 'vitest'

import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
  createCaseApi,
  findMember,
} from '../../api-test-helpers'

describe('audit_alignment tasty api', () => {
  addCaseRuntimeSmokeTests('audit_alignment', 'RemoteWidget')
  addCaseEmittedSnapshotTests('audit_alignment')

  it('preserves raw summaries and structural conditionals through the wrapper API', async () => {
    const api = createCaseApi('audit_alignment')
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
  })
})
