/**
 * Pattern module types.
 *
 * Box pattern extensions are collected from system sources (internal/container, internal/r)
 * and user sources (extendPattern calls). They are merged and rendered via Liquid templates.
 */

import type { BoxPatternExtension } from '../collectors/extendPattern'

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

/** Options for collecting and merging system + user pattern fragments. */
export interface CollectPatternsOptions {
  /** Working directory for user scan (user project for ref sync) */
  cwd: string
  /** CLI root for system pattern sources. When absent, cwd is used (build case). */
  cliRoot?: string
  /** Include user extendPattern calls. Default: false (system only) */
  includeUser?: boolean
  /** User include globs (from config.include). Used when includeUser is true */
  userInclude?: string[]
  /** Temp directory for fragment execution */
  tempDir: string
  /** Alias for fragment bundling so user extendPattern files don't pull in full config (e.g. @reference-ui/cli/config → extendPattern path). */
  fragmentBundleAlias?: Record<string, string>
}

/** Result of collecting system and user patterns — merged for rendering. */
export interface CollectedPatterns {
  system: BoxPatternExtension[]
  user: BoxPatternExtension[]
  /** Merged extensions: system first, then user */
  merged: BoxPatternExtension[]
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** Options for rendering the box pattern to a fragment string. */
export interface RenderBoxPatternOptions {
  extensions: BoxPatternExtension[]
  /** Override the Panda config collector key. Defaults to COLLECTOR_KEY. */
  collectorKey?: string
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/** Options for running the full pattern pipeline (collect + render). */
export interface RunPatternPipelineOptions {
  /** Working directory (user project for ref sync, or CLI root for build) */
  cwd: string
  /** Temp directory for fragment execution */
  tempDir: string
  /** CLI package root for system patterns. When absent, cwd is used (build case). */
  cliRoot?: string
  /** Include user extendPattern calls. Default: false */
  includeUser?: boolean
  /** User include globs (from config.include). Required when includeUser is true */
  userInclude?: string[]
  /** Alias for user fragment bundling (avoids pulling in full config). */
  fragmentBundleAlias?: Record<string, string>
}

/** Result of running the pattern pipeline. */
export interface PatternPipelineResult {
  /** Rendered fragment string (push to Panda config collector) */
  fragment: string
  /** Number of system extensions collected */
  systemCount: number
  /** Number of user extensions collected */
  userCount: number
}

// ---------------------------------------------------------------------------
// Config integration
// ---------------------------------------------------------------------------

/** Options for getPatternFragmentsForConfig — one-liner for runConfig. */
export interface GetPatternFragmentsForConfigOptions {
  /** User project cwd (for user extendPattern scan) */
  cwd: string
  /** CLI package root (for system pattern sources) */
  cliDir: string
  /** User include globs (config.include) */
  userInclude: string[]
  /** Temp directory for fragment execution */
  tempDir: string
}
