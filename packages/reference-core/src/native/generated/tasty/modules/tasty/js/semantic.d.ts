/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/semantic.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Semantic-kind classification for tasty members and types.
 * Maps members and type references to a coarse TastySemanticKind for renderers, inferring literal kinds from values and collapsing single-kind unions.
 */
import type { TastyMember, TastyTypeRef } from './api-types.js';
export type TastySemanticKind = 'unknown' | 'function' | 'constructor' | 'index' | 'boolean' | 'number' | 'string' | 'array' | 'tuple' | 'object' | 'intersection' | 'indexed_access' | 'type_query' | 'conditional' | 'mapped' | 'template_literal' | 'union' | 'intrinsic' | 'reference' | 'raw';
export declare function getTastyMemberSemanticKind(member: TastyMember): TastySemanticKind;
export declare function getTastyTypeSemanticKind(type: TastyTypeRef | undefined): TastySemanticKind;
export declare function getTastyLiteralSemanticKind(value: string | undefined): TastySemanticKind;
