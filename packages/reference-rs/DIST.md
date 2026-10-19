# reference-rs — one build folder (`dist/`)

All generated output lives under `packages/reference-rs/dist/`. Crate source
lives under `modules/` (the cdylib is `modules/runtime`); nothing generated
sits beside it. No `target/`, `npm/`, `artifacts/`, or `native/` at the
package root.

```text
packages/reference-rs/
├── modules/                        SOURCE — runtime (cdylib + JS host), shared, products
└── dist/                           ALL generated output (gitignored)
    ├── *.mjs, *.d.ts               esbuild bundle + tsc declarations (`"exports"`)
    ├── native/                     local .node + .inputs.sha256 stamps
    ├── cargo/                      CARGO_TARGET_DIR (rustc scratch, never ships)
    ├── npm/                        napi platform-package staging
    └── artifacts/                  napi artifacts collect for CI
```

## Producers

| Subtree | Producer | Consumer |
| --- | --- | --- |
| `dist/*.mjs` | esbuild (`scripts/build-bundle.mjs`, 12 entries; `system` aliases `atomic`) | `"exports"` |
| `dist/*.d.ts`, `dist/modules/`, `dist/contracts/` | `tsc -p tsconfig.build.json` + `create-dts-entrypoints.mjs` | `"exports"` types |
| `dist/native/*.node` | `napi build --output-dir dist/native` (`build:native`) | `runtime/loader.ts` |
| `dist/cargo/` | rustc via `.cargo/config.toml` `target-dir` | cargo / napi compile |
| `dist/npm/` | `napi create-npm-dirs --npm-dir dist/npm` | `publish-native.ts` → `@reference-ui/rust-<triple>` |
| `dist/artifacts/` | `napi artifacts --output-dir dist/artifacts` | CI collect → optional packages |

The bundle clean wipes JS only: `cargo`, `native`, `npm`, `artifacts` are
preserved across rebuilds. `package.json` `"files"` packs the JS, types, and
`dist/native`, never `dist/cargo` or `dist/artifacts`.

## Load order

`runtime/loader.ts` resolves `dist/native/reference-native.<triple>.node`
first, then the installed `@reference-ui/rust-<triple>` optional dep.
`REFERENCE_UI_NATIVE_PATH` overrides with one explicit file.
`verify:native` (prepack) fails closed on a stale or unstamped binary, so a
pack never ships a `.node` built from older sources.
