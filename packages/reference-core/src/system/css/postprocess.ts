import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReferenceUIConfig } from '../../config'
import { renderAssembledStylesheet } from './render/stylesheet'
import { createPortableStylesheetFromContent } from './transform/createPortableStylesheetFromContent'

/** Default Panda CSS filename under outdir (e.g. outDir/styled/styles.css). */
export const PANDA_CSS_FILENAME = 'styles.css'

/**
 * After Panda cssgen: derive portable CSS for the current system and, when
 * `config.layers` is enabled, rewrite the runtime stylesheet to append upstream
 * layered CSS in final source order.
 */
export function postprocessCss(
  outDir: string,
  config: ReferenceUIConfig,
): string | undefined {
  const styledDir = join(outDir, 'styled')
  const stylesPath = join(styledDir, PANDA_CSS_FILENAME)
  if (!existsSync(stylesPath)) return undefined

  const raw = readFileSync(stylesPath, 'utf-8')
  const portableStylesheet = createPortableStylesheetFromContent(raw, config.name)

  const layers = config.layers ?? []
  if (layers.length === 0) {
    return portableStylesheet
  }

  const upstreamLayers = layers
    .map((layer) => {
      const css = layer.css?.trim()
      return css ? { name: layer.name, css } : undefined
    })
    .filter((layer): layer is { name: string; css: string } => Boolean(layer))
  const finalCss = renderAssembledStylesheet(config.name, portableStylesheet, upstreamLayers)

  writeFileSync(stylesPath, finalCss, 'utf-8')
  return portableStylesheet
}
