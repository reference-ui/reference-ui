# Compile

The Node entry that calls native `compileSystem`.

```ts
import { compile } from '@reference-ui/rust/atomic'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/atomic'

declare const baseSystem: EvaluatedSystemSpec
const result = await compile({ baseSystem, rootDir: '/absolute/path/to/app' })

result.stylesheet // CSS → .reference-ui/styled/styles.css
result.css // CssRuntime → .reference-ui/styled/css
result.diagnostics
```

`baseSystem` is required. Foreign or malformed specs are rejected with an
error diagnostic (station `ATM-TOKEN-10`); a missing spec throws.

No OXC in JS. No walking `virtual/`. Core's sync worker calls this as
the compile entry — **after** matrix parity, not before.

The sheet and `css()` cannot drift: both come from one `compile()`. See crate
`src/stylesheet` and `src/runtime`.
