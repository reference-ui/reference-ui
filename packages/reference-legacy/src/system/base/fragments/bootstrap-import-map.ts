import { resolveCorePackageDir } from '../../../lib/paths/core-package-dir'

/**
 * Import map for fragment bundles that run during sync/config bootstrap.
 *
 * At this point `@reference-ui/system`, `@reference-ui/react`, and the generated
 * styled package have not been materialized under `.reference-ui/` yet. We still
 * need to execute user fragment files so token, recipe, keyframe, and pattern
 * collectors can build the bootstrap artefacts. This map points those imports
 * back at core source entries so fragment execution can happen before generated
 * packages exist.
 */
export function getBaseFragmentBootstrapImportMap(cwd: string): Record<string, string> {
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
    '@reference-ui/styled/css/cva': `${styledDir}/css/cva.js`,
    '@reference-ui/styled/jsx': `${styledDir}/jsx/index.js`,
    '@reference-ui/styled/patterns/box': `${styledDir}/patterns/box.js`,
  }
}