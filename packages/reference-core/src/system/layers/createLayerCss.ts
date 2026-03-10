import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { createLayerCssFromContent } from './transform'

/**
 * Create layer-ready CSS from Panda's emitted stylesheet at the given path.
 * Returns undefined if the file does not exist (e.g. cssgen not run yet).
 */
export function createLayerCss(
  stylesPath: string,
  layerName: string
): string | undefined {
  const absPath = resolve(stylesPath)
  if (!existsSync(absPath)) {
    log.debug('layers', `styles not found at ${absPath}, skipping layer CSS`)
    return undefined
  }
  const raw = readFileSync(absPath, 'utf-8')
  return createLayerCssFromContent(raw, layerName)
}
