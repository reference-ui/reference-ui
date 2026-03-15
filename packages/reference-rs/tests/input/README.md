# TypeScript scanner fixture input

Each **direct subfolder** of this directory is a **scenario**. When you run the TypeScript scanner tests:

- Each scenario folder is scanned with the glob `{folder_name}/**/*.{ts,tsx}`.
- Output mirrors the structure: one folder per scenario under `../output/`, with `bundle.js` and `bundle-metrics.txt` inside.

So:

- `scan_here/` → scan `scan_here/**/*.{ts,tsx}` → `../output/scan_here/bundle.js` and `../output/scan_here/bundle-metrics.txt`
- Add a new folder (e.g. `scan_forms/`) to add a new scenario; the test suite will automatically scan it and write `../output/scan_forms/bundle.js`.

Shared setup (e.g. `package.json`, `node_modules`) lives in this directory; scenario folders contain only the TypeScript (and re-exports) for that scenario.
