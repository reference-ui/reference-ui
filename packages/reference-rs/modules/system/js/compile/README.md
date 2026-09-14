# Compile

The Node entry that will call native `compile_system`.

Intended shape (not implemented, not in `package.json` exports):

```ts
import { compile } from '@reference-ui/rust/system'

const result = await compile('/absolute/path/to/app', {
  // SystemConfig JSON core already almost has as panda config
})

result.stylesheet // CSS → .reference-ui/styled/styles.css
result.css // CssRuntime → .reference-ui/styled/css
result.diagnostics
```

Copy `js/atlas/analyzer.ts`: resolve `rootDir`, JSON-serialize config,
call the binding, parse `ts-rs` types back.

No OXC in JS. No walking `virtual/`. Core’s sync worker calls this
instead of spawning Panda — **after** matrix parity, not before.

Panda’s split (CSS compile vs codegen) is **inside** this one function
so the sheet and `css()` cannot drift. See crate `src/stylesheet` and
`src/runtime`.

## Files (when coded)

- `index.ts` — `compile`, maybe `compileWatch` later (`matrix/watch`)
- Types re-exported from `../generated`

## Must not

- Start Parcel / Piscina / Liquid.
- Write `.reference-ui/virtual/**`.
- Return a `tables` field. The runtime artifact is `css`.
- Be a second stylesheet printer.
