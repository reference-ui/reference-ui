/**
 * Font module — font system.
 *
 * Collects font definitions from app code (extendFont calls),
 * renders tokens, @font-face, recipe, and pattern fragments via Liquid.
 *
 * Fonts live in app space — the CLI collects and renders, no built-in fonts.
 * Will hook into config when integrated.
 */

import { collectFonts } from './collect'
import { renderFontSystem } from './render'

export { collectFonts } from './collect'
export { renderFontSystem, parseFontFamily } from './render'
export { loadFontTemplates } from './liquid'
export type { FontDefinition } from '../collectors/extendFont'
export type { CollectFontsOptions } from './collect'
export type { FontSystemOutput, ParsedFontFamily } from './types'
