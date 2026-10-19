# Compile

The compile entry calls native `compileSystem`.

```ts
import { compile } from '@reference-ui/rust/atomic'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/atomic'

declare const baseSystem: EvaluatedSystemSpec
const result = await compile({ baseSystem, rootDir: '/absolute/path/to/app' })

result.stylesheet // CSS → .reference-ui/styled/styles.css
result.css // CssRuntime → .reference-ui/styled/runtime-data.mjs
result.diagnostics
```

`compile()` accepts the legacy `{ baseSystem, … }` shape or the frozen
`{ schemaVersion: 2, spec, … }` shape. Foreign or malformed specs are
rejected with an error diagnostic (case `ATM-TOKEN-10`).

No OXC in JS. No walking virtual sources. Core's sync worker calls this as
the compile entry (`compileNative` in `@reference-ui/core`).

The sheet and `css()` cannot drift: both come from one `compile()`. See the crate
stylesheet and runtime stages.

Up: atomic JS.
