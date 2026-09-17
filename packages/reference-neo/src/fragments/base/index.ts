// Scan, bundle, and evaluate-once runner for Neo fragments.
// It takes a project root plus config and emits the evaluated system spec.
// This module copies the core base flow and replaces config output with spec output.

import { randomBytes } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { EvaluatedSystemSpec, GlobalStyleNode } from '@reference-ui/rust/contracts'
import type { BaseSystem, ReferenceUIConfig } from '../../config/types.ts'
import {
  bundleFragments,
  scanForFragments,
  CONFIG_FRAGMENT_SOURCE_PROPERTY,
  type FragmentBundle,
} from '../lib/index.ts'
import { getOutDirPath } from '../../lib/paths/index.ts'
import { createKeyframesCollector } from '../api/keyframes.ts'
import { createTokensCollector } from '../api/tokens.ts'
import { createFontCollector } from '../api/font.ts'
import { createGlobalCssCollector } from '../api/globalCss.ts'
import { createBoxPatternCollector } from '../api/patterns.ts'
import { getFragmentBootstrapImportMap } from './bootstrap-import-map.ts'
import { isPlainObject, mergeFragmentObjects, tokenLeafPaths } from './merge.ts'

// Fragment bundles are plain IIFEs. This global tells collector calls which
// source file is currently executing so diagnostics can point back to filenames.
const CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY = '__refCurrentFragmentSource'

type SpecProvenance = EvaluatedSystemSpec['provenance']

interface EvaluateCollector {
  config: { name: string; targetFunction?: string; globalKey: string }
  init: () => void
  getFragments: () => unknown[]
  cleanup: () => void
  toScript: () => string
  toRuntimeFunction: () => string
}

export interface PreparedFragments {
  upstreamFragments: string[]
  localFragmentBundles: FragmentBundle[]
}

interface CollectedBucket {
  name: string
  fragments: unknown[]
}

export function getUpstreamFragments(systems: BaseSystem[] | undefined): string[] {
  return (systems ?? [])
    .map(system => system.fragment)
    .filter(
      (fragment): fragment is string =>
        typeof fragment === 'string' && fragment.trim().length > 0
    )
}

function getUpstreamFragmentNames(systems: BaseSystem[] | undefined): string[] {
  return (systems ?? [])
    .filter(
      (system): system is BaseSystem & { fragment: string } =>
        typeof system.fragment === 'string' && system.fragment.trim().length > 0
    )
    .map(system => system.name)
}

export function scanFragmentFiles(cwd: string, config: ReferenceUIConfig): string[] {
  return scanForFragments({
    include: config.include,
    importFrom: [
      '@reference-ui/neo',
      '@reference-ui/neo/config',
      '@reference-ui/system',
      '@reference-ui/core/config',
      '@reference-ui/cli/config',
    ],
    cwd,
  })
}

export function getFragmentCollectors(): EvaluateCollector[] {
  return [
    createTokensCollector(),
    createKeyframesCollector(),
    createFontCollector(),
    createGlobalCssCollector(),
    createBoxPatternCollector(),
  ]
}

export async function prepareFragments(
  cwd: string,
  config: ReferenceUIConfig
): Promise<PreparedFragments> {
  const fragmentFiles = scanFragmentFiles(cwd, config)
  const localFragmentBundles = await bundleFragments({
    files: fragmentFiles,
    alias: getFragmentBootstrapImportMap(),
  })

  return {
    upstreamFragments: getUpstreamFragments(config.extends),
    localFragmentBundles,
  }
}

export function createPortableFragmentBundle(
  prepared: PreparedFragments
): string {
  return [
    ...prepared.upstreamFragments,
    ...prepared.localFragmentBundles.map(({ bundle }) => bundle),
  ]
    .map(bundle => `;${bundle}`)
    .join('\n')
}

/**
 * Evaluate fragments once in Node and merge the collected calls into the
 * frozen spec shape. Upstream bundles run first with the globalCss collector
 * suppressed (upstream global CSS already ships in upstream stylesheets).
 */
export async function evaluateFragments(
  cwd: string,
  config: ReferenceUIConfig
): Promise<EvaluatedSystemSpec> {
  const prepared = await prepareFragments(cwd, config)
  return evaluatePreparedFragments(cwd, config, prepared)
}

/**
 * Evaluate already-prepared fragments once in Node and merge the collected
 * calls into the frozen spec shape. Sync uses this to avoid scanning and
 * bundling twice when it also needs the portable fragment bundle.
 */
export async function evaluatePreparedFragments(
  cwd: string,
  config: ReferenceUIConfig,
  prepared: PreparedFragments
): Promise<EvaluatedSystemSpec> {
  const collectors = getFragmentCollectors()
  const script = createEvaluationScript(
    collectors,
    prepared,
    getUpstreamFragmentNames(config.extends)
  )
  const collected = await executeEvaluationScript(cwd, collectors, script)
  return mergeCollectedSpec(config.name, cwd, collected, config.staticCss ?? {})
}

function isGlobalCssCollector(functionName: string | undefined, name: string): boolean {
  return functionName === 'globalCss' || name === 'globalCss'
}

function getGlobalCssCollector(collectors: EvaluateCollector[]) {
  return collectors.find(collector =>
    isGlobalCssCollector(collector.config.targetFunction, collector.config.name)
  )
}

function createCollectorRuntimeScript(collectors: EvaluateCollector[]): string {
  return collectors
    .flatMap(collector => [collector.toScript(), collector.toRuntimeFunction()])
    .join('\n')
}

function disableCollectorScript(collector: EvaluateCollector | undefined): string {
  return collector ? `globalThis['${collector.config.globalKey}'] = undefined` : ''
}

function restoreCollectorScript(collector: EvaluateCollector | undefined): string {
  return collector ? `globalThis['${collector.config.globalKey}'] = []` : ''
}

function createEvaluationScript(
  collectors: EvaluateCollector[],
  prepared: PreparedFragments,
  upstreamNames: string[]
): string {
  const globalCssCollector = getGlobalCssCollector(collectors)
  return [
    createCollectorRuntimeScript(collectors),
    // Upstream systems already include global CSS in their portable CSS output.
    disableCollectorScript(globalCssCollector),
    ...prepared.upstreamFragments.map((bundle, index) =>
      wrapBundleWithSource(bundle, upstreamNames[index] ?? 'upstream system fragment')
    ),
    restoreCollectorScript(globalCssCollector),
    ...prepared.localFragmentBundles.map(({ file, bundle }) =>
      wrapBundleWithSource(bundle, file)
    ),
  ]
    .filter(Boolean)
    .join('\n')
}

function evaluationTempPath(cwd: string): string {
  return join(
    getOutDirPath(cwd),
    'tmp',
    `fragments-eval-${Date.now()}-${randomBytes(6).toString('hex')}.mjs`
  )
}

async function executeEvaluationScript(
  cwd: string,
  collectors: EvaluateCollector[],
  script: string
): Promise<CollectedBucket[]> {
  const tempPath = evaluationTempPath(cwd)
  try {
    mkdirSync(join(getOutDirPath(cwd), 'tmp'), { recursive: true })
    for (const collector of collectors) collector.init()
    writeFileSync(tempPath, script, 'utf-8')
    await import(pathToFileURL(tempPath).href)
    return collectors.map(collector => ({
      name: collector.config.name,
      fragments: collector.getFragments(),
    }))
  } finally {
    for (const collector of collectors) collector.cleanup()
    rmSync(tempPath, { force: true })
  }
}

function wrapBundleWithSource(bundle: string, source: string): string {
  return [
    `;globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}'] = ${JSON.stringify(source)}`,
    `;${bundle}`,
    `;globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}'] = undefined`,
  ].join('\n')
}

function mergeCollectedSpec(
  name: string,
  cwd: string,
  collected: CollectedBucket[],
  staticCss: Record<string, string[]>
): EvaluatedSystemSpec {
  const tokens = bucketByName(collected, 'tokens')
  const keyframes = bucketByName(collected, 'keyframes')
  const fonts = bucketByName(collected, 'font')
  const css = bucketByName(collected, 'globalCss')
  const patterns = bucketByName(collected, 'box-pattern')
  const mergedFonts = mergeFontRecord(fonts)
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name,
    tokens: mergeFragmentObjects(mergeRecordFragments(tokens), buildFontWeightTokens(mergedFonts)),
    fonts: mergedFonts,
    globalCss: toGlobalCssEntries(css, cwd),
    keyframes: mergeRecordFragments(keyframes),
    recipes: {},
    staticCss,
    provenance: [
      ...tokenProvenance(tokens, cwd),
      ...fontProvenance(fonts, cwd),
      ...keyframeProvenance(keyframes, cwd),
      ...globalCssProvenance(css, cwd),
      ...patternProvenance(patterns, cwd),
    ],
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
    merged = mergeFragmentObjects(merged, fragment)
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

// Font-weight tokens from the merged font record (core `buildFontTokens`
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

function patternProvenance(patterns: unknown[], cwd: string): SpecProvenance {
  return patterns.map(fragment => ({
    source: sourceOfFragment(fragment, cwd),
    kind: 'fragment' as const,
  }))
}
