/**
 * Central emitter switchboard for Reference UI Rust canon modules.
 * Re-exports code emitters for HTML elements, CSS properties, aliases, conditions, and tests.
 * Mirrors the structure of the canon crate to provide direct 1:1 mapping with generated Rust modules.
 */

export { formatChunks } from './format.js';
export { emitHtmlRs } from './html.js';
export { emitDialectRs } from './dialect.js';
export { emitConditionsRs } from './conditions.js';
export {
  emitCssModRs,
  emitCssLonghandsRs,
  emitCssColorRs,
  emitCssPropertiesRs,
  emitCssUnrealizableRs,
} from './css.js';
export { emitLibRs } from './lib.js';
export { emitTestsRs } from './tests/index.js';
