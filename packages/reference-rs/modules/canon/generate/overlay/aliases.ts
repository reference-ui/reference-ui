/**
 * Authoring shorthand aliases for Reference UI StyleProps authoring.
 * Provides a minimal, curated set of 1:1 authoring shortcuts for common style properties.
 * Restricted to unambiguous abbreviations that cannot collide with tags, units, or CSS values.
 */

import type { CanonicalTarget } from './prefixes';

export const ALIASES = {
  m: 'margin',
  mt: 'marginTop',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mr: 'marginRight',
  mx: 'marginInline',
  my: 'marginBlock',
  p: 'padding',
  pt: 'paddingTop',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  pr: 'paddingRight',
  px: 'paddingInline',
  py: 'paddingBlock',
  w: 'width',
  h: 'height',
  minW: 'minWidth',
  minH: 'minHeight',
  maxW: 'maxWidth',
  maxH: 'maxHeight',
  bg: 'background',
  flexDir: 'flexDirection',
} as const satisfies Record<string, CanonicalTarget>;
