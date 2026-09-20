/**
 * Channel-isolation station (ATM-DIAG-07, Operation Error Correct, Slice 5).
 * The default channel carries no dynamic, spread, harvest-sink, or
 * dead-branch diagnostics; those ride the opt-in `compilerDiagnostics`
 * channel (`logs: ['compiler']`, additive-optional per the Q2 ruling).
 * Guard correction (E8-class): non-vacuity reads the opt-in channel, since
 * the default channel must carry none of these by contract.
 */
import { expect } from 'vitest'
import { compileCase, type AtomicCaseSpec } from '../../helpers.js'

/** Compiler-family codes: true facts that prove no exact runtime miss. */
function isChannelItem(code: string): boolean {
  return (
    code.startsWith('ATM-W-DYNAMIC-') ||
    code === 'ATM-W-UNFOLDABLE-SPREAD' ||
    code === 'ATM-I-HARVEST-SINK' ||
    code === 'ATM-I-DEAD-BRANCH'
  )
}

const spec: AtomicCaseSpec = {
  id: 'ATM-DIAG-07',
  async verify(result) {
    const diagnostics = result.diagnostics ?? []

    // Opt-in: the requested channel returns the items, separately.
    const opted = await compileCase(
      'ATM-DIAG-07',
      { logs: ['compiler'] } as unknown as Parameters<typeof compileCase>[1]
    )
    const compilerDiags = (
      opted as unknown as {
        compilerDiagnostics?: Array<{ code: string; message: string }>
      }
    ).compilerDiagnostics
    expect(
      compilerDiags,
      'compiler channel populates compilerDiagnostics when requested'
    ).toBeDefined()

    // Guard: the fixture must actually produce channel-family items, or the
    // isolation assertions below would pass vacuously. Reads the opt-in
    // channel (E8-class correction — the default must carry none).
    expect(
      compilerDiags!.some(d => isChannelItem(d.code)),
      'fixture produces no channel-family items to isolate'
    ).toBe(true)

    // DEFAULT-FIRST: the default channel carries none of them.
    const leaked = diagnostics.filter(d => isChannelItem(d.code ?? ''))
    expect(
      leaked,
      `channel items leaked onto default: ${leaked.map(d => d.code).join(', ')}`
    ).toHaveLength(0)

    // Additive-optional half of the Q2 ruling: the field is absent unless
    // the channel was requested.
    expect('compilerDiagnostics' in result).toBe(false)

    // The opt-in compile keeps its own default free of channel items.
    const optedLeaked = (opted.diagnostics ?? []).filter(d =>
      isChannelItem(d.code ?? '')
    )
    expect(
      optedLeaked,
      'opt-in compile keeps diagnostics free of channel items'
    ).toHaveLength(0)
  },
}

export default spec
