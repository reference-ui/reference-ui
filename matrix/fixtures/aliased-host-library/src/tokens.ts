/**
 * Aliased-host-library assertion values. Single source of truth for the
 * shell's expected computed styles, exported for chain-tier assertions.
 */

/** `display="inline-flex"` computes to `flex` in Chromium/`inline-flex` elsewhere. */
export const badgeShellDisplayPattern = /flex/
/** `alignItems="center"` / `justifyContent="center"`. */
export const badgeShellCenter = 'center'
/** `lineHeight="0"`. */
export const badgeShellLineHeight = '0px'
/** `flexShrink="0"`. */
export const badgeShellFlexShrink = '0'
