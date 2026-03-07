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
  /** Alias for fragment bundling so app code doesn't pull in full config (e.g. @reference-ui/cli/config → system entry). */
  fragmentBundleAlias?: Record<string, string>
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

/** Font subsystem outputs consumed by config and patterns during ref sync. */
export interface FontFragmentsForConfig {
  fontConfigFragments: string
  /** Path to generated file in outDir containing extendPattern() call; patterns pipeline picks it up from here. */
  fontPatternFile?: string
  definitionsCount: number
}
