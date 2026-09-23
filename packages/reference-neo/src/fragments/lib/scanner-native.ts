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
  walkComplete: boolean
  include: string[]
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

// Walk-completeness subset: the include shapes where fg enumeration provably
// covers every file the native scope matches, so compile may skip its union
// backfill walk. Anything outside the subset keeps the walk: rejection is
// always correct, assertion is the claim the differential battery proves.
function hasWalkableChars(body: string): boolean {
  return (
    !body.includes('(') &&
    !body.includes(')') &&
    !body.includes('|') &&
    !body.includes('\\') &&
    !body.includes('[:')
  )
}

// Globstars agree only as whole segments (`**/`, `/**/`); adjacent or tripled
// stars cross directories natively while fg reads them as plain stars.
function hasWalkStarSegments(body: string): boolean {
  if (body.includes('***')) return false
  return body.split('/').every(segment => !segment.includes('**') || segment === '**')
}

// Brace ranges (`{1..3}`) expand in fg but stay literal natively, so `..`
// inside braces rejects. Dot segments outside braces over-enumerate in fg,
// which is the safe direction.
function hasNoBraceRanges(body: string): boolean {
  let depth = 0
  for (let index = 0; index < body.length; index++) {
    if (body[index] === '{') depth++
    else if (body[index] === '}') depth = Math.max(0, depth - 1)
    else if (body[index] === '.' && body[index + 1] === '.' && depth > 0) return false
  }
  return true
}

// A lone `{` matches literally natively but matches nothing in fg, so every
// opener needs a later closer. A lone `}` stays literal on both sides.
function hasClosedWalkBraces(body: string): boolean {
  let seenClose = false
  for (let index = body.length - 1; index >= 0; index--) {
    if (body[index] === '}') seenClose = true
    else if (body[index] === '{' && !seenClose) return false
  }
  return true
}

// One leading `!` negates on both sides; a second mark is double-negation in
// fg but a literal mark natively. Returns null when negation disagrees.
function stripWalkNegation(pattern: string): string | null {
  if (!pattern.startsWith('!')) return pattern
  const body = pattern.slice(1)
  return body.startsWith('!') ? null : body
}

function isCompleteWalkPattern(pattern: string): boolean {
  if (pattern.startsWith('/') || pattern.endsWith('/')) return false
  const body = stripWalkNegation(pattern)
  if (body === null) return false
  return (
    hasWalkableChars(body) &&
    hasWalkStarSegments(body) &&
    hasNoBraceRanges(body) &&
    hasClosedWalkBraces(body)
  )
}

// Traversal prunes agree only when nothing extra leaves: the default
// node_modules prune (which the native walk skips too) or no prune at all.
function isDefaultWalkExclude(exclude: string[]): boolean {
  if (exclude.length === 0) return true
  return (
    exclude.length === RETENTION_EXCLUDE.length &&
    exclude.every((pattern, index) => pattern === RETENTION_EXCLUDE[index])
  )
}

/**
 * True when this enumeration covered every in-scope path: at least one
 * positive glob, every pattern inside the agreed subset, and no custom
 * traversal prune. Compile trusts this to skip its backfill walk only when
 * its own scope and root still match the scan's.
 */
export function isCompleteWalkInclude(include: string[], exclude: string[]): boolean {
  if (include.length === 0) return false
  if (!isDefaultWalkExclude(exclude)) return false
  let positive = false
  for (const pattern of include) {
    if (!pattern.startsWith('!')) positive = true
    if (!isCompleteWalkPattern(pattern)) return false
  }
  return positive
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
    walkComplete: isCompleteWalkInclude(include, exclude),
    include,
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
