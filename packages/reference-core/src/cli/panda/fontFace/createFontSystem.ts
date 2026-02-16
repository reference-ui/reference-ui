import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { microBundle } from '../../lib/microBundle'
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
    console.log('[createFontSystem] No fonts.ts found, skipping')
    return ''
  }

  const refDir = join(coreDir, '.ref')
  if (!existsSync(refDir)) mkdirSync(refDir, { recursive: true })

  const definitionsPath = join(refDir, 'font-definitions.json')
  const collectEntryPath = join(refDir, 'collect-fonts.ts')

  const collectEntryContent = buildFontCollectEntryContent({
    refDir,
    outputPath: definitionsPath,
    initFontCollectorPath: resolve(coreDir, 'src/cli/panda/fontFace/initFontCollector.ts'),
    extendFontFacePath: resolve(coreDir, 'src/cli/panda/fontFace/extendFontFace.ts'),
    fontsFilePath: fontsPath,
  })
  writeFileSync(collectEntryPath, collectEntryContent)

  const bundled = await microBundle(collectEntryPath)
  const collectScriptPath = join(refDir, 'collect-fonts.mjs')
  writeFileSync(collectScriptPath, bundled)

  const result = spawnSync(process.execPath, [collectScriptPath], {
    cwd: coreDir,
    encoding: 'utf-8',
  })
  if (result.status !== 0) {
    throw new Error(`[createFontSystem] Collect script failed:\n${result.stderr || result.stdout}`)
  }

  let definitions: FontDefinition[] = []
  if (existsSync(definitionsPath)) {
    definitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'))
  }

  rmSync(collectEntryPath, { force: true })
  rmSync(collectScriptPath, { force: true })
  rmSync(definitionsPath, { force: true })

  const fontPath = resolve(styledFontDir, 'font.ts')
  const content = generateFontSystemContent(definitions)
  writeFileSync(fontPath, content)
  console.log('[createFontSystem] Wrote font system to src/styled/font/font.ts')

  return fontPath
}
