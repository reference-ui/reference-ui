/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/artifact-modules.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Validators for the modules the artifact importer returns.
 * Validates what artifact modules export: the manifest, the browser runtime module and chunk
 * symbols. Each extractor returns a typed value or throws a message that names the export it
 * expected, so a malformed artifact fails at load time rather than later.
 */
import type { RawTastyManifest, TastyRuntimeModule } from '../api-types.js';
import type { TastySymbolModel } from './type-guards.js';
export type ModuleNamespace = Record<string, unknown>;
export declare function normalizeModuleNamespace(value: unknown): ModuleNamespace;
export declare function extractManifest(value: unknown): RawTastyManifest;
export declare function extractChunkSymbol(moduleValue: ModuleNamespace, symbolId: string): TastySymbolModel;
export declare function extractTastyRuntimeModule(value: unknown): TastyRuntimeModule;
