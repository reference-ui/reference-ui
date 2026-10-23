// Spec assembly for the fragment evaluator: it takes the collected buckets per collector, the config name, the
// static CSS and the upstream names, and emits the frozen EvaluatedSystemSpec with its provenance and the token
// shadow diagnostics. Every tokens, keyframes and globalCss fragment first passes the tree guard, so a cyclic or
// over-deep tree fails sync by name; upstream token fragments are then stripped of private keys before the merge.
import { relative } from 'node:path'
import type { EvaluatedSystemSpec, GlobalStyleNode } from '@reference-ui/rust/contracts'
import type { NativeDiagnostic } from '../../native/contract.ts'
import { CONFIG_FRAGMENT_SOURCE_PROPERTY, UPSTREAM_FRAGMENT_SOURCE } from '../constants.ts'
import {
  assertFragmentTree,
  type FragmentTreeSource,
  isPlainObject,
  mergeTokenTree,
  stripPrivateTokensDeep,
  tokenLeafPaths,
} from './merge.ts'
import { mergeTokenFragmentsWithShadows, tokenShadowDiagnostic } from './shadow.ts'

type SpecProvenance = EvaluatedSystemSpec['provenance']

export interface CollectedBucket {
  name: string
  fragments: unknown[]
}

/** The evaluated spec plus the sync warnings its merge raised (E13). */
export interface EvaluatedFragments {
  spec: EvaluatedSystemSpec
  diagnostics: NativeDiagnostic[]
}

/**
 * Strip `_private` from one collected token fragment when its source tag
 * names an upstream system. The gate is membership in the upstream name set
 * plus the unnamed-upstream fallback literal — local fragments pass through
 * untouched by reference. The stripped copy keeps the non-enumerable source
 * tag so provenance still cites the upstream. Mirrors the Rust
 * multi-spec boundary, which this single-script path never reaches.
 */
export function scopeUpstreamTokenFragment(
  fragment: unknown,
  upstreamNames: readonly string[]
): unknown {
  if (!isPlainObject(fragment)) return fragment
  const source = fragment[CONFIG_FRAGMENT_SOURCE_PROPERTY]
  if (typeof source !== 'string') return fragment
  if (source !== UPSTREAM_FRAGMENT_SOURCE && !upstreamNames.includes(source)) return fragment
  const stripped = stripPrivateTokensDeep(fragment)
  Object.defineProperty(stripped, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
    configurable: true,
    enumerable: false,
    value: source,
  })
  return stripped
}

// The collected buckets as one spec: the input the merge reads, named as a whole.
export interface SpecMergeInput {
  name: string
  cwd: string
  collected: CollectedBucket[]
  staticCss: Record<string, string[]>
  upstreamNames: readonly string[]
}

export function mergeCollectedSpec({
  name,
  cwd,
  collected,
  staticCss,
  upstreamNames,
}: SpecMergeInput): EvaluatedFragments {
  assertFragmentTrees(collected, cwd)
  const tokens = bucketByName(collected, 'tokens').map(fragment =>
    scopeUpstreamTokenFragment(fragment, upstreamNames)
  )
  const tokenMerge = mergeTokenFragmentsWithShadows(tokens, new Set(upstreamNames))
  const keyframes = bucketByName(collected, 'keyframes')
  const fonts = bucketByName(collected, 'font')
  const css = bucketByName(collected, 'globalCss')
  const recipes = bucketByName(collected, 'recipe')
  const mergedFonts = mergeFontRecord(fonts)
  const spec: EvaluatedSystemSpec = {
    schemaVersion: 1,
    profile: 'reference-ui',
    name,
    tokens: mergeTokenTree(tokenMerge.tree, buildFontWeightTokens(mergedFonts)),
    fonts: mergedFonts,
    globalCss: toGlobalCssEntries(css, cwd),
    keyframes: mergeRecordFragments(keyframes),
    recipes: mergeRecipeRecord(recipes),
    staticCss,
    provenance: [
      ...tokenProvenance(tokens, cwd),
      ...fontProvenance(fonts, cwd),
      ...keyframeProvenance(keyframes, cwd),
      ...globalCssProvenance(css, cwd),
      ...recipeProvenance(recipes, cwd),
    ],
  }
  return { spec, diagnostics: tokenMerge.shadows.map(tokenShadowDiagnostic) }
}

// The buckets whose fragments the recursive merge walks, with the call name each error line uses.
const GUARDED_BUCKETS: ReadonlyArray<[bucket: string, call: FragmentTreeSource['call']]> = [
  ['tokens', 'token'],
  ['keyframes', 'keyframes'],
  ['globalCss', 'globalCss'],
]

function assertFragmentTrees(collected: CollectedBucket[], cwd: string): void {
  for (const [bucket, call] of GUARDED_BUCKETS) {
    for (const fragment of bucketByName(collected, bucket)) {
      assertFragmentTree(fragment, { call, source: sourceOfFragment(fragment, cwd) })
    }
  }
}

function bucketByName(collected: CollectedBucket[], name: string): unknown[] {
  return collected.find(bucket => bucket.name === name)?.fragments ?? []
}

function sourceOfFragment(fragment: unknown, cwd: string): string {
  const raw = isPlainObject(fragment) ? fragment[CONFIG_FRAGMENT_SOURCE_PROPERTY] : undefined
  if (typeof raw !== 'string' || raw === '') return 'unknown fragment'
  const rel = relative(cwd, raw)
  if (rel === '' || rel.startsWith('..')) return raw
  return rel
}

function mergeRecordFragments(fragments: unknown[]): Record<string, unknown> {
  let merged: Record<string, unknown> = {}
  for (const fragment of fragments) {
    if (!isPlainObject(fragment)) continue
    merged = mergeTokenTree(merged, fragment)
  }
  return merged
}

function mergeFontRecord(fonts: unknown[]): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const fragment of fonts) {
    if (!isPlainObject(fragment) || typeof fragment.name !== 'string') continue
    const { name, ...rest } = fragment
    record[name] = rest
  }
  return record
}

function mergeRecipeRecord(recipes: unknown[]): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const fragment of recipes) {
    if (!isPlainObject(fragment) || typeof fragment.className !== 'string') continue
    record[fragment.className] = { ...fragment }
  }
  return record
}

// Font-weight tokens from the merged font record (retired reference-core `buildFontTokens`
// weights half). The fonts half stays engine-side (duplicate-path error).
function buildFontWeightTokens(fonts: Record<string, unknown>): Record<string, unknown> {
  const fontWeights: Record<string, unknown> = {}
  for (const [name, definition] of Object.entries(fonts)) {
    if (!isPlainObject(definition) || !isPlainObject(definition.weights)) continue
    const scoped = weightLeaves(definition.weights)
    if (Object.keys(scoped).length > 0) fontWeights[name] = scoped
  }
  return Object.keys(fontWeights).length > 0 ? { fontWeights } : {}
}

function weightLeaves(weights: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(weights).map(([leaf, value]) => [leaf, { value }]))
}

function toGlobalCssEntries(css: unknown[], cwd: string): EvaluatedSystemSpec['globalCss'] {
  const entries: EvaluatedSystemSpec['globalCss'] = []
  for (const fragment of css) {
    if (!isPlainObject(fragment)) continue
    entries.push({
      source: sourceOfFragment(fragment, cwd),
      rules: fragment as Record<string, GlobalStyleNode>,
    })
  }
  return entries
}

function tokenProvenance(tokens: unknown[], cwd: string): SpecProvenance {
  return tokens.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'tokens' as const,
    keys: isPlainObject(fragment) ? tokenLeafPaths(fragment) : [],
  }))
}

function fontProvenance(fonts: unknown[], cwd: string): SpecProvenance {
  return fonts.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'fonts' as const,
    keys:
      isPlainObject(fragment) && typeof fragment.name === 'string' ? [fragment.name] : [],
  }))
}

function keyframeProvenance(keyframes: unknown[], cwd: string): SpecProvenance {
  return keyframes.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'keyframes' as const,
    keys: isPlainObject(fragment) ? Object.keys(fragment) : [],
  }))
}

function globalCssProvenance(css: unknown[], cwd: string): SpecProvenance {
  return css.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'globalCss' as const,
  }))
}

function recipeProvenance(recipes: unknown[], cwd: string): SpecProvenance {
  return recipes.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'recipes' as const,
    keys:
      isPlainObject(fragment) && typeof fragment.className === 'string'
        ? [fragment.className]
        : [],
  }))
}
