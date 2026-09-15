# Compile

The Node entry that calls native `compileSystem`.

```ts
import { compile } from '@reference-ui/rust/atomic'

const result = await compile({ rootDir: '/absolute/path/to/app' })

result.stylesheet // CSS → .reference-ui/styled/styles.css
result.css // CssRuntime → .reference-ui/styled/css
result.diagnostics
```

No OXC in JS. No walking `virtual/`. Core's sync worker calls this as
the compile entry — **after** matrix parity, not before.

The sheet and `css()` cannot drift: both come from one `compile()`. See crate
`src/stylesheet` and `src/runtime`.
