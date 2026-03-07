/**
 * Font module types.
 *
 * Font definitions are collected from app code (extendFont calls).
 * They are rendered to tokens, @font-face, recipe, and pattern fragments.
 */

import type { FontDefinition as CollectorFontDefinition } from '../collectors/extendFont'

export type { FontDefinition } from '../collectors/extendFont'

/** Parsed font family key from font value string (e.g. for @font-face rules). */
export interface ParsedFontFamily {
  key: string
  quoted: boolean
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

export interface CollectFontsOptions {
  /** Working directory (app root) */
  cwd: string
  /** Include globs (config.include) — where to scan for extendFont calls */
  userInclude: string[]
  /** Temp directory for fragment execution */
  tempDir: string
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** Font with familyKey pre-computed for @font-face rules */
export interface FontWithFamilyKey extends CollectorFontDefinition {
  familyKey: string
}

export interface FontSystemOutput {
  tokens: string
  fontface: string
  recipe: string
  pattern: string
}
