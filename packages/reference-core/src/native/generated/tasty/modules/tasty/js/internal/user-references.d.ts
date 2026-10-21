/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/user-references.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Dependency collection over a symbol's declared references.
 * Collects the symbol references a declaration depends on, so the resolver knows which symbols
 * to load. It walks heritage clauses, members, type parameters and every structured type node.
 * A type parameter or infer name is bound by its declaration, so it never counts as a dependency.
 */
import type { RawTastySymbolRef } from '../api-types.js';
import { type TastySymbolModel } from './type-guards.js';
export declare function collectUserOwnedReferencesFromSymbol(symbol: TastySymbolModel): RawTastySymbolRef[];
