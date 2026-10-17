// Path classification for fragment discovery: it takes a candidate's absolute path plus the scan cwd and emits
// matchable and retainable decision flags. The fused suffix walk and the exact relative() fallback share one
// selection, so the fast path and the fallback cannot disagree. Flags stay plain integers, so the hot scan loop
// allocates nothing per candidate.
import { extname, relative, resolve, sep } from 'node:path'
import { FRAGMENT_EXTENSIONS, NATIVE_IGNORE_DIRS, SOURCE_EXTENSIONS } from '../../constants.ts'

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
export function scanPrefixFor(cwd: string): string {
  const resolved = resolve(cwd)
  return resolved === sep ? sep : resolved + sep
}

/** Whether a candidate's flags admit it to the fragment match set. */
export function isMatchable(flags: number): boolean {
  return (flags & MATCHABLE_FLAG) !== 0
}

/** Whether a candidate's flags admit it to the retained compile set. */
export function isRetainable(flags: number): boolean {
  return (flags & RETAINABLE_FLAG) !== 0
}

/**
 * Decision flags for one candidate under cwd. The prefix is scanPrefixFor(cwd), computed once per scan,
 * so the common case is a single prefix strip with no resolve() per file.
 */
export function candidateScanFlags(candidate: string, cwd: string, prefix: string): number {
  const stripped = candidate.startsWith(prefix) ? classifyScanSuffix(candidate, prefix.length) : SUFFIX_ANOMALY
  return stripped === SUFFIX_ANOMALY ? fallbackScanFlags(cwd, candidate) : stripped
}
