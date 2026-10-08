/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/types.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

/**
 * Atlas public types: the component inventory plus template diagnostics.
 * Takes the generated wire shapes and re-exports them with the stable
 * diagnostic vocabulary (`ATL-W-*` warnings, `ATL-E-*` errors) every
 * consumer filters by. Diagnostics ride the shared template Diagnostic;
 * the code union pins the four atlas failure classes for typed callers.
 */
export type { AtlasAnalysisResult } from './generated/AtlasAnalysisResult.js';
export type { AtlasConfig } from './generated/AtlasConfig.js';
export type { Diagnostic as AtlasDiagnostic } from '../../diagnostics/js/index.js';
export type AtlasDiagnosticCode = 'ATL-W-UNRESOLVED-PROPS-TYPE' | 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION' | 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE' | 'ATL-E-SCAN-FAILED' | 'ATL-W-PACKAGE-SCAN-FAILED';
export type { Component } from './generated/Component.js';
export type { ComponentInterface } from './generated/ComponentInterface.js';
export type { ComponentProp } from './generated/ComponentProp.js';
export type { Usage } from './generated/Usage.js';
