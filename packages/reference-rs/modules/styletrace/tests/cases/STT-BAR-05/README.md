# STT-BAR-05 — A consumer that re-exports a packaged barrel and wraps it locally traces both the local wrapper and the re-exported package name

Traces a consumer that re-exports and wraps a packaged barrel entrypoint.
Converted from fixtures/styletrace-consumer: the library is committed under
input/packages/fixture-style-library and compile remaps that tree to
node_modules, so the import resolves as an installed dependency.
Twins: `STT-WRAP-04` (single-file package), `STT-BAR-02`
(`export *` package barrel).
