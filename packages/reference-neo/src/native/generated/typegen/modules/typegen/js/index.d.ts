/**
 * Vendored typegen declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/typegen/js/index.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-typegen-dts.mjs
 */

import type { EmitDtsOptions, EvaluatedSystemSpec, PrimitivesVocabulary, PropValueDomain, TypegenDetailedEmit, TypegenDiagnostic, TypegenDiagnosticCode } from './types.js';
export type { EmitDtsOptions, EvaluatedSystemSpec, PrimitivesVocabulary, PropValueDomain, TypegenDetailedEmit, TypegenDiagnostic, TypegenDiagnosticCode, };
export declare function emitDtsSync(options: EmitDtsOptions): string;
export declare function emitDtsDetailed(options: EmitDtsOptions): TypegenDetailedEmit;
export declare function primitivesVocabulary(): PrimitivesVocabulary;
export declare function emitDts(options: EmitDtsOptions): Promise<string>;
export declare function emitDetailed(options: EmitDtsOptions): Promise<TypegenDetailedEmit>;
