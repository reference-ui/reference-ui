/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/browser-runtime.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Browser entry point for the tasty runtime.
 * Takes a caller-supplied module loader plus manifest URL, loads the runtime module once, and builds the shared TastyApi from its manifest.
 * Caches both promises and clears them on failure so a retry reloads.
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
