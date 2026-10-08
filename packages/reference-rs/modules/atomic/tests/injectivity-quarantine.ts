/**
 * Known namer collisions owned by ATM-GHOST-04. Distinct atoms must map to
 * distinct class names; stations on this list currently fail that invariant.
 * The list may only shrink. A standing gauge and a meta-test both fail if an
 * entry becomes injective and is left here. Do not add Move 1 (When type) from
 * this file — the allowlist makes the debt visible until that landing.
 */
export const INJECTIVITY_QUARANTINE: readonly string[] = [
  // padding vs p collapse onto the same prefix under md.
  'ATM-LEAF-05',
]
