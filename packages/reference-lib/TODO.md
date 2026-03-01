# reference-lib TODO

`@reference-ui/lib` is the first-party design system built on reference-core. It is the dogfooding
case for the design system platform.

Users consume it as:

```ts
import { baseSystem } from '@reference-ui/lib'
```

---

## Step 1 — extends: [baseSystem]

This is the only thing in scope right now.

### reference-core must ship first

`ref sync` needs a new output step — `createBaseSystem` — that:

1. Collects all `extend*` registrations from `src/styled/`
2. Merges any upstream `baseSystem` declared in `ui.config.ts` under `extends`
3. Emits `dist/baseSystem.mjs` as a plain ESM object

### reference-lib wires up

Once that output exists:

```ts
// ui.config.ts
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui',
  extends: [],  // no upstream — reference-lib is the root
})
```

```ts
// src/styled/theme/colors.ts
import { extendTokens } from '@reference-ui/core'

extendTokens({
  colors: {
    // Reference UI colour scale goes here
  },
})
```

```ts
// src/index.ts
export { baseSystem } from '../dist/baseSystem.mjs'
```

### Done when

reference-app can do this and tokens resolve:

```ts
import { baseSystem } from '@reference-ui/lib'
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  extends: [baseSystem],
})
```
