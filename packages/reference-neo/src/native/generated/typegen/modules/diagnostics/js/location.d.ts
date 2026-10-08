/**
 * Vendored typegen declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/location.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-typegen-dts.mjs
 */

/**
 * Location parsing for the diagnostics mirror: the file envelope plus the rendering channel.
 * Takes unknown wire payloads or constructor inputs and emits validated locations: file with its
 * resolved line and column, plus the cheap byte-offset span, labeled underlines, and help lines.
 * Every check mirrors the Rust template exactly, so both sides of napi accept and refuse together.
 */
import type { ByteSpan } from './generated/ByteSpan.js';
import type { Label } from './generated/Label.js';
/** Optional source location accepted by the `create*` constructors. */
export interface DiagnosticLocation {
    file?: string;
    line?: number;
    column?: number;
    span?: ByteSpan;
    labels?: Label[];
    help?: string[];
}
interface LocationInput {
    file?: unknown;
    line?: unknown;
    column?: unknown;
    span?: unknown;
    labels?: unknown;
    help?: unknown;
}
/** Parse and validate a location from unknown input, failing closed like Rust. */
export declare function parseLocation(record: LocationInput): DiagnosticLocation;
/** Build a byte-offset span; throws on non-integer, negative, or reversed offsets. */
export declare function createSpan(start: number, end: number): ByteSpan;
/** Build a labeled underline; throws on a bad span or a blank note. */
export declare function createLabel(span: ByteSpan, message: string): Label;
export {};
