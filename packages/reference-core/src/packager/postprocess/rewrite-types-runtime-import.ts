import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { getEntryBasename } from '../layout'
import type { PackageDefinition } from '../package'

const RUNTIME_IMPORT_PLACEHOLDER = '__REFERENCE_UI_TYPES_RUNTIME__'
const GENERATED_RUNTIME_SPECIFIER = './tasty/runtime.js'
const TEXT_ENCODING = 'utf-8'

/**
 * The `@reference-ui/types` entry is bundled from `reference-core` source before
 * the generated `tasty/runtime.js` file exists in the package output.
 *
 * We therefore compile the source entry against a placeholder specifier that
 * esbuild keeps external, then rewrite that placeholder here after packaging so
 * the final generated package contains a normal literal import:
 *
 *   import('./tasty/runtime.js')
 *
 * That final literal import is important because app bundlers need to see the
 * real runtime edge in the generated package in order to include the emitted
 * Tasty runtime and its lazy chunk graph in production builds.
 */
export function rewriteTypesRuntimeImport(
  targetDir: string,
  pkg: PackageDefinition
): void {
  const entryFile = getEntryBasename(pkg)
  const bundlePath = resolve(targetDir, entryFile)

  try {
    const content = readFileSync(bundlePath, TEXT_ENCODING)
    if (!content.includes(RUNTIME_IMPORT_PLACEHOLDER)) return

    writeFileSync(
      bundlePath,
      content.replaceAll(RUNTIME_IMPORT_PLACEHOLDER, GENERATED_RUNTIME_SPECIFIER),
      TEXT_ENCODING
    )
  } catch (error) {
    log.debug('packager', `Could not rewrite generated types runtime import: ${error}`)
  }
}
