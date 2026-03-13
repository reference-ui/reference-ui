import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { getEntryBasename } from '../layout'
import type { PackageDefinition } from '../package'

const LAYER_NAME_PLACEHOLDER = '__REFERENCE_UI_LAYER_NAME__'
const TEXT_ENCODING = 'utf-8'

export interface InjectLayerNameContext {
  layerName: string
}

/**
 * Replace the layer-name placeholder in the package entry file with the
 * configured layer name. Used by the React package so runtime CSS layers
 * match the design system name.
 */
export function injectLayerName(
  targetDir: string,
  pkg: PackageDefinition,
  context: InjectLayerNameContext
): void {
  const entryFile = getEntryBasename(pkg)
  const bundlePath = resolve(targetDir, entryFile)

  try {
    const content = readFileSync(bundlePath, TEXT_ENCODING)
    if (!content.includes(LAYER_NAME_PLACEHOLDER)) return

    writeFileSync(
      bundlePath,
      content.replaceAll(LAYER_NAME_PLACEHOLDER, context.layerName),
      TEXT_ENCODING
    )
  } catch (error) {
    log.debug('packager', `Could not inject layer name into bundle: ${error}`)
  }
}
