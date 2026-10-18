/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/index.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-atlas-dts.mjs
 */

/**
 * Atlas public entry: analysis functions plus inventory and diagnostic types.
 * Takes project roots with optional configs and emits component lists or
 * detailed results with template diagnostics. Callers needing failure modes
 * use `analyzeDetailed()`; `analyze()` returns components only for convenience.
 */
export { analyze, analyzeDetailed } from './analyzer.js';
export type { AtlasAnalysisResult, AtlasDiagnostic, AtlasDiagnosticCode, Component, ComponentInterface, ComponentProp, AtlasConfig, ObserveSpec, ObservedElement, Usage, } from './types.js';
