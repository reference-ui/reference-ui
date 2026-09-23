/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/semantic.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { TastyMember, TastyTypeRef } from './api-types.js';
export type TastySemanticKind = 'unknown' | 'function' | 'constructor' | 'index' | 'boolean' | 'number' | 'string' | 'array' | 'tuple' | 'object' | 'intersection' | 'indexed_access' | 'type_query' | 'conditional' | 'mapped' | 'template_literal' | 'union' | 'intrinsic' | 'reference' | 'raw';
export declare function getTastyMemberSemanticKind(member: TastyMember): TastySemanticKind;
export declare function getTastyTypeSemanticKind(type: TastyTypeRef | undefined): TastySemanticKind;
export declare function getTastyLiteralSemanticKind(value: string | undefined): TastySemanticKind;
