/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/display.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Display formatting for tasty callable and inline types.
 * Formats function and constructor signatures as text and collects the inline variant strings of unions, literals, booleans, and raw summaries.
 */
import type { TastyTypeRef } from './api-types.js';
export declare function formatTastyCallableSignature(type: TastyTypeRef): string;
export declare function getTastyTypeInlineVariants(type: TastyTypeRef | undefined): string[];
