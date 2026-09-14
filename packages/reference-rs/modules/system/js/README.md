# System JS API

Atlas-thin Node face of `crates/system`.

Rust owns the compiler. This directory is path normalization, one native
call, and `ts-rs` types. Same thickness as `js/atlas` (`analyzer.ts` +
`generated/`).

Nothing is exported from `@reference-ui/rust` yet. No `package.json`
subpath, no `tsup` entry, until `crates/napi` has `compile_system` and
this folder has a real `index.ts`.

Crate blueprint: `packages/reference-rs/crates/system/README.md`.
Vendor map: `packages/reference-rs/crates/system/PANDA.md`.

## Shape

```
reference-core sync
        │
        ▼
js/system/compile.ts     →  N-API compile_system  →  crates/system
        │                                            │
        │                     ┌──────────────────────┤
        │                     ▼                      ▼
        │              stylesheet                 css
        │         (styles.css text)        (css() lookup)
        ▼                     │                      │
        └─────────────────────┴──────────────────────┘
                              ▼
              .reference-ui/styled/styles.css
              .reference-ui/styled/css
```

There is no `tables/` folder. There is no IR folder. There is no rule
folder. Panda’s two artifacts are `styles.css` and `styled-system/css`.
Ours are `stylesheet` and `css`. JS does not own a third product.

```ts
import { compile } from '@reference-ui/rust/system'

const result = await compile('/absolute/path/to/app', config)

result.stylesheet // CSS text
result.css // CssRuntime — (prop, value, when) → class
result.diagnostics
```

JS does not expand `borderBottom`. JS does not fold ternaries. JS does
not name classes. `css()` in the browser concatenates names this result
already spelled.

`js/styletrace` stays its own subpath.

## Layout

| Path         | Job                                                                        |
| :----------- | :------------------------------------------------------------------------- |
| `compile/`   | Future `compile(root, config)` — Atlas `analyzer.ts`                       |
| `generated/` | `ts-rs` from `crates/system` (`CompileResult`, `CssRuntime`, `Diagnostic`) |

When this becomes code: `compile/index.ts` (or `js/system/index.ts` like
`js/styletrace/index.ts`). `generated/` is empty until Rust types exist.

## Panda

Host write sinks live in `vendor/panda/packages/compiler` / CLI — they
take `pandacss_stylesheet` + `pandacss_codegen` output and write
`styled-system/`. Core’s sync worker is that host. This JS is only the
binding, like `js/atlas/analyzer.ts`, not a second compiler.

## Must not

- Implement resolve in TypeScript.
- Export `@reference-ui/rust/system` before napi exists.
- Delete `@reference-ui/rust/styletrace`.
- Talk to `.reference-ui/virtual/`.
- Dual-write Panda classes and system classes into one stylesheet.
- Invent a `tables/` / `ir/` / `rule/` directory.

## Testing

The binding exists so the engine can be **scored without `reference-core`**.
That is the point of this folder in v1, not integration.

- `tests/system/cases/<case>/` — golden cases: `input/app/**.tsx` in,
  `output/{styles.css,css.json,diagnostics.json}` out. Copy the layout in
  `tests/atlas/cases/README.md`.
- A Panda v1 differential case family: same sources, both engines, diff
  declarations and atom coverage.
- `cargo test -p system` for crate internals, in-memory.
- Matrix is the **integration** gate that comes after those, not the first
  proof. `compile()` returning correct CSS for a fixture app is what unblocks
  wiring core — not the reverse.
