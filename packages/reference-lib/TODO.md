# reference-lib TODO

`@reference-ui/lib` is the first-party design system built on reference-core. It is the dogfooding
case for the design system platform.

Users consume it as:

```ts
import { baseSystem } from '@reference-ui/lib'
```

reference-lib is the **original consumer** of reference-core. It adds colours, components, and
the opt-in design layer on top of the framework. reference-core provides the CLI and `extend*`
API; reference-lib publishes the **baseSystem** (bundled config) that `extends[]` reads.

---

## Step 1 — extends: [baseSystem]

This is the only thing in scope right now.

### reference-core must ship first

See `packages/reference-core/src/cli/TODO.md` for the CLI work. In short, `ref sync` needs:

1. `createBaseSystem` — collects `extend*` registrations (from core + lib), merges `extends`, emits `cwd/dist/baseSystem.mjs` (the bundled config)
2. `createPandaConfig` — updated to merge `config.extends` for consumers (e.g. reference-app)
3. Config types — `name`, `extends`, `BaseSystem`

When reference-lib runs `ref sync`, `cwd` is reference-lib; output goes to `reference-lib/dist/baseSystem.mjs`.

### reference-lib wires up

Once that output exists:

```ts
// ui.config.ts
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui',
  extends: [], // no upstream — reference-lib is the root
  include: ['src/**/*.{ts,tsx}'],
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
