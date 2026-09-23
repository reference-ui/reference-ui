// Native single-read scan for fragment discovery (F1 B'': C3-in-reverse).
// It takes scan options and emits matches plus a retention ref; bytes stay native.
// fg still enumerates, Rust reads plus gates plus retains, and the verbatim T1
// splitScan confirms the needle-hits, so match order and selection never drift.

import { sep } from 'node:path'
import fg from 'fast-glob'
import {
  RETENTION_EXCLUDE,
  createFunctionPatterns,
  createImportPatterns,
  scanFragmentSources,
  splitScan,
  type DiscoveryPattern,
  type ScannedSource,
} from './scanner.ts'
import type { ScanOptions } from './types.ts'

/**
 * Native retention ref: the compile token, or the TS-fallback bytes when the
 * addon is unavailable. Exactly one carries the bytes; count covers both.
 */
export interface NativeScanRetention {
  token?: number
  count: number
  files?: ScannedSource[]
}

/** Single-scan result: fragment matches plus the retention ref. */
export interface FragmentScanNative {
  matches: string[]
  retention: NativeScanRetention
}

// Structural scan boundary (mirrors sync/native.ts): the rs dist type entries
// cannot resolve named exports under NodeNext, so the seam describes the call
// shape locally and imports the runtime dynamically.
interface NativeScanRequest {
  paths: string[]
  needles: string[]
  cwd: string
  sep: string
  retain: boolean
}

interface NativeScanResponse {
  hits: ScannedSource[]
  retentionToken?: number
  retainedCount: number
}

interface NativeScanModule {
  scan(request: NativeScanRequest): Promise<NativeScanResponse>
}

// Escape hatch for A/B and outages: '0' forces the TS scan path.
const SCAN_NATIVE_ENV = 'REFERENCE_UI_SCAN_NATIVE'

function scanNativeEnabled(): boolean {
  return (process.env[SCAN_NATIVE_ENV] ?? '1') !== '0'
}

async function loadScanModule(): Promise<NativeScanModule | null> {
  if (!scanNativeEnabled()) return null
  try {
    const mod = (await import('@reference-ui/rust/atomic')) as unknown as Partial<NativeScanModule>
    return typeof mod.scan === 'function' ? (mod as NativeScanModule) : null
  } catch {
    return null
  }
}

// Mirror of the discovery selection in scanFragmentSources (import-first): the
// needle union and the confirm regexes derive from one pattern set, so the
// pre-gate can never drift from the set it pre-gates. Parity-tested.
function discoveryPatternsOf(options: ScanOptions): DiscoveryPattern[] {
  const imports = createImportPatterns(options.importFrom)
  const patterns = imports.length > 0 ? imports : createFunctionPatterns(options.functionNames)
  if (patterns.length === 0) {
    throw new Error('scanForFragments: provide importFrom or functionNames')
  }
  return patterns
}

async function scanNative(options: ScanOptions, retain: boolean): Promise<FragmentScanNative> {
  const { include, exclude = RETENTION_EXCLUDE, cwd = process.cwd() } = options
  const patterns = discoveryPatternsOf(options)
  // Retention glob: dotfiles included (dot:true), node_modules pruned.
  // fg.sync: the async walker regressed the warm-cache scan (GAPS-1).
  const candidates = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
    dot: true,
  })
  const native = await loadScanModule()
  if (native === null) {
    // Rare path (no addon, or the hatch forced TS): the full TS scan, which
    // re-enumerates; retention rides `files`, exactly as before the diet.
    const fallback = await scanFragmentSources(options)
    return {
      matches: fallback.matches,
      retention: { count: fallback.scannedSources.length, files: fallback.scannedSources },
    }
  }
  const response = await native.scan({
    paths: candidates,
    needles: patterns.map(pattern => pattern.needle),
    cwd,
    sep,
    retain,
  })
  // Hit-only confirm through the verbatim T1 splitScan: misses contribute no
  // matches (a regex match implies the needle bytes), and the scannedSources
  // part is discarded (retention lives native-side behind the token).
  const { matches } = splitScan(
    response.hits.map(hit => hit.path),
    response.hits.map(hit => hit.content),
    cwd,
    patterns
  )
  const retention: NativeScanRetention = retain
    ? { token: response.retentionToken, count: response.retainedCount }
    : { count: 0 }
  return { matches, retention }
}

/**
 * Single native scan over the include globs: fragment matches plus the
 * retained compile set behind a token (C3-in-reverse). Falls back to the TS
 * scan when the addon is unavailable; retention then rides `files`.
 */
export async function scanFragmentSourcesNative(options: ScanOptions): Promise<FragmentScanNative> {
  return scanNative(options, true)
}

/**
 * Matches-only native scan: reads plus needle-gates run, hits confirm, and
 * nothing retains (no token, no leak). Parity with scanForFragments.
 */
export async function scanForFragmentsNative(options: ScanOptions): Promise<string[]> {
  return (await scanNative(options, false)).matches
}
