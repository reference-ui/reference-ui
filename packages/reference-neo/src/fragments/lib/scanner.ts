// Fragment file discovery over glob roots plus import or call signals.
// It takes scan options and emits absolute paths of matching source files.
// This module is a Neo-owned copy of the core fragment scanner.

import { readFileSync } from 'node:fs'
import { extname, relative, sep } from 'node:path'
import fg from 'fast-glob'
import type { ScanOptions } from './types.ts'

// Retention glob prunes only node_modules at traversal (the huge tree);
// the remaining native IGNORE dirs filter explicitly below so the mirror
// stays reviewable instead of trusting glob-pattern equivalence.
const RETENTION_EXCLUDE = ['**/node_modules/**']

// Native IGNORE dirs mirrored from sources.rs handle_dir_entry: paths with
// any relative DIRECTORY segment in this set never reach the engine.
const NATIVE_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'target',
  '.reference-ui',
  '.reference',
  '.pipeline',
])

// Engine-parsed extensions mirrored from sources.rs is_supported_extension:
// the final extension decides, so foo.d.ts (ext ts) is a source.
const SOURCE_EXTENSIONS = new Set(['tsx', 'ts', 'jsx', 'js'])

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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toArray(value?: string | string[]): string[] {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

interface DiscoveryPattern {
  pattern: RegExp
  /** Literal bytes every match contains; the includes pre-gate. */
  needle: string
}

function createImportPatterns(importFrom?: string | string[]): DiscoveryPattern[] {
  return toArray(importFrom).map((moduleId) => ({
    pattern: new RegExp(
      `\\bfrom\\s*['"]${escapeRegex(moduleId)}['"]|\\bimport\\s*['"]${escapeRegex(moduleId)}['"]`,
      'm',
    ),
    needle: moduleId,
  }))
}

function createFunctionPatterns(functionNames?: string[]): DiscoveryPattern[] {
  return (functionNames ?? []).map((name) => ({
    pattern: new RegExp(`\\b${name}\\s*\\(`),
    needle: name,
  }))
}

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
 * per file; matches cover every readable candidate with dot:false and the
 * *.d.ts exclusion emulated (exact old semantics), while retention is the
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

  // Retention glob: dotfiles included (dot:true), node_modules pruned.
  // fg.sync: the async walker regressed the warm-cache scan (GAPS-1).
  const candidates = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
    dot: true,
  })

  // Match-before-filter (GAPS-2): read every candidate, match over all
  // successes, retain the IGNORE/extension-filtered subset.
  const contents = await readAllOrdered(candidates)
  return splitScan(candidates, contents, cwd, discoveryPatterns)
}

// Split one ordered read into fragment matches plus retained sources:
// unreadable files drop; matches cover every readable candidate (dot:false
// + d.ts emulated, exact old semantics) while retention mirrors the native
// IGNORE-dir + extension gates (sources.rs) on the cwd-relative form.
function splitScan(
  candidates: string[],
  contents: (string | null)[],
  cwd: string,
  discoveryPatterns: DiscoveryPattern[]
): FragmentScan {
  const matches: string[] = []
  const scannedSources: ScannedSource[] = []
  for (let index = 0; index < candidates.length; index++) {
    const content = contents[index]
    if (content === null) {
      continue
    }
    const rel = relative(cwd, candidates[index])
    const matchable = !hasDotSegment(rel) && !isDeclarationFile(rel)
    if (matchable && matchesAnyPattern(content, discoveryPatterns)) {
      matches.push(candidates[index])
    }
    if (!hasIgnoredDir(rel) && hasSourceExtension(rel)) {
      scannedSources.push({ path: candidates[index], content })
    }
  }
  return { matches, scannedSources }
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
