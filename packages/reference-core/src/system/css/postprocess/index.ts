import { writeFileSync } from 'node:fs'
import type { ReferenceUIConfig } from '../../../config'
import { renderAssembledStylesheet } from '../render/stylesheet'
import {
  collectUpstreamSystems,
  createLocalPostprocessedStylesheets,
  readPandaCssArtifacts,
} from './helpers'

/** Default Panda CSS filename under outdir (e.g. outDir/styled/styles.css). */
export const PANDA_CSS_FILENAME = 'styles.css'
export const PANDA_GLOBAL_CSS_FILENAME = 'global.css'

/**
 * After Panda cssgen: derive downstream CSS for the current system and, when
 * upstream systems expose precompiled CSS, rewrite the user-space stylesheet to
 * append upstream CSS in final source order.
 */
export function postprocessCss(
  outDir: string,
  config: ReferenceUIConfig,
): string | undefined {
  const artifacts = readPandaCssArtifacts(outDir, PANDA_CSS_FILENAME, PANDA_GLOBAL_CSS_FILENAME)
  if (!artifacts) return undefined

  // First derive the local user-space file and the reusable downstream CSS from Panda's output.
  const cssOutputs = createLocalPostprocessedStylesheets(config, artifacts)

  // Then gather any upstream systems whose CSS should be appended in the final assembled stylesheet.
  const upstreamSystems = collectUpstreamSystems(config)
  const hasNoUpstreamSystems = upstreamSystems.length === 0
  const userSpaceStylesheetChanged = cssOutputs.userSpaceCss !== artifacts.rawCss

  if (hasNoUpstreamSystems) {
    // Without upstream CSS, the current build only needs the local user-space stylesheet on disk.
    if (userSpaceStylesheetChanged) {
      writeFileSync(artifacts.stylesPath, cssOutputs.userSpaceCss, 'utf-8')
    }
    return cssOutputs.downstreamCss
  }

  // With upstream CSS, write the fully assembled stylesheet in source order for the current build.
  const finalCss = renderAssembledStylesheet(config.name, cssOutputs.downstreamCss, upstreamSystems)

  writeFileSync(artifacts.stylesPath, finalCss, 'utf-8')
  return finalCss
}