/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/codes.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-atlas-dts.mjs
 */

/**
 * Wire-code vocabulary for diagnostics: the template namespace, the registered namespace table, and code validation.
 * Takes unknown input at the boundary and returns a valid `NS-SEV-NAME` code, or throws `DiagnosticParseError` with the reason.
 * Registration is advisory: a well-shaped code from an unlisted namespace still parses, so consumers keep reading newer codes.
 * The error class lives here so the location and diagnostic modules share one failure type without importing the barrel.
 */
/** Wire code text (`NS-SEV-NAME`); validated by `parseCode`, not by the type. */
export type DiagnosticCode = string;
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
