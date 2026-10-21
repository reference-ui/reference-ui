/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/members.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Member identity and dedupe helpers for tasty members.
 * Reads member ids and default values and drops duplicate members by id, keeping the last occurrence.
 */
import type { TastyMember } from './api-types.js';
export declare function getTastyMemberId(member: TastyMember): string;
export declare function dedupeTastyMembers(members: TastyMember[]): TastyMember[];
export declare function getTastyMemberDefaultValue(member: TastyMember): string | undefined;
