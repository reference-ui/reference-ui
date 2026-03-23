import type { ReferenceUIConfig } from '../../config'
import type { BaseSystem } from '../../types'
import {
  bundleCollectorRuntime,
  bundleFragments,
  scanForFragments,
  type CollectorBundles,
} from '../../lib/fragments'
import { resolveCorePackageDir } from '../../lib/paths/core-package-dir'
import { createKeyframesCollector } from '../api/keyframes'
import { createTokensCollector } from '../api/tokens'
import { createFontCollector } from '../api/font'
import { createGlobalCssCollector } from '../api/globalCss'
import { createBoxPatternCollector } from '../api/patterns'
import { resolveInternalPatternFiles } from '../panda/config/extensions/api/bundle'
import type { PreparedBaseFragments } from './types'

export function getUpstreamFragments(systems: BaseSystem[] | undefined): string[] {
  return (systems ?? [])
    .map((system) => system.fragment)
    .filter((fragment): fragment is string => typeof fragment === 'string' && fragment.trim().length > 0)
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

export function getBaseFragmentBundleAlias(cwd: string): Record<string, string> {
  const coreDir = resolveCorePackageDir(cwd)
  const systemEntry = `${coreDir}/src/entry/system.ts`
  const reactEntry = `${coreDir}/src/entry/react.ts`
  const styledDir = `${coreDir}/src/system/styled`

  return {
    '@reference-ui/system': systemEntry,
    '@reference-ui/core/config': systemEntry,
    '@reference-ui/cli/config': systemEntry,
    '@reference-ui/react': reactEntry,
    '@reference-ui/styled/css': `${styledDir}/css/index.js`,
    '@reference-ui/styled/jsx': `${styledDir}/jsx/index.js`,
    '@reference-ui/styled/patterns/box': `${styledDir}/patterns/box.js`,
  }
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

export async function prepareBaseFragments(
  cwd: string,
  config: ReferenceUIConfig
): Promise<PreparedBaseFragments> {
  const fragmentFiles = scanBaseFragmentFiles(cwd, config)
  const localFragmentBundles = await bundleFragments({
    files: fragmentFiles,
    alias: getBaseFragmentBundleAlias(cwd),
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
  const coreDir = resolveCorePackageDir(cwd)
  const internalPatternFiles = resolveInternalPatternFiles(coreDir)

  return bundleCollectorRuntime({
    files: internalPatternFiles,
    collectors: getBaseCollectors(),
    alias: getBaseFragmentBundleAlias(cwd),
    prebundledFragments: [
      ...prepared.upstreamFragments,
      ...prepared.localFragmentBundles.map(({ bundle }) => bundle),
    ],
  })
}

export function createPortableBaseFragmentBundle(prepared: PreparedBaseFragments): string {
  return [...prepared.upstreamFragments, ...prepared.localFragmentBundles.map(({ bundle }) => bundle)]
    .map((bundle) => `;${bundle}`)
    .join('\n')
}
