/**
 * Vendored styletrace declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/styletrace/js/index.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-styletrace-dts.mjs
 */

import type { Diagnostic as StyletraceDiagnostic } from '../../diagnostics/js/index.js';
export interface TracedBinding {
    module: string;
    name: string;
}
export type { StyletraceDiagnostic };
export type StyletraceDiagnosticCode = 'STT-W-SKIPPED-FILE' | 'STT-E-SCAN-FAILED' | 'STT-E-UNRESOLVED-SURFACE';
export interface StyletraceDetailedResult {
    bindings: TracedBinding[];
    diagnostics: StyletraceDiagnostic[];
}
export declare function traceBindings(sourceRoot: string, declarationRoot?: string): Promise<TracedBinding[]>;
export declare function trace(rootDir: string, syncRootHint?: string): Promise<string[]>;
export declare function traceDetailed(sourceRoot: string, declarationRoot?: string): Promise<StyletraceDetailedResult>;
