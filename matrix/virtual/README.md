# Virtual Matrix

This package is the matrix-owned contract for Reference UI virtual file output.

It proves:

- `.reference-ui/virtual` is created from the package include surface
- virtual output mirrors the source tree without orphaned or missing files
- virtual transforms rewrite `css()` and `recipe()` authoring to runtime imports
- MDX sources materialize as JSX in the virtual output

Runner contract:

- tests live under `tests/unit`
- the package runs with full `ref sync` before tests
- Vitest owns the assertions because the contract is filesystem- and transform-focused