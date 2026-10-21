/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/runtime-errors.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Error constructors for the Tasty runtime.
 * Builds the Error values the runtime raises: a message with its cause attached, and an
 * ambiguous bare-name lookup that lists each candidate by id and library. Leaf module with
 * no runtime imports.
 */
import type { TastySymbolSearchResult } from '../api-types.js';
export declare function wrapRuntimeError(prefix: string, error: unknown): Error;
export declare function createAmbiguousSymbolNameError(name: string, matches: TastySymbolSearchResult[]): Error;
export declare function formatSymbolCandidate(result: TastySymbolSearchResult): string;
