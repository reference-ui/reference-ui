# Runtime JS face

Host-side entrypoint for the native addon. `index.ts` re-exports the loader, the native dispatch helpers, and platform diagnostics. `loader.ts` resolves the platform `.node` binary (with `REFERENCE_UI_NATIVE_PATH` as the explicit override) and returns null when it cannot load; `native.ts` turns that into fail-safe JSON dispatch with consistent diagnostics; `unavailable-message.ts` builds the consumer-facing sentence when the addon is unusable.
