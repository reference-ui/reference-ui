/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/members.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { TastyMember } from './api-types.js';
export declare function getTastyMemberId(member: TastyMember): string;
export declare function dedupeTastyMembers(members: TastyMember[]): TastyMember[];
export declare function getTastyMemberDefaultValue(member: TastyMember): string | undefined;
