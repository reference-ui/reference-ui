# STT-BAR-05 — named_barrel_package

Traces a consumer that re-exports and wraps a packaged barrel entrypoint.
Converted from fixtures/styletrace-consumer: the library is committed under
input/packages/fixture-style-library and compile remaps that tree to
node_modules, so the import resolves as an installed dependency.
Twins: `STT-WRAP-04` (single-file package), `STT-BAR-02`
(`export *` package barrel).
