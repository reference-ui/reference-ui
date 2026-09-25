/**
 * Vendored styletrace declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/index.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-styletrace-dts.mjs
 */

/**
 * TypeScript mirror of the reference-rs diagnostics template: one representation, one transport.
 * Takes napi JSON payloads (single diagnostics or batches) and validates the same contract Rust enforces.
 * Emits parsed diagnostics plus one-line rendering and the message-pattern helpers, so both sides of the
 * boundary construct, carry, and display identical values. Codes validate in `parseCode`, never in the type.
 */
import type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic.js';
export type { Severity } from './generated/Severity.js';
export type { Diagnostic as GeneratedDiagnostic } from './generated/Diagnostic.js';
/** Wire code text (`NS-SEV-NAME`); validated by `parseCode`, not by the type. */
export type DiagnosticCode = string;
/** Parsed diagnostic: the generated wire shape, guaranteed valid by construction or `parseDiagnostic`. */
export type Diagnostic = GeneratedDiagnostic;
/** Optional source location accepted by the `create*` constructors. */
export interface DiagnosticLocation {
    file?: string;
    line?: number;
    column?: number;
}
/** Namespace owned by the template itself; mirrors `TEMPLATE_NAMESPACE` in Rust. */
export declare const TEMPLATE_NAMESPACE = "RS";
/**
 * Machine-readable copy of the REGISTRY.md namespace table; mirrors `REGISTERED_NAMESPACES`.
 * Advisory only: parsing stays shape-open so consumers keep reading newer codes.
 */
export declare const REGISTERED_NAMESPACES: readonly string[];
/** A payload that failed template validation, carrying the reason. */
export declare class DiagnosticParseError extends Error {
    name: string;
}
/** Parse and validate a wire code; anything off-shape throws with the reason. */
export declare function parseCode(input: unknown): DiagnosticCode;
/** Namespace segment of a validated code, e.g. `ATM`. */
export declare function codeNamespace(code: DiagnosticCode): string;
/** Severity tag a code was minted with: `W` or `E`. */
export declare function codeSeverityTag(code: DiagnosticCode): 'W' | 'E';
/** Advisory check against the registry table; unregistered but well-shaped codes still parse. */
export declare function isRegisteredNamespace(code: DiagnosticCode): boolean;
/** Build a warning; throws `DiagnosticParseError` on a bad code, tag mismatch, or blank message. */
export declare function createWarning(code: string, message: string, location?: DiagnosticLocation): Diagnostic;
/** Build an error; throws `DiagnosticParseError` on a bad code, tag mismatch, or blank message. */
export declare function createError(code: string, message: string, location?: DiagnosticLocation): Diagnostic;
/** Parse one diagnostic from unknown input (object or JSON string), failing closed like Rust. */
export declare function parseDiagnostic(input: unknown): Diagnostic;
/** Parse a batch from unknown input (array or JSON string); any bad row refuses the batch. */
export declare function parseBatch(input: unknown): Diagnostic[];
/** Encode one diagnostic to its wire JSON. */
export declare function encodeDiagnostic(diagnostic: Diagnostic): string;
/** Encode a batch for transport; `parseBatch` of the result round-trips. */
export declare function encodeBatch(diagnostics: Diagnostic[]): string;
/** Whether the diagnostic is a warning. */
export declare function isWarning(diagnostic: Diagnostic): boolean;
/** Whether the diagnostic is an error. */
export declare function isError(diagnostic: Diagnostic): boolean;
/**
 * Render `{file}:{line}:{col} {code} {subject}` for one-line display (CLI rows, log lines).
 * Uses the message's first line only; unlocated diagnostics print just `{code} {subject}`.
 */
export declare function renderOneLine(diagnostic: Diagnostic): string;
/** Render location plus code plus the full multi-line message (verbose display, reports). */
export declare function renderFull(diagnostic: Diagnostic): string;
/** Wrap a code subject (token path, prop, file) in backticks: `` `colors.navy` ``. */
export declare function inlineCode(value: string): string;
/** Append producer guidance as a trailing line: `hint: token paths are dotted pairs`. */
export declare function hint(text: string): string;
/** Suggest the closest known name: `` did you mean `colors.navy-500`? ``. */
export declare function didYouMean(known: string): string;
/** Join message lines with newlines; line one stays the complete subject. */
export declare function joinLines(lines: string[]): string;
/**
 * Pick the closest candidate to an unknown name, or undefined when all are far off.
 * Mirrors the Rust helper exactly: within a third of the name, minimum three edits.
 */
export declare function suggest(unknown: string, candidates: string[]): string | undefined;
