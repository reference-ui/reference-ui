/**
 * Normalization utilities for deterministic test output comparisons.
 * Provides pure functions for standardizing line endings, whitespace,
 * stripping non-deterministic runtime tokens, rewriting checkout-absolute
 * paths out of compiler artifacts, and collapsing base-system CSS layer bodies
 * so per-case goldens stay independent of lib token values. Used by station
 * runners and golden diff engines across reference-rs suites.
 */

const ANSI_PATTERN = /\u001b\[[0-9;]*[A-Za-z]/g

/**
 * Normalizes Windows CRLF newlines to Unix LF newlines and trims trailing whitespace.
 */
export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').trim()
}

/**
 * Normalizes code text by removing extraneous whitespace around lines and normalizing endings.
 */
export function normalizeCodeText(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim()
}

/**
 * Strips ANSI escape codes from diagnostic or terminal outputs.
 */
export function stripAnsi(content: string): string {
  return content.replace(ANSI_PATTERN, '')
}

/**
 * Rewrites an absolute directory prefix out of golden text so snapshots do
 * not embed a checkout path. Windows separators are folded so a POSIX golden
 * still matches a Windows run.
 */
export function rewriteAbsoluteRoot(content: string, absoluteRoot: string): string {
  if (!absoluteRoot) {
    return content
  }
  const posix = absoluteRoot.replace(/\\/g, '/')
  const posixPrefix = posix.endsWith('/') ? posix : `${posix}/`
  const escapedWin = posixPrefix.replace(/\//g, '\\\\')
  return content.split(posixPrefix).join('').split(escapedWin).join('')
}

/** Base-system layers whose bodies are design data, never case-specific output. */
const SYSTEM_LAYERS = ['global', 'tokens'] as const

interface LayerBodyRange {
  start: number
  end: number
}

/** Half-open range of a layer body's bytes, brace-matched from its opening `{`. */
function layerBodyRange(css: string, layer: string): LayerBodyRange | null {
  const open = `@layer ${layer} {`
  const start = css.indexOf(open)
  if (start < 0) {
    return null
  }
  const bodyStart = start + open.length
  let depth = 0
  for (let i = bodyStart; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      if (depth === 0) {
        return { start: bodyStart, end: i }
      }
      depth--
    }
  }
  return null
}

/**
 * Collapses base-system layer bodies (`@layer global`, `@layer tokens`) to a
 * stable marker while preserving the layer scaffolding and every case-specific
 * `@layer utilities` byte. Keeps per-case goldens independent of lib palette
 * and keyframe values; the `ATM-SYS-01` anchor commits the full emission once.
 */
export function normalizeSystemLayers(css: string): string {
  let out = css
  for (const layer of SYSTEM_LAYERS) {
    const range = layerBodyRange(out, layer)
    if (!range) {
      continue
    }
    const marker = `\n  /* system ${layer} layer collapsed; pinned by ATM-SYS-01 */\n`
    out = `${out.slice(0, range.start)}${marker}${out.slice(range.end)}`
  }
  return out
}
