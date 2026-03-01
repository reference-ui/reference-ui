import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../../lib/log'
import { runCollectScript } from '../../collectors/runCollectScript'
import { buildFontCollectEntryContent } from './collectEntryTemplate'
import { generateFontSystemContent } from './generateFontSystem'
import type { FontDefinition } from './extendFontFace'

/**
 * Run font() calls from fonts.ts to collect definitions, then generate font.ts
 * with tokens, globalFontface, recipe, and pattern extension.
 *
 * Output: src/styled/font/font.ts
 */
export async function createFontSystem(coreDir: string): Promise<string> {
  const styledFontDir = resolve(coreDir, 'src/styled/font')
  const fontsPath = resolve(styledFontDir, 'fonts.ts')

  if (!existsSync(fontsPath)) {
    log.debug('system:font', 'No fonts.ts found, skipping')
    return ''
  }

  const collectEntryContent = buildFontCollectEntryContent({
    refDir: resolve(coreDir, '.ref'),
    outputPath: resolve(coreDir, '.ref/font-definitions.json'),
    initCollectorPath: resolve(
      coreDir,
      'src/cli/system/config/fontFace/initCollector.ts'
    ),
    extendFontFacePath: resolve(
      coreDir,
      'src/cli/system/config/fontFace/extendFontFace.ts'
    ),
    fontsFilePath: fontsPath,
  })

  const definitions = await runCollectScript<FontDefinition[]>({
    coreDir,
    entryContent: collectEntryContent,
    entryBasename: 'collect-fonts',
    jsonFilename: 'font-definitions.json',
    logLabel: 'system:font',
  })

  const fontPath = resolve(styledFontDir, 'font.ts')
  const content = generateFontSystemContent(definitions)
  writeFileSync(fontPath, content)
  log.debug('system:font', 'Wrote font system to src/styled/font/font.ts')

  return fontPath
}
