# Tasty cases

Each direct subfolder of this directory is one test case. A case owns its local
TypeScript input, its Vitest assertions, and its generated output.

When you run the Tasty test suite:

- Each case is scanned with the glob `{case_name}/input/**/*.{ts,tsx}`.
- Output is written back into that same case under `output/`, including `bundle.js` and `perf-metrics.txt`.
- Each case keeps its own `bundle.test.ts` beside the fixture source.

So:

- `generics/` → type parameters, type arguments, object type literals.
- `external_libs/` → node_modules resolution (csstype, json-schema), extends, descriptions.
- `signatures/` → readonly, optional, method/call/index signatures, array/tuple/intersection (§4.2–4.3).
- `unions_literals/` → union types, literal types, optional members.
- `tsx/` → .tsx file scanning (interfaces and type aliases from TSX).
- `default_params/` → type parameters with default (e.g. `T = string`).
- `unknown_complex/` → mapped and conditional types (structural, with nested unsupported pieces still emitted as Raw when needed).

Add a new case folder to add a new scenario. The test suite will automatically
scan `input/`, write `output/bundle.js` and `output/perf-metrics.txt`, and run
that case's `bundle.test.ts`.

Shared setup (`package.json`, `package-lock.json`, `node_modules`) lives one
level up at `tests/tasty/`; each case folder contains only its scenario-specific
files.
