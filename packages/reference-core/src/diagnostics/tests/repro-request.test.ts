// Request-level repro suite: codes no authored fixture can raise alone.
// It takes hand-mutated compile requests and emits the engine's real
// diagnostics for host, spec, and retention failures. Each test pins one
// error code with its severity through native compile, like the row suite.
import { describe, expect, it } from 'vitest'
import { compileNative } from '../../native/compile.ts'
import type { NativeDiagnostic } from '../../native/contract.ts'
import { releaseScanRetention } from '../../native/retention.ts'
import { prepareCustomWorld, useReproCleanup } from './repro-world.ts'

useReproCleanup()

function errorsFor(entries: NativeDiagnostic[], code: string): NativeDiagnostic[] {
  const found = entries.filter(entry => entry.code === code)
  expect(found.length).toBeGreaterThan(0)
  for (const entry of found) {
    expect(entry.severity).toBe('error')
    expect(entry.message.trim().length).toBeGreaterThan(0)
  }
  return found
}

describe('diagnostic request repro', () => {
  it('ATM-E-CONFLICTING-SCAN-INPUTS reproduces when files meet a live token', async () => {
    const world = await prepareCustomWorld({})
    try {
      if (world.prepared.retentionToken === undefined) {
        throw new Error('native retention unavailable: cannot stage conflicting scan inputs')
      }
      world.request.files = [{ path: 'theme/tokens.ts', content: 'export {}\n' }]
      world.request.retentionToken = world.prepared.retentionToken
      const result = await compileNative(world.request)
      errorsFor(result.diagnostics, 'ATM-E-CONFLICTING-SCAN-INPUTS')
    } finally {
      await releaseScanRetention(world.prepared.retentionToken)
    }
  })

  it('ATM-E-MISSING-HOST-GRAPH reproduces when no hosts are resolvable', async () => {
    const world = await prepareCustomWorld({
      // No imports on purpose: any component import would populate the
      // file-local host set and the graph would no longer read as missing.
      'theme/host.tsx': ['export const el = <div color="red" />', ''].join('\n'),
    })
    try {
      world.request.jsxHosts = []
      const result = await compileNative(world.request)
      errorsFor(result.diagnostics, 'ATM-E-MISSING-HOST-GRAPH')
    } finally {
      await releaseScanRetention(world.prepared.retentionToken)
    }
  })

  it('ATM-E-INVALID-BASE-SYSTEM reproduces on a spec that fails validation', async () => {
    const world = await prepareCustomWorld({})
    try {
      world.request.spec = { ...world.request.spec, name: '' }
      const result = await compileNative(world.request)
      errorsFor(result.diagnostics, 'ATM-E-INVALID-BASE-SYSTEM')
    } finally {
      await releaseScanRetention(world.prepared.retentionToken)
    }
  })

  it('ATM-E-UNKNOWN-RETENTION-TOKEN reproduces on a never-minted token', async () => {
    const world = await prepareCustomWorld({})
    try {
      world.request.retentionToken = 999_999_999_999
      const result = await compileNative(world.request)
      errorsFor(result.diagnostics, 'ATM-E-UNKNOWN-RETENTION-TOKEN')
    } finally {
      await releaseScanRetention(world.prepared.retentionToken)
    }
  })

  it('ATM-E-DRAINED-RETENTION-TOKEN reproduces when a token compiles twice', async () => {
    const world = await prepareCustomWorld({})
    try {
      if (world.prepared.retentionToken === undefined) {
        throw new Error('native retention unavailable: cannot stage a drained token')
      }
      world.request.retentionToken = world.prepared.retentionToken
      await compileNative(world.request)
      world.request.retentionToken = world.prepared.retentionToken
      const result = await compileNative(world.request)
      errorsFor(result.diagnostics, 'ATM-E-DRAINED-RETENTION-TOKEN')
    } finally {
      await releaseScanRetention(world.prepared.retentionToken)
    }
  })
})
