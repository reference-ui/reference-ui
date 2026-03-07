/**
 * Font collection — app space only.
 *
 * Fonts are defined in the app via extendFont() (e.g. app/src/system/fonts.ts).
 * The CLI collects and renders them; no built-in fonts.
 */

import { collectFragments, scanForFragments } from '../../lib/fragments'
import { createFontCollector } from '../collectors/extendFont'
import type { FontDefinition } from '../collectors/extendFont'
import type { CollectFontsOptions } from './types'

export type { CollectFontsOptions } from './types'

/**
 * Collect font definitions from app code (extendFont calls).
 */
export async function collectFonts(options: CollectFontsOptions): Promise<FontDefinition[]> {
  const { cwd, userInclude, tempDir } = options

  if (userInclude.length === 0) {
    return []
  }

  const fontCollector = createFontCollector()

  const fragmentFiles = scanForFragments({
    include: userInclude,
    functionNames: ['extendFont'],
    exclude: ['**/node_modules/**', '**/*.d.ts', '**/dist/**', '**/.reference-ui/**'],
    cwd,
  })

  if (fragmentFiles.length === 0) {
    return []
  }

  const definitions = await collectFragments({
    files: fragmentFiles,
    collector: fontCollector,
    tempDir,
  })

  return definitions as FontDefinition[]
}
