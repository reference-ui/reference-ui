// Native retention protocol: the live scan bytes between scan and compile.
// It takes the request plus the scan-product refs and emits the attach,
// drop, and release transitions the recipe calls around the compile drain.
// The bytes themselves stay engine-side; only the token crosses here.

import type { NativeSourceFile, ScopedCompileRequest } from './contract.ts'

/**
 * The scan-product refs the retention protocol reads and clears. Structural
 * on purpose: the prepared scan satisfies it without native importing the
 * collector, so the seam stays a leaf.
 */
export interface ScanRetentionRefs {
  scannedSources: NativeSourceFile[]
  retentionToken?: number
}

interface AtomicReleaseModule {
  releaseScan(request: { retentionToken: number }): Promise<{ released: boolean }>
}

/**
 * Release a live scan retention without draining. Error-path-only: the sync
 * `finally` between scan and compile; never on the happy path.
 */
export async function releaseRetention(token: number): Promise<{ released: boolean }> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicReleaseModule
  return atomic.releaseScan({ retentionToken: token })
}

/**
 * Attach exactly one scan source to the request: the live retention token
 * when the scan retained bytes, else the in-memory files on the TS fallback,
 * else neither and the engine falls back to the disk scan.
 */
export function attachScanRetention(request: ScopedCompileRequest, refs: ScanRetentionRefs): void {
  if (refs.retentionToken !== undefined) request.retentionToken = refs.retentionToken
  else if (refs.scannedSources.length > 0) request.files = refs.scannedSources
}

/**
 * Clear the consumed scan refs after the compile drain. The engine already
 * holds what it needs, so every ref drops here and a mid-publish GC can
 * reclaim the headroom.
 */
export function dropScanRetention(request: ScopedCompileRequest, refs: ScanRetentionRefs): void {
  refs.scannedSources = []
  refs.retentionToken = undefined
  request.files = undefined
  request.retentionToken = undefined
}

/**
 * Release a scan retention that never drained. Best-effort and never throws,
 * so the recipe's `finally` can call it without masking the in-flight error.
 */
export async function releaseScanRetention(retentionToken: number | undefined): Promise<void> {
  if (retentionToken === undefined) return
  try {
    await releaseRetention(retentionToken)
  } catch {
    // Best-effort: never mask the in-flight error.
  }
}
