import { randomBytes } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ReferenceUIConfig } from '../../../config'
import type { BaseSystem } from '../../../types'
import {
  bundleFragments,
  scanForFragments,
  type CollectorBundles,
  type CollectorRuntimeAdapter,
  type FragmentBundle,
} from '../../../lib/fragments'
import { getOutDirPath } from '../../../lib/paths'
import { resolveCorePackageDir } from '../../../lib/paths/core-package-dir'
import { createKeyframesCollector } from '../../api/keyframes'
import { createTokensCollector } from '../../api/tokens'
import { createFontCollector } from '../../api/font'
import { createGlobalCssCollector } from '../../api/globalCss'
import { createBoxPatternCollector } from '../../api/patterns'
import { resolveInternalPatternFiles } from '../../panda/config/extensions/api/bundle'
import type { PreparedBaseFragments } from '../types'
import { getBaseFragmentBootstrapImportMap } from './bootstrap-import-map'

// Fragment bundles are plain IIFEs. This global tells collector calls which
// source file is currently executing so diagnostics can point back to filenames.
const CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY = '__refCurrentFragmentSource'

// Temporary global used only while collecting local token fragments for sync-time
// diagnostics. It keeps diagnostic collection separate from Panda config output.
const LOCAL_TOKEN_DIAGNOSTIC_FRAGMENTS_GLOBAL_KEY = '__refLocalTokenDiagnosticFragments'

export function getUpstreamFragments(systems: BaseSystem[] | undefined): string[] {
  return (systems ?? [])
    .map(system => system.fragment)
    .filter(
      (fragment): fragment is string =>
        typeof fragment === 'string' && fragment.trim().length > 0
    )
}

export function scanBaseFragmentFiles(cwd: string, config: ReferenceUIConfig): string[] {
  return scanForFragments({
    include: config.include,
    importFrom: [
      '@reference-ui/system',
      '@reference-ui/core/config',
      '@reference-ui/cli/config',
    ],
    cwd,
  })
}

export function getBaseCollectors() {
  return [
    createTokensCollector(),
    createKeyframesCollector(),
    createFontCollector(),
    createGlobalCssCollector(),
    createBoxPatternCollector(),
  ]
}

function isGlobalCssCollector(functionName: string | undefined, name: string): boolean {
  return functionName === 'globalCss' || name === 'globalCss'
}

function getGlobalCssCollector(collectors: CollectorRuntimeAdapter[]) {
  return collectors.find(collector =>
    isGlobalCssCollector(collector.config.targetFunction, collector.config.name)
  )
}

export async function prepareBaseFragments(
  cwd: string,
  config: ReferenceUIConfig
): Promise<PreparedBaseFragments> {
  const fragmentFiles = scanBaseFragmentFiles(cwd, config)
  const localFragmentBundles = await bundleFragments({
    files: fragmentFiles,
    alias: getBaseFragmentBootstrapImportMap(cwd),
  })

  return {
    upstreamFragments: getUpstreamFragments(config.extends),
    localFragmentBundles,
  }
}

export async function createCollectorBundleFromBase(
  cwd: string,
  prepared: PreparedBaseFragments
): Promise<CollectorBundles> {
  const collectors = getBaseCollectors()
  const internalPatternBundles = await bundleInternalPatterns(cwd)
  const values = createCollectorValues(collectors)

  return {
    collectorFragments: createCollectorFragmentsScript({
      collectors,
      prepared,
      internalPatternBundles,
    }),
    values,
    getValue(name: string) {
      return values.find(value => value.name === name)?.expression ?? '[]'
    },
  }
}

async function bundleInternalPatterns(cwd: string): Promise<FragmentBundle[]> {
  const coreDir = resolveCorePackageDir(cwd)
  return bundleFragments({
    files: resolveInternalPatternFiles(coreDir),
    alias: getBaseFragmentBootstrapImportMap(cwd),
  })
}

function createCollectorValues(collectors: CollectorRuntimeAdapter[]) {
  return collectors.map(collector => ({
    name: collector.config.name,
    expression: collector.toGetter(),
  }))
}

function createCollectorRuntimeScript(collectors: CollectorRuntimeAdapter[]): string {
  return collectors
    .flatMap(collector => [collector.toScript(), collector.toRuntimeFunction()])
    .join('\n')
}

function disableCollectorScript(collector: CollectorRuntimeAdapter | undefined): string {
  return collector ? `globalThis['${collector.config.globalKey}'] = undefined` : ''
}

function restoreCollectorScript(collector: CollectorRuntimeAdapter | undefined): string {
  return collector ? `globalThis['${collector.config.globalKey}'] = []` : ''
}

function createCollectorFragmentsScript(options: {
  collectors: CollectorRuntimeAdapter[]
  prepared: PreparedBaseFragments
  internalPatternBundles: FragmentBundle[]
}): string {
  const { collectors, prepared, internalPatternBundles } = options
  const globalCssCollector = getGlobalCssCollector(collectors)

  return [
    createCollectorRuntimeScript(collectors),
    // Upstream systems already include global CSS in their portable CSS output.
    disableCollectorScript(globalCssCollector),
    ...prepared.upstreamFragments.map(bundle =>
      wrapBundleWithSource(bundle, 'upstream system fragment')
    ),
    restoreCollectorScript(globalCssCollector),
    ...prepared.localFragmentBundles.map(({ file, bundle }) =>
      wrapBundleWithSource(bundle, file)
    ),
    ...internalPatternBundles.map(({ file, bundle }) =>
      wrapBundleWithSource(bundle, file)
    ),
  ]
    .filter(Boolean)
    .join('\n')
}

export async function collectLocalTokenFragmentsFromBase(
  cwd: string,
  prepared: PreparedBaseFragments
): Promise<Record<string, unknown>[]> {
  const collector = createTokensCollector()
  const tempPath = createTokenDiagnosticsTempPath(cwd)
  const script = createLocalTokenDiagnosticsScript(collector, prepared)

  try {
    mkdirSync(join(getOutDirPath(cwd), 'tmp'), { recursive: true })
    writeFileSync(tempPath, script, 'utf-8')
    await import(pathToFileURL(tempPath).href)
    return readLocalTokenDiagnosticFragments()
  } finally {
    cleanupLocalTokenDiagnostics(collector, tempPath)
  }
}

function createTokenDiagnosticsTempPath(cwd: string): string {
  return join(
    getOutDirPath(cwd),
    'tmp',
    `token-diagnostics-${Date.now()}-${randomBytes(6).toString('hex')}.mjs`
  )
}

function createLocalTokenDiagnosticsScript(
  collector: CollectorRuntimeAdapter,
  prepared: PreparedBaseFragments
): string {
  return [
    collector.toScript(),
    collector.toRuntimeFunction(),
    ...prepared.localFragmentBundles.map(({ file, bundle }) =>
      wrapBundleWithSource(bundle, file)
    ),
    `globalThis['${LOCAL_TOKEN_DIAGNOSTIC_FRAGMENTS_GLOBAL_KEY}'] = ${collector.toGetter()}`,
  ].join('\n')
}

function readLocalTokenDiagnosticFragments(): Record<string, unknown>[] {
  const fragments = (globalThis as Record<string, unknown>)[
    LOCAL_TOKEN_DIAGNOSTIC_FRAGMENTS_GLOBAL_KEY
  ]
  return Array.isArray(fragments) ? (fragments as Record<string, unknown>[]) : []
}

function cleanupLocalTokenDiagnostics(
  collector: { cleanup: () => void },
  tempPath: string
): void {
  collector.cleanup()
  delete (globalThis as Record<string, unknown>)[
    LOCAL_TOKEN_DIAGNOSTIC_FRAGMENTS_GLOBAL_KEY
  ]
  rmSync(tempPath, { force: true })
}

function wrapBundleWithSource(bundle: string, source: string): string {
  return [
    `;globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}'] = ${JSON.stringify(source)}`,
    `;${bundle}`,
    `;globalThis['${CURRENT_FRAGMENT_SOURCE_GLOBAL_KEY}'] = undefined`,
  ].join('\n')
}

export function createPortableBaseFragmentBundle(
  prepared: PreparedBaseFragments
): string {
  return [
    ...prepared.upstreamFragments,
    ...prepared.localFragmentBundles.map(({ bundle }) => bundle),
  ]
    .map(bundle => `;${bundle}`)
    .join('\n')
}