import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReferenceUIConfig } from '../../config'
import { renderLayerStylesheet } from './render'
import { createLayerCssFromContent } from './transform'

/** Default Panda CSS filename under outdir (e.g. outDir/styled/styles.css). */
export const PANDA_CSS_FILENAME = 'styles.css'

/**
 * After Panda cssgen: transform the emitted CSS into layer-ready form and append upstream layers.
 * - Always computes layer-ready CSS for the current system (for baseSystem.css).
 * - Only rewrites the runtime stylesheet when config.layers is enabled.
 * - In layers mode, replaces file content with @layer <name> { ... } + [data-layer="<name>"] token block
 *   and appends config.layers[].css to the stylesheet.
 * Returns the layer-ready CSS for the current system or undefined if no file.
 */
export function applyLayerPostprocess(
  outDir: string,
  config: ReferenceUIConfig
): string | undefined {
  const styledDir = join(outDir, 'styled')
  const stylesPath = join(styledDir, PANDA_CSS_FILENAME)
  if (!existsSync(stylesPath)) return undefined

  const raw = readFileSync(stylesPath, 'utf-8')
  const layerCss = createLayerCssFromContent(raw, config.name)

  const layers = config.layers ?? []
  if (layers.length === 0) {
    return layerCss
  }

  const upstreamLayerCss = layers
    .map((layer) => layer.css?.trim())
    .filter((css): css is string => Boolean(css))
  const finalCss = renderLayerStylesheet(layerCss, upstreamLayerCss)

  writeFileSync(stylesPath, finalCss, 'utf-8')
  return layerCss
}
