/**
 * Channel-isolation station (ATM-DIAG-07, Operation Error Correct, Slice 0).
 * RED: the default channel must carry no dynamic, spread, harvest-sink, or
 * dead-branch diagnostics; those move to the opt-in `compilerDiagnostics`
 * channel (`logs: ['compiler']`, additive-optional per the Q2 ruling).
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

    // Guard: the fixture must actually produce channel-family items today,
    // otherwise the isolation assertion below would pass vacuously.
    expect(
      diagnostics.some(d => isChannelItem(d.code ?? '')),
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

    // Opt-in: the requested channel returns them, separately from userspace.
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
    expect(
      compilerDiags!.some(d => isChannelItem(d.code)),
      'compiler channel carries the dynamic/spread/harvest/dead-branch items'
    ).toBe(true)
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
