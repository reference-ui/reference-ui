# named_barrel_package

Traces a consumer that re-exports and wraps a packaged barrel entrypoint.
Converted from fixtures/styletrace-consumer: the library is committed under
input/packages/fixture-style-library and compile remaps that tree to
node_modules, so the import resolves as an installed dependency.
Twins: `node_modules_wrapper` (single-file package), `export_star_package`
(`export *` package barrel).
