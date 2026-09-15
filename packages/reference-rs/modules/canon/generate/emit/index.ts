/**
 * Central emitter switchboard for Reference UI Rust canon modules.
 * Re-exports code emitters for HTML elements, CSS properties, aliases, conditions, and tests.
 * Mirrors the structure of the canon crate to provide direct 1:1 mapping with generated Rust modules.
 */

export { formatChunks } from './format';
export { emitHtmlRs } from './html';
export { emitDialectRs } from './dialect';
export { emitConditionsRs } from './conditions';
export {
  emitCssModRs,
  emitCssLonghandsRs,
  emitCssColorRs,
  emitCssPropertiesRs,
} from './css';
export { emitLibRs } from './lib';
export { emitTestsRs } from './tests/index';
