/**
 * Vendor-prefixed CSS properties absent from @webref/css.
 * Webref ships 70 lowercase-first webkit props and zero moz/ms rows; React
 * authors write capital-first Webkit/Moz spellings, so those spellings were
 * dropped as unknown. Canonical rows in vendor-extensions.ts cover every csstype
 * vendor prop missing from webref (lowercase-first, webref convention); aliases
 * in vendor-aliases.ts cover every capital-first React spelling. Opera (O)
 * excluded: Presto is dead.
 *
 * Provenance: csstype@3.2.3 vendor interface (92 Moz, 69 ms, 132 Webkit)
 * minus the 70 webref webkit rows = 223 canonical rows + 293 aliases.
 * Derived 2026-09-19; re-derive from csstype, never hand-extend.
 */

export type { VendorAlias } from './vendor-aliases.js';
export { VENDOR_ALIASES } from './vendor-aliases.js';
export { VENDOR_EXTENSIONS } from './vendor-extensions.js';

export const VENDOR_UNITLESS: readonly string[] = [
  'mozAnimationIterationCount',
  'mozBoxFlex',
  'mozBoxOrdinalGroup',
  'mozColumnCount',
  'mozColumns',
  'mozOpacity',
  'mozTabSize',
  'msFlex',
  'msFlexPositive',
  'msOrder',
  'webkitAnimationIterationCount',
  'webkitBorderImageSlice',
  'webkitBoxFlex',
  'webkitBoxFlexGroup',
  'webkitBoxOrdinalGroup',
  'webkitColumnCount',
  'webkitColumns',
  'webkitFlex',
  'webkitFlexGrow',
  'webkitFlexShrink',
  'webkitLineClamp',
  'webkitOrder',
];
