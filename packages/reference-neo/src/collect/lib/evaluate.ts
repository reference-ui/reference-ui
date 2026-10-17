// Scan, bundle, and evaluate-once runner for Neo fragments.
// It takes a project root plus config and emits the evaluated system spec.
// This module copies the core base flow and replaces config output with spec output.

import { randomBytes } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import type { ReferenceUIConfig } from '../../config/types.ts'
import { fragmentNodesOf, linearizeFragmentNodes } from '../../system/base/fragments.ts'
import type { BaseSystem, FragmentNode } from '../../system/base/types.ts'
import { CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY, FRAGMENT_IMPORT_NEEDLES } from '../constants.ts'
import { bundleFragments } from './runner.ts'
import { scanFragmentSources, type FragmentScan, type ScannedSource } from './scan/scanner.ts'
import { scanFragmentSourcesNative, type FragmentScanNative } from './scan/native.ts'
import type { FragmentBundle } from './types.ts'
import { getOutDirPath } from '../../lib/paths/index.ts'
import { createKeyframesCollector } from '../surface/keyframes.ts'
import { createTokensCollector } from '../surface/tokens.ts'
import { createFontCollector } from '../surface/font.ts'
import { createGlobalCssCollector } from '../surface/globalCss.ts'
import { createRecipeCollector } from '../surface/recipe.ts'
import { getFragmentBootstrapImportMap } from './bootstrap.ts'
import { mergeCollectedSpec, type CollectedBucket, type EvaluatedFragments } from './spec-merge.ts'

export { UPSTREAM_FRAGMENT_SOURCE } from '../constants.ts'
export { scopeUpstreamTokenFragment, type EvaluatedFragments } from './spec-merge.ts'

interface EvaluateCollector {
  config: { name: string; targetFunction?: string; globalKey: string }
  init: () => void
  getFragments: () => unknown[]
  cleanup: () => void
  toScript: () => string
  toRuntimeFunction: () => string
}

export interface PreparedFragments {
  /** Upstream fragment nodes, linearized: upstream first, each name at its first occurrence. */
  upstreamFragments: FragmentNode[]
  localFragmentBundles: FragmentBundle[]
  /**
   * Retained compile set from the fragment scan. Native path:
   * bytes stay engine-side behind `retentionToken` and this stays empty. TS
   * fallback (no addon): every in-scope source with its bytes, for the native
   * request's `files`. Held until compileNative resolves, then dropped.
   */
  scannedSources: ScannedSource[]
  /**
   * Native retention ref: the compile request carries this
   * instead of `files`, and the engine drains the retained bytes. Absent on
   * the TS fallback path and when retention is empty (negation-only).
   */
  retentionToken?: number
}

/**
 * The upstream fragment nodes a config evaluates: each extends entry's nodes in declared
 * order, each name kept at its first occurrence. A shared base reached through
 * two branches therefore evaluates once, in the first branch that reaches it.
 */
export function getUpstreamFragments(systems: BaseSystem[] | undefined): FragmentNode[] {
  return linearizeFragmentNodes((systems ?? []).map(fragmentNodesOf))
}

export async function scanFragmentFiles(
  cwd: string,
  config: ReferenceUIConfig
): Promise<FragmentScan> {
  return scanFragmentSources({
    include: config.include,
    importFrom: FRAGMENT_IMPORT_NEEDLES,
    cwd,
  })
}

export async function scanFragmentFilesNative(
  cwd: string,
  config: ReferenceUIConfig
): Promise<FragmentScanNative> {
  return scanFragmentSourcesNative({
    include: config.include,
    importFrom: FRAGMENT_IMPORT_NEEDLES,
    cwd,
  })
}

export function getFragmentCollectors(): EvaluateCollector[] {
  return [
    createTokensCollector(),
    createKeyframesCollector(),
    createFontCollector(),
    createGlobalCssCollector(),
    createRecipeCollector(),
  ]
}

export async function prepareFragments(
  cwd: string,
  config: ReferenceUIConfig
): Promise<PreparedFragments> {
  const { matches: fragmentFiles, retention } = await scanFragmentFilesNative(cwd, config)
  const localFragmentBundles = await bundleFragments({
    files: fragmentFiles,
    alias: getFragmentBootstrapImportMap(),
  })

  return {
    upstreamFragments: getUpstreamFragments(config.extends),
    localFragmentBundles,
    scannedSources: retention.files ?? [],
    retentionToken: retention.token,
  }
}

/**
 * Evaluate fragments once in Node and merge the collected calls into the
 * frozen spec shape. Upstream bundles run first with the globalCss collector
 * suppressed (upstream global CSS ships via the sync-time streams merge).
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
  return (await evaluatePreparedFragmentsDetailed(cwd, config, prepared)).spec
}

/**
 * Evaluate prepared fragments once and also return the diagnostics the token merge
 * raised. Sync reports those diagnostics beside the compile warnings.
 */
export async function evaluatePreparedFragmentsDetailed(
  cwd: string,
  config: ReferenceUIConfig,
  prepared: PreparedFragments
): Promise<EvaluatedFragments> {
  const collectors = getFragmentCollectors()
  const upstreamNames = prepared.upstreamFragments.map(node => node.name)
  const script = createEvaluationScript(collectors, prepared)
  const collected = await executeEvaluationScript(cwd, collectors, script)
  return mergeCollectedSpec({
    name: config.name,
    cwd,
    collected,
    staticCss: config.staticCss ?? {},
    upstreamNames,
  })
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
  prepared: PreparedFragments
): string {
  const globalCssCollector = getGlobalCssCollector(collectors)
  return [
    createCollectorRuntimeScript(collectors),
    // Upstream systems already include global CSS in their portable CSS output.
    disableCollectorScript(globalCssCollector),
    // Each upstream node runs under its own name, so its tokens cite that system.
    ...prepared.upstreamFragments.map(node => wrapBundleWithSource(node.bundle, node.name)),
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
