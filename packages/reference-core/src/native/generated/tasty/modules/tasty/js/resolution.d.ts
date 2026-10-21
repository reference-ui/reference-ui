/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/resolution.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Follows the resolved chain of a TastyTypeRef to its settled type.
 * Takes a possibly wrapped reference and returns the deepest type with no further resolution, or undefined when the chain ends empty.
 */
import type { TastyTypeRef } from './api-types.js';
export declare function getTastyResolvedType(typeRef: TastyTypeRef | undefined): TastyTypeRef | undefined;
