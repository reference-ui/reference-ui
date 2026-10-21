/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/type-guards.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Type guards over raw tasty symbols and type references.
 * Type guards that tell raw symbols, interfaces, type aliases and type references apart. This is
 * a leaf module with type-only imports, so every other internal module can depend on it safely.
 */
import type { RawTastyInterfaceSymbol, RawTastySymbol, RawTastyTypeAliasSymbol, RawTastyTypeRef, RawTastyTypeReference } from '../api-types.js';
export type TastySymbolModel = RawTastySymbol;
export declare function isInterfaceSymbol(symbol: TastySymbolModel): symbol is RawTastyInterfaceSymbol;
export declare function isTypeAliasSymbol(symbol: TastySymbolModel): symbol is RawTastyTypeAliasSymbol;
export declare function isTypeReference(typeRef: RawTastyTypeRef): typeRef is RawTastyTypeReference;
export declare function isRawStructuredTypeRef(typeRef: RawTastyTypeRef): typeRef is Extract<RawTastyTypeRef, {
    kind: 'raw';
}>;
