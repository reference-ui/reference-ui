import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReferenceUIConfig } from '../../config'
import { createLayerCssFromContent } from './transform'

/** Default Panda CSS filename under outdir (e.g. outDir/styled/styles.css). */
export const PANDA_CSS_FILENAME = 'styles.css'

/**
 * After Panda cssgen: transform the emitted CSS into layer-ready form and append upstream layers.
 * - Replaces file content with @layer <name> { ... } + [data-layer="<name>"] token block.
 * - Appends config.layers[].css to the stylesheet.
 * Returns the layer-ready CSS for the current system (for baseSystem.css) or undefined if no file.
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
  let finalCss = layerCss

  const layers = config.layers ?? []
  for (const layer of layers) {
    if (layer.css) {
      finalCss += '\n\n' + layer.css.trim()
    }
  }

  writeFileSync(stylesPath, finalCss, 'utf-8')
  return layerCss
}
