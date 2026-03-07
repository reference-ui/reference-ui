/**
 * Font module — font system.
 *
 * Collects font definitions from app code (extendFont calls),
 * renders tokens, @font-face, recipe, and pattern fragments via Liquid.
 *
 * Fonts live in app space — the CLI collects and renders, no built-in fonts.
 * Pattern output is written via microbundle to a portable fragment file
 * (no runtime dependency on @reference-ui/cli/config or esbuild).
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCliPackageDir } from '../../lib/paths/cli-package-dir'
import { microBundle, DEFAULT_EXTERNALS } from '../../lib/microbundle'
import { collectFonts } from './collect'
import { renderFontSystem } from './render'
import type { CollectFontsOptions, FontFragmentsForConfig } from './types'

export { collectFonts } from './collect'
export { renderFontSystem, parseFontFamily } from './render'
export { loadFontTemplates } from './liquid'
export type { FontDefinition } from '../collectors/extendFont'
export type { CollectFontsOptions } from './collect'
export type { FontSystemOutput, ParsedFontFamily, FontFragmentsForConfig } from './types'

const FONT_PATTERN_FILENAME = 'font-pattern.mjs'

/**
 * Collect and render font outputs for runtime config generation.
 *
 * `fontConfigFragments` are injected directly into Panda config assembly.
 * The generated pattern (extendPattern call) is written to a file in tempDir
 * so the patterns pipeline can pick it up via additionalPatternFiles without
 * any font-specific knowledge.
 */
export async function getFontFragmentsForConfig(
  options: CollectFontsOptions
): Promise<FontFragmentsForConfig> {
  const fonts = await collectFonts(options)
  const rendered = await renderFontSystem(fonts)

  let fontPatternFile: string | undefined
  if (rendered.pattern.trim()) {
    const tempDir = options.tempDir
    mkdirSync(tempDir, { recursive: true })
    fontPatternFile = join(tempDir, FONT_PATTERN_FILENAME)
    // Portable fragment: import extendPattern from CLI collector only (not config), then microbundle to IIFE
    let extendPatternPath: string
    try {
      const fontDir = dirname(fileURLToPath(import.meta.url))
      const extendBase = join(fontDir, '..', 'collectors', 'extendPattern')
      const ext = existsSync(extendBase + '.mjs') ? '.mjs' : '.ts'
      extendPatternPath = extendBase + ext
      if (!existsSync(extendPatternPath)) throw new Error('not found')
    } catch {
      const cliDir = resolveCliPackageDir(process.cwd())
      const srcPath = join(cliDir, 'src/system/collectors/extendPattern.ts')
      extendPatternPath = existsSync(srcPath) ? srcPath : join(cliDir, 'src/system/collectors/extendPattern.mjs')
    }
    const entryPath = join(tempDir, 'font-pattern-entry.mjs')
    const entryContent =
      `import { extendPattern } from '${extendPatternPath}';\n\n` + rendered.pattern
    writeFileSync(entryPath, entryContent, 'utf-8')
    try {
      const bundled = await microBundle(entryPath, {
        format: 'iife',
        external: DEFAULT_EXTERNALS,
      })
      writeFileSync(fontPatternFile, bundled, 'utf-8')
    } finally {
      try {
        rmSync(entryPath, { force: true })
      } catch {
        /* ignore */
      }
    }
  }

  return {
    fontConfigFragments: [rendered.tokens, rendered.fontface, rendered.recipe]
      .filter(Boolean)
      .join('\n'),
    fontPatternFile,
    definitionsCount: fonts.length,
  }
}
