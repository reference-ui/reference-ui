/**
 * T17 probe constants — the single source of truth shared by the render
 * entry, the token fragment, and the contract spec. The values are deliberately
 * distinctive so the spec can prove they are absent from the published
 * icons/lib/fixture sheets (a passing paint cannot be a coincidental hit).
 */

/** Marker asserted by the colocated vitest unit test. */
export const matrixChainT17Marker = 'reference-ui-matrix-chain-t17'

/** Novel consumer color token (name becomes the class stem). */
export const T17_PROBE_COLOR_TOKEN = 't17ProbeInk'
/** The token's literal value; computed color assertions compare against this. */
export const T17_PROBE_COLOR_RGB = 'rgb(183, 2, 51)'
/** Raw CSS value path (value kind split): the value itself becomes the stem. */
export const T17_PROBE_RAW_HEX = '#b70233'

/** Novel consumer spacing token (root styling via `<Field padding>`). */
export const T17_PROBE_SPACING_TOKEN = 't17ProbeGap'
/** The spacing token's literal value. */
export const T17_PROBE_SPACING_PX = '13px'

/** Distinct color used by the `css` prop and the `_hover` condition arm. */
export const T17_CSS_HEX = '#00b7ab'
/** Computed form of the `css`/`_hover` color. */
export const T17_CSS_RGB = 'rgb(0, 183, 171)'
/** Inline `style` color on the positive-control icon. */
export const T17_CONTROL_RGB = 'rgb(0, 128, 0)'
/** Consumer `className` on the positive-control icon. */
export const T17_CONTROL_CLASS = 't17-control-class'

/** Foreign system prefixes minted by the composed packages. */
export const T17_ICONS_PREFIX = 'reference-icons__'
export const T17_UI_PREFIX = 'reference-ui__'
export const T17_FIXTURE_PREFIX = 'aliased-host-library__'

/** The probe classes the consumer's own foreign group must back. */
export const T17_PROBE_ICON_CLASSES = [
  `${T17_ICONS_PREFIX}c_${T17_PROBE_COLOR_TOKEN}`,
  `${T17_ICONS_PREFIX}c_${T17_PROBE_RAW_HEX}`,
  `${T17_ICONS_PREFIX}c_${T17_CSS_HEX}`,
  `${T17_ICONS_PREFIX}hover:c_${T17_CSS_HEX}`,
] as const
