/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/runtime.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

export interface TastyDiagnostic {
    severity: 'warning' | 'error';
    code: string;
    message: string;
    file?: string;
    line?: number;
    column?: number;
}
export interface EmittedModulesPayload {
    modules: Record<string, string>;
    type_declarations: Record<string, string>;
    diagnostics?: TastyDiagnostic[];
}
export declare const TASTY_NATIVE_EXPORTS: readonly ['scanAndEmitModules'];
export interface TastyNative {
    scanAndEmitModules(rootDir: string, include: string[]): string;
}
export declare function scanAndEmitModules(rootDir: string, include: string[]): Partial<EmittedModulesPayload>;
