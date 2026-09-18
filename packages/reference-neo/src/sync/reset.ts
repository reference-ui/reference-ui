// Controlled reset injection for the Neo generated stylesheet.
// It takes the evaluated spec plus the normalizeCss flag and prepends the
// Andy Bell reset fragment unless the flag is false. The engine prints
// fragments whose source names reset into @layer reset (NEO-LAYER-04).

import type { EvaluatedSystemSpec, GlobalStyleNode } from '@reference-ui/rust/contracts'

/** Fragment source tag; the engine routes reset-named sources to @layer reset. */
export const RESET_FRAGMENT_SOURCE = 'normalizeCss/reset'

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)'

/** Reset ships by default; only an explicit false omits it (core parity). */
export function shouldInjectReset(normalizeCss: boolean | undefined): boolean {
  return normalizeCss !== false
}

/**
 * Fresh Andy Bell reset rules mirrored from core `stylesheet/reset.ts`. Two
 * spellings adapt to the engine walker: the reduced-motion block nests
 * per-selector (top-level at-rules are not expressible), and the form-element
 * `font: inherit` expands to longhands (the `font` key is the font macro).
 */
export function createResetRules(): Record<string, GlobalStyleNode> {
  return {
    '*, *::before, *::after': {
      boxSizing: 'border-box',
      [REDUCED_MOTION]: {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
        scrollBehavior: 'auto !important',
      },
    },
    'body, h1, h2, h3, h4, p, figure, blockquote, dl, dd': { margin: 0 },
    "ul[role='list'], ol[role='list']": { listStyle: 'none' },
    'html:focus-within': {
      scrollBehavior: 'smooth',
      [REDUCED_MOTION]: { scrollBehavior: 'auto' },
    },
    body: {
      minHeight: '100vh',
      textRendering: 'optimizeSpeed',
      lineHeight: 1.5,
    },
    'a:not([class])': { textDecorationSkipInk: 'auto' },
    'img, picture': { display: 'block', maxWidth: '100%' },
    'input, button, textarea, select': {
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontStyle: 'inherit',
      fontVariant: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
    },
  }
}

/**
 * Prepend the reset fragment and its provenance entry unless normalizeCss is
 * false. The spec is freshly evaluated per sync, so in-place prepend is safe.
 */
export function applyNormalizeCss(
  spec: EvaluatedSystemSpec,
  normalizeCss: boolean | undefined
): void {
  if (!shouldInjectReset(normalizeCss)) return
  spec.globalCss.unshift({ source: RESET_FRAGMENT_SOURCE, rules: createResetRules() })
  spec.provenance.unshift({ source: RESET_FRAGMENT_SOURCE, kind: 'globalCss' })
}
