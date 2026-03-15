# TypeScript scanner fixture input

Each **direct subfolder** of this directory is a **scenario**. When you run the TypeScript scanner tests:

- Each scenario folder is scanned with the glob `{folder_name}/**/*.{ts,tsx}`.
- Output mirrors the structure: one folder per scenario under `../output/`, with `bundle.js` and `bundle-metrics.txt` inside.

So:

- `generics/` → scan `generics/**/*.{ts,tsx}` → `../output/generics/bundle.js` (type parameters, type arguments).
- `external_libs/` → scan `external_libs/**/*.{ts,tsx}` → `../output/external_libs/bundle.js` (external packages in node_modules: csstype, json-schema, etc.).
- `signatures/` → scan `signatures/**/*.{ts,tsx}` → `../output/signatures/bundle.js` (readonly, method/call/index signatures, array/tuple/intersection types; see §4.2–4.3).
- Add a new folder to add a new scenario; the test suite will automatically scan it and write `../output/{scenario}/bundle.js`. Add a matching `bundle.{scenario}.test.ts` to assert on it.

Shared setup (e.g. `package.json`, `node_modules`) lives in this directory; scenario folders contain only the TypeScript (and re-exports) for that scenario.
