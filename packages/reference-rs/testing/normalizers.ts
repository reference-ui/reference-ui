/**
 * Normalization utilities for deterministic test output comparisons.
 * Provides pure functions for standardizing line endings, whitespace,
 * stripping non-deterministic runtime tokens, and rewriting checkout-absolute
 * paths out of compiler artifacts. Used by station runners and golden diff
 * engines across reference-rs suites.
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
