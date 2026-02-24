import { FONT_COLLECTOR_KEY } from './extendFontFace'

/**
 * Initialize the font collector before font definition files run.
 * The collect script imports this first, then fonts.ts.
 */
;(globalThis as Record<string, unknown>)[FONT_COLLECTOR_KEY] = []
