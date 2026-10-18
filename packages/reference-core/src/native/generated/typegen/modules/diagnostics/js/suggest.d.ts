/**
 * Vendored typegen declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/suggest.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-typegen-dts.mjs
 */

/**
 * Did-you-mean suggestions for unknown names, gated by the diagnostic codes that may carry one.
 * Takes a diagnostic code, the unknown name, and the candidate names, and emits the closest candidate within budget or undefined.
 * Mirrors the Rust helper exactly: the code list decides whether suggesting is legitimate, and the edit distance decides whether a candidate is near enough.
 */
/**
 * Codes whose failure is an unknown name drawn from a finite known set: the only codes
 * `suggestForCode` will suggest for. Mirrors the Rust gate exactly; opaque names and every
 * other failure class stay silent even when a candidate looks near.
 */
export declare const SUGGESTION_CODES: readonly string[];
/** Whether `code` may carry a did-you-mean suggestion: membership in `SUGGESTION_CODES`. */
export declare function supportsSuggestions(code: string): boolean;
/**
 * Pick the closest candidate for one diagnostic code, or undefined when the code is not a
 * suggestion code or all candidates are far off. Modules wire their own known sets as
 * `candidates`; the gate decides whether suggesting is legitimate, the distance decides
 * whether any candidate is near enough.
 */
export declare function suggestForCode(code: string, unknown: string, candidates: string[]): string | undefined;
/**
 * Pick the closest candidate to an unknown name, or undefined when all are far off.
 * Mirrors the Rust helper exactly: within a third of the name, minimum three edits.
 */
export declare function suggest(unknown: string, candidates: string[]): string | undefined;
