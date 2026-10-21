/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/hints.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-atlas-dts.mjs
 */

/**
 * Author-facing fix hints for warning codes: the one-line remedy the verbose diagnostic list prints under a warning.
 * Takes a warning code and emits its fix line, or undefined when no hint is recorded for that code.
 * Only warnings appear in the table, because infos are compiler telemetry with no author action.
 */
/** The fix hint for a warning code, or undefined when the code has none. */
export declare function warningHintFor(code: string | undefined): string | undefined;
