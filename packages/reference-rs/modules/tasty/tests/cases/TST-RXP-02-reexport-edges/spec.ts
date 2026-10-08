/**
 * Station specification for TST-RXP-02-reexport-edges.
 * Verifies complex re-export edge cases, barrels, and circular references.
 * Proves primary SPEC ID anchor TST-RXP-02.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import {
  expectUnderlyingPresent,
  findMember,
  type TastyApi,
  type TastyCaseResult,
} from '../../helpers.js'

async function verifyStarDefaultExclusion(api: TastyApi): Promise<void> {
  const origin = await api.loadSymbolByName('StarDefaultWidget')
  const use = await api.loadSymbolByName('StarDefaultPhantomUse')

  // Barrel map holds no "default": the star-provided phantom edge carries
  // no barrel attribution (raw id is the local name, not the origin id).
  const phantom = findMember(use, 'd')
  const phantomRef = phantom.getType()?.getReferencedSymbol()
  expect(phantomRef).toBeDefined()
  expect(api.hasManifestSymbol(phantomRef!.getId())).toBe(false)
  expect(phantomRef!.getId()).not.toBe(origin.getId())
  const phantomRaw = phantom.getType()?.getRaw() as {
    id?: string
    name?: string
  }
  expect(phantomRaw.id).toBe('StarDefaultPhantom')
  expect(phantomRaw.name).toBe('StarDefaultPhantom')

  // Phantom consumer stays unresolved: nothing manifest-backed loads.
  await expect(api.graph.resolveReference(phantomRef!)).rejects.toThrow()

  // Star still works through the same barrel: the named export resolves,
  // and the direct default import from the origin is intact.
  const namedTarget = await findMember(use, 'n')
    .getType()
    ?.getReferencedSymbol()
    ?.load()
  expect(namedTarget?.getName()).toBe('StarDefaultNamed')
  const directTarget = await findMember(use, 'direct')
    .getType()
    ?.getReferencedSymbol()
    ?.load()
  expect(directTarget?.getId()).toBe(origin.getId())

  // Explicit `export { X as default }` seed survives the star exclusion.
  const explicitUse = await api.loadSymbolByName('ExplicitDefaultUse')
  const explicitTarget = await findMember(explicitUse, 'd')
    .getType()
    ?.getReferencedSymbol()
    ?.load()
  expect(explicitTarget?.getName()).toBe('ExplicitDefaultWidget')
}

async function verifyTwoHopNamedReexport(api: TastyApi): Promise<void> {
  const origin = await api.loadSymbolByName('TwoHopWidget')
  const use = await api.loadSymbolByName('TwoHopUse')
  const member = findMember(use, 'w')

  // Barrel-map attribution: the two-hop edge lands on the canonical origin.
  const ref = member.getType()?.getReferencedSymbol()
  expect(ref).toBeDefined()
  expect(ref!.getId()).toBe(origin.getId())
  const target = await ref!.load()
  expect(target.getName()).toBe('TwoHopWidget')
  expect(target.getId()).toBe(origin.getId())

  // Consumer target id: the raw edge payload carries the resolved target.
  const raw = member.getType()?.getRaw() as { id?: string; name?: string }
  expect(raw.id).toBe(origin.getId())
  expect(raw.name).toBe('TwoHopWidget')
}

async function verifyDefaultAsReexport(api: TastyApi): Promise<void> {
  const origin = await api.loadSymbolByName('DefaultAsWidget')
  const use = await api.loadSymbolByName('DefaultAsUse')
  const member = findMember(use, 'w')

  // Barrel-map attribution: the `default as` edge lands on the canonical
  // default-exported type (never a value literal — that shape stays out).
  const ref = member.getType()?.getReferencedSymbol()
  expect(ref).toBeDefined()
  expect(ref!.getId()).toBe(origin.getId())
  const target = await ref!.load()
  expect(target.getName()).toBe('DefaultAsWidget')
  expect(target.getId()).toBe(origin.getId())

  // Consumer target id: the raw edge payload carries the resolved target.
  const raw = member.getType()?.getRaw() as { id?: string; name?: string }
  expect(raw.id).toBe(origin.getId())
  expect(raw.name).toBe('DefaultAsWidget')
}

async function verifyReexportCycleTerminates(api: TastyApi): Promise<void> {
  // The a↔b named-reexport cycle terminates; the declaring file's binding
  // wins and the consumer through the cycle resolves to it.
  const item = await api.loadSymbolByName('CircularItem')
  const use = await api.loadSymbolByName('CircularUse')
  const target = await findMember(use, 'c')
    .getType()
    ?.getReferencedSymbol()
    ?.load()
  expect(target?.getId()).toBe(item.getId())
}

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-RXP-02',
  async verify({ api, emitted }) {
    const foo = await api.loadSymbolByName('Foo')
    const reexportTypeOnly = await api.loadSymbolByName('ReexportTypeOnly')
    const reexportMixed = await api.loadSymbolByName('ReexportMixed')
    const ambientModule = await api.loadSymbolByName('AmbientModule')

    for (const sym of [foo, reexportTypeOnly, reexportMixed, ambientModule]) {
      expectUnderlyingPresent(sym)
    }

    const reexportMixedType = await api.loadSymbolByName('ReexportMixedType')
    const barrelDeepItem = await api.loadSymbolByName('BarrelDeepItem')
    const circularItem = await api.loadSymbolByName('CircularItem')
    const starSourceItem = await api.loadSymbolByName('StarSourceItem')

    for (const sym of [reexportMixedType, barrelDeepItem, circularItem, starSourceItem]) {
      expectUnderlyingPresent(sym)
    }

    // Wave 6 find q: `StarWidget` is provided by two `export *` targets of
    // the ambiguity barrel, so the barrel exports nothing (tsc TS2308) and
    // the consumer member stays an unresolved external descriptor.
    const use = await api.loadSymbolByName('StarAmbiguityUse')
    const wRaw = findMember(use, 'w').getType()?.getRaw() as {
      id?: string
      name?: string
    }
    expect(wRaw.id).toBe('StarWidget')
    expect(wRaw.name).toBe('StarWidget')

    // Exactly one diagnostic, naming the barrel, the name, and both sources.
    const diagnostics = emitted.diagnostics ?? []
    expect(diagnostics).toHaveLength(1)
    const [ambiguity] = diagnostics
    expect(ambiguity!.code).toBe('TST-W-STAR-AMBIGUITY')
    expect(ambiguity!.severity).toBe('warning')
    expect(ambiguity!.file).toContain('star-ambiguity-barrel.ts')
    expect(ambiguity!.message).toContain('`StarWidget`')
    expect(ambiguity!.message).toContain('star-ambiguity-a.ts')
    expect(ambiguity!.message).toContain('star-ambiguity-b.ts')

    // The diagnostic also rides the manifest warnings channel.
    const warnings = api.getWarnings()
    expect(
      warnings.some(
        w =>
          w.code === 'TST-W-STAR-AMBIGUITY' &&
          w.message.includes('export * ambiguity') &&
          w.message.includes('`StarWidget`')
      )
    ).toBe(true)

    await verifyStarDefaultExclusion(api)
    await verifyTwoHopNamedReexport(api)
    await verifyDefaultAsReexport(api)
    await verifyReexportCycleTerminates(api)
  },
}

export default spec
