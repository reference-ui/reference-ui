import type { ReferenceUIConfig } from '../../../config'
import { bundleCollectorRuntime, bundleFragments, scanForFragments } from '../../../lib/fragments'
import { resolveCliPackageDir } from '../../../lib/paths/cli-package-dir'
import { createKeyframesCollector } from '../../api/keyframes'
import { createTokensCollector } from '../../api/tokens'
import { createFontCollector } from '../../api/font'
import { createGlobalCssCollector } from '../../api/globalCss'
import { createBoxPatternCollector } from '../../api/patterns'
import { resolveInternalPatternFiles } from './extensions/api/bundle'
import type { BaseSystem } from '../../../config/types'

export function getUpstreamFragments(systems: BaseSystem[] | undefined): string[] {
  return (systems ?? [])
    .map((system) => system.fragment)
    .filter((fragment): fragment is string => typeof fragment === 'string' && fragment.trim().length > 0)
}

export function scanUserFragmentFiles(cwd: string, config: ReferenceUIConfig): string[] {
  return scanForFragments({
    include: config.include,
    importFrom: ['@reference-ui/system', '@reference-ui/cli/config'],
    cwd,
  })
}

export function getFragmentBundleAlias(cwd: string): Record<string, string> {
  const cliDir = resolveCliPackageDir(cwd)
  const systemEntry = `${cliDir}/src/entry/system.ts`

  return {
    '@reference-ui/system': systemEntry,
    '@reference-ui/cli/config': systemEntry,
  }
}

export function getConfigCollectors() {
  return [
    createTokensCollector(),
    createKeyframesCollector(),
    createFontCollector(),
    createGlobalCssCollector(),
    createBoxPatternCollector(),
  ]
}

export async function createCollectorBundleForConfig(
  cwd: string,
  config: ReferenceUIConfig
) {
  const cliDir = resolveCliPackageDir(cwd)
  const fragmentFiles = scanUserFragmentFiles(cwd, config)
  const internalPatternFiles = resolveInternalPatternFiles(cliDir)

  return bundleCollectorRuntime({
    files: [...fragmentFiles, ...internalPatternFiles],
    collectors: getConfigCollectors(),
    alias: getFragmentBundleAlias(cwd),
    prebundledFragments: getUpstreamFragments(config.extends),
  })
}

export async function createPortableFragmentBundle(
  cwd: string,
  config: ReferenceUIConfig
): Promise<string> {
  const fragmentFiles = scanUserFragmentFiles(cwd, config)
  const localBundles = await bundleFragments({
    files: fragmentFiles,
    alias: getFragmentBundleAlias(cwd),
  })

  return [...getUpstreamFragments(config.extends), ...localBundles.map(({ bundle }) => bundle)]
    .map((bundle) => `;${bundle}`)
    .join('\n')
}
