/**
 * Render font system output via Liquid templates.
 *
 * Generates tokens, @font-face, recipe, and pattern fragments
 * from collected font definitions.
 */

import { Liquid } from 'liquidjs'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FontDefinition } from '../collectors/extendFont'
import type { FontSystemOutput, ParsedFontFamily } from './types'

const engine = new Liquid()

function getLiquidDir(): string {
  try {
    const url = (import.meta as { url?: string }).url
    if (url) {
      return dirname(fileURLToPath(url))
    }
  } catch {
    /* ignore */
  }
  const cwd = process.cwd()
  const candidates = [
    join(cwd, 'packages/reference-cli/src/system/font/liquid'),
    join(cwd, 'src/system/font/liquid'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'tokens.liquid'))) return dir
  }
  return candidates[0]!
}

/**
 * Parse font family key from font value string.
 * e.g. '"Inter", ui-sans-serif, sans-serif' → { key: 'Inter', quoted: true }
 */
export function parseFontFamily(value: string): ParsedFontFamily {
  const match = value.match(/^["']([^"']+)["']/)
  if (match) {
    const name = match[1]
    return {
      key: name.includes(' ') ? `"${name}"` : name,
      quoted: true,
    }
  }
  const fallback = value.split(',')[0]?.trim() ?? 'unknown'
  return { key: fallback, quoted: false }
}

/** Register custom Liquid filter for parseFontFamily. */
function registerFilters(): void {
  engine.registerFilter('parseFontFamily', (value: string) => {
    const parsed = parseFontFamily(value)
    return parsed.key
  })
}

/** Load and render a template. */
async function renderTemplate(
  templatePath: string,
  context: Record<string, unknown>
): Promise<string> {
  const liquidDir = getLiquidDir()
  const template = readFileSync(join(liquidDir, templatePath), 'utf-8')
  return engine.parseAndRender(template, context)
}

/**
 * Generate font system output from font definitions.
 */
export async function renderFontSystem(fonts: FontDefinition[]): Promise<FontSystemOutput> {
  registerFilters()

  if (fonts.length === 0) {
    return { tokens: '', fontface: '', recipe: '', pattern: '' }
  }

  // Enrich fonts with familyKey for @font-face template
  const fontsWithKey = fonts.map((font) => ({
    ...font,
    familyKey: parseFontFamily(font.value).key,
    fontFace: Array.isArray(font.fontFace) ? font.fontFace[0] : font.fontFace,
  }))

  const context = { fonts: fontsWithKey }

  const [tokens, fontface, recipe, pattern] = await Promise.all([
    renderTemplate('tokens.liquid', context),
    renderTemplate('fontface.liquid', context),
    renderTemplate('recipe.liquid', context),
    renderTemplate('pattern.liquid', context),
  ])

  return {
    tokens: tokens.trim(),
    fontface: fontface.trim(),
    recipe: recipe.trim(),
    pattern: pattern.trim(),
  }
}
