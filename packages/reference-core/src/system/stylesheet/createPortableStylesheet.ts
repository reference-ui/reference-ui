import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { createPortableStylesheetFromContent } from './transform/createPortableStylesheetFromContent'

/**
 * Create portable CSS from Panda's emitted stylesheet at the given path.
 * Returns undefined if the file does not exist (e.g. cssgen not run yet).
 */
export function createPortableStylesheet(
  stylesPath: string,
  layerName: string,
): string | undefined {
  const absPath = resolve(stylesPath)
  if (!existsSync(absPath)) {
    log.debug('css', `styles not found at ${absPath}, skipping portable stylesheet`)
    return undefined
  }
  const raw = readFileSync(absPath, 'utf-8')
  return createPortableStylesheetFromContent(raw, layerName)
}
