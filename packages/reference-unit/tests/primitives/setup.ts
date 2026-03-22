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
 * happy-dom does not apply rules inside `@layer { … }`, so getComputedStyle stays
 * empty for Panda output. For tests only: strip layer prelude statements and unwrap
 * layer blocks so rules apply like a flat sheet (order preserved enough for tokens).
 */
export function flattenCssCascadeLayersForTests(css: string): string {
  let out = css.replace(/@layer\s+[^;{]+;/g, '')
  for (;;) {
    const idx = out.indexOf('@layer')
    if (idx === -1) break
    const openBrace = out.indexOf('{', idx)
    if (openBrace === -1) break
    let depth = 0
    let end = -1
    for (let i = openBrace; i < out.length; i++) {
      const c = out[i]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end === -1) break
    const inner = out.slice(openBrace + 1, end)
    out = `${out.slice(0, idx)}\n${inner}\n${out.slice(end + 1)}`
  }
  return out
}

export type InjectDesignSystemCssOptions = {
  /**
   * Unwrap `@layer { … }` so happy-dom applies rules. Default false — leave off for
   * spacing/recipes tests where layer order matters; use true for token paint tests
   * (`tests/color-mode/*`, demo component tests).
   */
  flattenCascadeLayers?: boolean
}

/**
 * Inject the design system CSS into document.head.
 * Call once in beforeAll for tests that need computed styles.
 */
export function injectDesignSystemCss(options?: InjectDesignSystemCssOptions): void {
  const cssPath = getDesignSystemCssPath()
  if (!cssPath) {
    throw new Error(
      `Design system CSS not found. Tried: ${cssPaths.join(', ')}. Run "ref sync" (or use globalSetup) so .reference-ui exists.`
    )
  }
  let css = readFileSync(cssPath, 'utf-8')
  if (options?.flattenCascadeLayers === true) {
    css = flattenCssCascadeLayersForTests(css)
  }
  const style = document.createElement('style')
  style.setAttribute('data-test-injected', 'design-system')
  style.textContent = css
  document.head.appendChild(style)
}
