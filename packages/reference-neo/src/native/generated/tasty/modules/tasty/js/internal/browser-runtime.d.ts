/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/browser-runtime.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type { CreateTastyBrowserRuntimeOptions, TastyApi, TastyBrowserRuntime, TastyRuntimeModule } from '../api-types.js';
export declare class TastyBrowserRuntimeImpl implements TastyBrowserRuntime {
    private readonly options;
    private runtimeModulePromise;
    private runtimeModule;
    private apiPromise;
    private api;
    constructor(options: CreateTastyBrowserRuntimeOptions);
    ready(): Promise<void>;
    getApi(): TastyApi | undefined;
    loadRuntimeModule(): Promise<TastyRuntimeModule>;
    loadApi(): Promise<TastyApi>;
}
export declare function createTastyBrowserRuntime(options: CreateTastyBrowserRuntimeOptions): TastyBrowserRuntime;
