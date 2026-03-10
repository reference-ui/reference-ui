/**
 * Setup for primitive/component tests (RTL + happy-dom).
 * Injects the design system CSS so getComputedStyle reflects token values.
 *
 * Assumes ref sync has run (globalSetup) so .reference-ui exists.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(__dirname, '..', '..')
const refUi = join(pkgRoot, '.reference-ui')

/** Paths to try for the compiled design system CSS (order matters). */
const cssPaths = [
  join(refUi, 'styled', 'style.css'),
  join(refUi, 'styled', 'styles.css'),
  join(refUi, 'react', 'styles.css'),
  join(refUi, 'system', 'style.css'),
]

export function getDesignSystemCssPath(): string | undefined {
  for (const p of cssPaths) {
    if (existsSync(p)) return p
  }
  return undefined
}

/** Read design system CSS content. Returns undefined if no CSS file found. */
export function getDesignSystemCss(): string | undefined {
  const path = getDesignSystemCssPath()
  if (!path) return undefined
  return readFileSync(path, 'utf-8')
}

/**
 * Inject the design system CSS into document.head.
 * Call once in beforeAll for tests that need computed styles.
 * Skips if CSS file is not found (e.g. ref sync didn't run or output path changed).
 */
export function injectDesignSystemCss(): void {
  const cssPath = getDesignSystemCssPath()
  if (!cssPath) {
    throw new Error(
      `Design system CSS not found. Tried: ${cssPaths.join(', ')}. Run "ref sync" (or use globalSetup) so .reference-ui exists.`
    )
  }
  const css = readFileSync(cssPath, 'utf-8')
  const style = document.createElement('style')
  style.setAttribute('data-test-injected', 'design-system')
  style.textContent = css
  document.head.appendChild(style)
}
