// Fragment file discovery over glob roots plus import or call signals.
// It takes scan options and emits absolute paths of matching source files.

import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import fg from 'fast-glob'
import type { ScanOptions } from '../types.ts'
import { RETENTION_EXCLUDE } from '../../constants.ts'
import { candidateScanFlags, isMatchable, isRetainable, scanPrefixFor } from './classify.ts'

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
// enterprise scan ~+85ms, so this is the exact old sync read path.
async function readAllOrdered(files: string[]): Promise<(string | null)[]> {
  return files.map(file => readFileOrSkip(file))
}

function matchesAnyPattern(content: string, patterns: DiscoveryPattern[]): boolean {
  // A regex match implies the needle bytes, so needle-absent files skip
  // the regex with identical selection.
  return patterns.some(({ pattern, needle }) => content.includes(needle) && pattern.test(content))
}

/**
 * Find files that either import a target module or call one of the given functions.
 * Import-based discovery is preferred because it aligns with the public system API.
 *
 * @example
 * await scanForFragments({
 *   include: ['src/(glob).{ts,tsx}'],
 *   importFrom: '@reference-ui/core',
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
  // fg.sync: the async walker regressed the warm-cache scan.
  const candidates = fg.sync(include, {
    cwd,
    absolute: true,
    ignore: exclude,
    dot: true,
  })

  // Match-before-filter: read every candidate, match over the
  // JS-bundleable successes, retain the IGNORE/extension-filtered subset.
  const contents = await readAllOrdered(candidates)
  return splitScan({ candidates, contents, cwd, discoveryPatterns, mdxPatterns })
}

// Split one ordered read into fragment matches plus retained sources:
// unreadable files drop; matches cover every JS-bundleable candidate
// (dot:false + d.ts emulated) while retention mirrors the native
// IGNORE-dir + extension gates (sources.rs) on the cwd-relative form.
// `.mdx` candidates select with `mdxPatterns` over frontmatter/fence-stripped
// content; every other candidate keeps the frozen `discoveryPatterns` match.
export interface SplitScanInput {
  candidates: string[]
  contents: (string | null)[]
  cwd: string
  discoveryPatterns: DiscoveryPattern[]
  mdxPatterns: DiscoveryPattern[]
}

export function splitScan(input: SplitScanInput): FragmentScan {
  const { candidates, contents, cwd, discoveryPatterns, mdxPatterns } = input
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
    const flags = candidateScanFlags(candidate, cwd, prefix)
    if (isMatchable(flags) && matchesCandidate(candidate, content, discoveryPatterns, mdxPatterns)) {
      matches.push(candidate)
    }
    if (isRetainable(flags)) {
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
 *   importFrom: '@reference-ui/core',
 * })
 */
export async function scanForFragments(options: ScanOptions): Promise<string[]> {
  return (await scanFragmentSources(options)).matches
}
