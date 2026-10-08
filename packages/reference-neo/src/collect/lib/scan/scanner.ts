// Fragment file discovery over glob roots plus import or call signals.
// It takes scan options and emits absolute paths of matching source files.
// This module is a Neo-owned copy of the core fragment scanner.

import { readFileSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import fg from 'fast-glob'
import type { ScanOptions } from '../types.ts'
import {
  FRAGMENT_EXTENSIONS,
  NATIVE_IGNORE_DIRS,
  RETENTION_EXCLUDE,
  SOURCE_EXTENSIONS,
} from '../../constants.ts'

export { RETENTION_EXCLUDE }

/** One retained source: absolute path plus the bytes native compiles. */
export interface ScannedSource {
  path: string
  content: string
}

/** Single-scan result: fragment matches plus the retained compile set. */
export interface FragmentScan {
  matches: string[]
  scannedSources: ScannedSource[]
}

// Re-exported so native.ts and the tests keep one discovery surface: the
// frozen global patterns, the MDX-scoped matcher, and the pattern types.
import {
  createFunctionPatterns,
  createImportPatterns,
  type DiscoveryPattern,
} from './patterns.ts'
import { createMdxImportPatterns, stripMdxNoise } from './mdx.ts'

export { createFunctionPatterns, createImportPatterns, createMdxImportPatterns, stripMdxNoise }
export type { DiscoveryPattern }

function readFileOrSkip(file: string): string | null {
  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}

// Serial in-order reads: the 64-worker pool regressed the warm-cache
// enterprise scan ~+85ms (GAPS-1), so this is the exact old sync read path.
async function readAllOrdered(files: string[]): Promise<(string | null)[]> {
  return files.map(file => readFileOrSkip(file))
}

function matchesAnyPattern(content: string, patterns: DiscoveryPattern[]): boolean {
  // A regex match implies the needle bytes, so needle-absent files skip
  // the regex with identical selection.
  return patterns.some(({ pattern, needle }) => content.includes(needle) && pattern.test(content))
}

// Directory segments of the cwd-relative form: every segment but the file
// name, so a FILE named `dist` stays (native tests is_dir, not the name).
function dirSegmentsOf(relativePath: string): string[] {
  return relativePath.split(sep).slice(0, -1)
}

// True when an ancestor directory is engine-ignored (sources.rs mirror).
function hasIgnoredDir(relativePath: string): boolean {
  return dirSegmentsOf(relativePath).some(segment => NATIVE_IGNORE_DIRS.has(segment))
}

// True for engine-parsed extensions; the final extension decides (mirror).
function hasSourceExtension(relativePath: string): boolean {
  return SOURCE_EXTENSIONS.has(extname(relativePath).slice(1))
}

// True for fragment-candidate extensions; the final extension decides.
// Matches feed the esbuild fragment bundler, so only JS-bundleable files can
// ever match — `.mdx` matches because a loader exists, never `.json`/`.css`.
function hasFragmentExtension(relativePath: string): boolean {
  return FRAGMENT_EXTENSIONS.has(extname(relativePath).slice(1))
}

// Emulates fg dot:false for matches on the cwd-relative form: any REAL
// segment starting with `.` drops. `.`/`..` are relative-form artifacts
// of hits outside cwd, never dotfiles, so they never drop.
function hasDotSegment(relativePath: string): boolean {
  return relativePath
    .split(sep)
    .some(segment => segment !== '.' && segment !== '..' && segment.startsWith('.'))
}

// Matches keep the historical `**/*.d.ts` glob exclusion as a basename rule.
function isDeclarationFile(relativePath: string): boolean {
  return relativePath.endsWith('.d.ts')
}

// Suffix-walk decision flags: one fused pass reports both gates at once.
const MATCHABLE_FLAG = 1
const RETAINABLE_FLAG = 2
// The stripped suffix is not a clean relative form (empty, `.`, `..`, or an
// empty segment), so the absolute path was never normalized and the caller
// falls back to the exact old relative()+helpers path instead of the strip.
const SUFFIX_ANOMALY = -1

// Segment-head classes for the fused walk: dot-leading, plain, anomalous.
const SEGMENT_PLAIN = 0
const SEGMENT_DOT = 1

// Manual-compare table derived from the gate Set: the Set stays the single
// source of truth; the fused walk reads this without allocating slices.
const NATIVE_IGNORE_LIST: readonly string[] = [...NATIVE_IGNORE_DIRS]

function segmentHeadOf(value: string, start: number, end: number): number {
  const length = end - start
  if (length === 0) {
    return SUFFIX_ANOMALY
  }
  if (value[start] !== '.') {
    return SEGMENT_PLAIN
  }
  if (length === 1) {
    return SUFFIX_ANOMALY
  }
  if (length === 2 && value[start + 1] === '.') {
    return SUFFIX_ANOMALY
  }
  return SEGMENT_DOT
}

// True when value[start:end] is an engine-ignored directory name (mirror).
function isIgnoredSegment(value: string, start: number, end: number): boolean {
  const length = end - start
  for (const candidate of NATIVE_IGNORE_LIST) {
    if (candidate.length !== length) {
      continue
    }
    let match = true
    for (let index = 0; index < length; index++) {
      if (value[start + index] !== candidate[index]) {
        match = false
        break
      }
    }
    if (match) {
      return true
    }
  }
  return false
}

// True when the final segment's last dot names a member of extensions: the
// last dot strictly inside the segment decides, exactly like
// extname().slice(1). Both gates share the walk; only the set differs.
function hasExtensionTail(
  value: string,
  start: number,
  end: number,
  extensions: ReadonlySet<string>
): boolean {
  for (let index = end - 1; index >= start; index--) {
    if (value[index] !== '.') {
      continue
    }
    return index > start && extensions.has(value.slice(index + 1, end))
  }
  return false
}

// True when the final segment ends with `.d.ts`: the rule holds no separator
// and the suffix has no trailing one, so this equals endsWith on the form.
function isDeclarationTail(value: string, start: number, end: number): boolean {
  return end - start >= 5 && value.endsWith('.d.ts', end)
}

// One fused pass over absolutePath[start:]: dot/ignore gates plus the final
// extension and declaration tail, or SUFFIX_ANOMALY for unclean suffixes.
function classifyScanSuffix(absolutePath: string, start: number): number {
  let hasDot = false
  let hasIgnore = false
  let hasExt = false
  let hasFragExt = false
  let isDts = false
  const length = absolutePath.length
  if (start >= length) {
    return SUFFIX_ANOMALY
  }
  let segmentStart = start
  for (;;) {
    let index = absolutePath.indexOf(sep, segmentStart)
    if (index === -1) {
      index = length
    }
    const head = segmentHeadOf(absolutePath, segmentStart, index)
    if (head === SUFFIX_ANOMALY) {
      return SUFFIX_ANOMALY
    }
    if (head === SEGMENT_DOT) {
      hasDot = true
    }
    if (index === length) {
      hasExt = hasExtensionTail(absolutePath, segmentStart, index, SOURCE_EXTENSIONS)
      hasFragExt = hasExtensionTail(absolutePath, segmentStart, index, FRAGMENT_EXTENSIONS)
      isDts = isDeclarationTail(absolutePath, segmentStart, index)
      break
    }
    if (isIgnoredSegment(absolutePath, segmentStart, index)) {
      hasIgnore = true
    }
    segmentStart = index + 1
  }
  return scanFlagsOf({ hasDot, hasIgnore, hasExt, hasFragExt, isDts })
}

// Classified suffix gates: dot/ignore presence plus final-segment tails.
interface SuffixGates {
  hasDot: boolean
  hasIgnore: boolean
  hasExt: boolean
  hasFragExt: boolean
  isDts: boolean
}

// Combine one gate set into decision flags. Both suffix paths share this,
// so the fast walk and the fallback cannot disagree on selection.
function scanFlagsOf(gates: SuffixGates): number {
  const matchable = !gates.hasDot && !gates.isDts && gates.hasFragExt
  const retainable = !gates.hasIgnore && gates.hasExt
  return (matchable ? MATCHABLE_FLAG : 0) | (retainable ? RETAINABLE_FLAG : 0)
}

// Exact old identity path for out-of-cwd hits and unnormalized spellings:
// relative() plus the split/extname helpers, with identical selection.
function fallbackScanFlags(cwd: string, candidate: string): number {
  const rel = relative(cwd, candidate)
  return scanFlagsOf({
    hasDot: hasDotSegment(rel),
    hasIgnore: hasIgnoredDir(rel),
    hasExt: hasSourceExtension(rel),
    hasFragExt: hasFragmentExtension(rel),
    isDts: isDeclarationFile(rel),
  })
}

// The resolved `cwd + sep` prefix: candidates joined lexically under cwd
// strip to their relative form by slicing it off (root keeps bare `/`).
function scanPrefixFor(cwd: string): string {
  const resolved = resolve(cwd)
  return resolved === sep ? sep : resolved + sep
}

/**
 * Find files that either import a target module or call one of the given functions.
 * Import-based discovery is preferred because it aligns with the public system API.
 *
 * @example
 * await scanForFragments({
 *   include: ['src/(glob).{ts,tsx}'],
 *   importFrom: '@reference-ui/neo',
 * })
 */
/**
 * Single scan over the include globs: fragment matches plus the retained
 * compile set the engine would scan itself (dotfiles and d.ts included,
 * IGNORE dirs and non-source extensions mirrored out). One glob, one read
 * per file; matches cover every JS-bundleable candidate with dot:false and
 * the *.d.ts exclusion emulated, while retention is the
 * IGNORE/extension-filtered subset.
 */
export async function scanFragmentSources(options: ScanOptions): Promise<FragmentScan> {
  const {
    include,
    functionNames,
    importFrom,
    exclude = RETENTION_EXCLUDE,
    cwd = process.cwd(),
  } = options

  const importPatterns = createImportPatterns(importFrom)
  const functionPatterns = createFunctionPatterns(functionNames)
  const discoveryPatterns = importPatterns.length > 0 ? importPatterns : functionPatterns

  if (discoveryPatterns.length === 0) {
    throw new Error('scanForFragments: provide importFrom or functionNames')
  }

  // MDX candidates select with their own anchored matcher over stripped
  // content; function-name discovery leaves this empty, so `.mdx` never
  // matches a bare function name (see splitScan).
  const mdxPatterns = createMdxImportPatterns(importFrom)

  // Retention glob: dotfiles included (dot:true), node_modules pruned.
  // fg.sync: the async walker regressed the warm-cache scan (GAPS-1).
  const candidates = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
    dot: true,
  })

  // Match-before-filter (GAPS-2): read every candidate, match over the
  // JS-bundleable successes, retain the IGNORE/extension-filtered subset.
  const contents = await readAllOrdered(candidates)
  return splitScan(candidates, contents, cwd, discoveryPatterns, mdxPatterns)
}

// Split one ordered read into fragment matches plus retained sources:
// unreadable files drop; matches cover every JS-bundleable candidate
// (dot:false + d.ts emulated) while retention mirrors the native
// IGNORE-dir + extension gates (sources.rs) on the cwd-relative form.
// `.mdx` candidates select with `mdxPatterns` over frontmatter/fence-stripped
// content; every other candidate keeps the frozen `discoveryPatterns` match.
export function splitScan(
  candidates: string[],
  contents: (string | null)[],
  cwd: string,
  discoveryPatterns: DiscoveryPattern[],
  mdxPatterns: DiscoveryPattern[]
): FragmentScan {
  const matches: string[] = []
  const scannedSources: ScannedSource[] = []
  // Prefix-strip fast path: fg joins candidates lexically under cwd, so the
  // relative form is the absolute path minus one prefix — no resolve(), no
  // normalize(), no splits, no rel string. Out-of-cwd hits and unnormalized
  // spellings fall back to the exact old path with identical selection.
  const prefix = scanPrefixFor(cwd)
  for (let index = 0; index < candidates.length; index++) {
    const content = contents[index]
    if (content === null) {
      continue
    }
    const candidate = candidates[index]
    const stripped = candidate.startsWith(prefix)
      ? classifyScanSuffix(candidate, prefix.length)
      : SUFFIX_ANOMALY
    const flags = stripped === SUFFIX_ANOMALY
      ? fallbackScanFlags(cwd, candidate)
      : stripped
    const matchable = (flags & MATCHABLE_FLAG) !== 0
    const retainable = (flags & RETAINABLE_FLAG) !== 0
    if (matchable && matchesCandidate(candidate, content, discoveryPatterns, mdxPatterns)) {
      matches.push(candidate)
    }
    if (retainable) {
      scannedSources.push({ path: candidate, content })
    }
  }
  return { matches, scannedSources }
}

// MDX selects only through the anchored matcher over stripped content; every
// other JS-bundleable candidate keeps the exact old discovery match. Either
// path first checks the needle bytes (a regex match implies them), so files
// without the module id skip the regex.
function matchesCandidate(
  candidate: string,
  content: string,
  discoveryPatterns: DiscoveryPattern[],
  mdxPatterns: DiscoveryPattern[]
): boolean {
  if (extname(candidate) === '.mdx') {
    return mdxPatterns.length > 0 && matchesAnyPattern(stripMdxNoise(content), mdxPatterns)
  }
  return matchesAnyPattern(content, discoveryPatterns)
}

/**
 * Find files that either import a target module or call one of the given functions.
 * Import-based discovery is preferred because it aligns with the public system API.
 *
 * @example
 * await scanForFragments({
 *   include: ['src/(glob).{ts,tsx}'],
 *   importFrom: '@reference-ui/neo',
 * })
 */
export async function scanForFragments(options: ScanOptions): Promise<string[]> {
  return (await scanFragmentSources(options)).matches
}
