/**
 * Vendored styletrace declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/generated/Diagnostic.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-styletrace-dts.mjs
 */

import type { Severity } from "./Severity.js";
/**
 * One structured diagnostic: severity, validated code, rich-text message, plus optional location.
 * Serializes camelCase (`severity`, `code`, `message`, `file`, `line`, `column`) to match the atomic wire shape.
 */
export type Diagnostic = {
    /**
     * Warning or error; the code tag must agree.
     */
    severity: Severity;
    /**
     * Validated `NS-SEV-NAME` identity, always present and documented in `REGISTRY.md`.
     */
    code: string;
    /**
     * Rich-text canvas: non-empty, producer-styled, first line a complete subject.
     */
    message: string;
    /**
     * Source path when the failure has one; absent for request-level diagnostics.
     */
    file?: string;
    /**
     * One-based line within `file`, when known.
     */
    line?: number;
    /**
     * One-based column within `line`, when known.
     */
    column?: number;
};
