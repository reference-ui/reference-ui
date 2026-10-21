/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/jsdoc.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * JSDoc helpers for tasty members and inline values.
 * Parses @param tag text into name/description pairs, strips quotes from inline literal values, and collects per-parameter descriptions from a member.
 */
import type { TastyMember } from './api-types.js';
export declare function parseTastyParamTag(value: string | undefined): [string, string] | null;
export declare function normalizeTastyInlineValue(value: string | undefined): string | undefined;
export declare function getTastyJsDocParamDescriptions(member: TastyMember): Map<string, string>;
