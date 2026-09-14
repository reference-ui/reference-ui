# Atomic JS API

Atlas-thin Node face of the `atomic` crate.

Rust owns the compiler. This directory is path normalization, one native
call, and the request/result types. Same thickness as `js/atlas`.

```
reference-core sync
        │
        ▼
js/index.ts  →  N-API compileSystem  →  atomic crate
        │                                    │
        │                     ┌──────────────┤
        │                     ▼              ▼
        │              stylesheet           css
        │         (styles.css text)   (css() lookup)
        ▼                     │              │
        └─────────────────────┴──────────────┘
                              ▼
              .reference-ui/styled/styles.css
              .reference-ui/styled/css
```

```ts
import { compile } from '@reference-ui/rust/atomic'
// live wire still: import { compileSync } from '@reference-ui/rust/system'

const result = await compile({ rootDir, files })

result.stylesheet
result.css
result.diagnostics
```

JS does not expand `borderBottom`, fold ternaries, or name classes. Browser
`css()` concatenates names this result already printed. Ghost class is a P0.

N-API stays `compileSystem` so the native binary does not move with the
folder rename.
