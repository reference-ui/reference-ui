# TypeScript scanner fixture input

Each **direct subfolder** of this directory is a **scenario**. When you run the TypeScript scanner tests:

- Each scenario folder is scanned with the glob `{folder_name}/**/*.{ts,tsx}`.
- Output mirrors the structure: one folder per scenario under `../output/`, with `bundle.js` and `bundle-metrics.txt` inside.

So:

- `generics/` → type parameters, type arguments, object type literals.
- `external_libs/` → node_modules resolution (csstype, json-schema), extends, descriptions.
- `signatures/` → readonly, optional, method/call/index signatures, array/tuple/intersection (§4.2–4.3).
- `unions_literals/` → union types, literal types, optional members.
- `tsx/` → .tsx file scanning (interfaces and type aliases from TSX).
- `default_params/` → type parameters with default (e.g. `T = string`).
- `unknown_complex/` → mapped and conditional types (emitted as Raw with summary).

Add a new folder to add a new scenario; the test suite will automatically scan it and write `../output/{scenario}/bundle.js`. Add a matching `bundle.{scenario}.test.ts` to assert on it.

Shared setup (e.g. `package.json`, `node_modules`) lives in this directory; scenario folders contain only the TypeScript (and re-exports) for that scenario.
