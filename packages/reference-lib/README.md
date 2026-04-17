# @reference-ui/lib

Foundational design system package built on `@reference-ui/core`.

## Exports

- `@reference-ui/lib`: exports `baseSystem` for downstream `extends: [baseSystem]`
- `@reference-ui/lib/theme`: exports the plain theme objects used to build that system
- `@reference-ui/lib/icons`: exports generated Material Symbols components with `variant="outline" | "filled"`

## Usage

```bash
pnpm run sync   # Run ref sync once
pnpm run dev    # Watch mode
```

## Component playground ([React Cosmos](https://reactcosmos.org/))

Follows the [Vite getting started](https://reactcosmos.org/docs/getting-started/vite) layout: `react-cosmos-plugin-vite` in `cosmos.config.json`, and `cosmos` / `cosmos-export` scripts. `globalImports` loads `@reference-ui/react/styles.css` for Panda fixtures. On macOS, Node’s port probe can throw (`EADDRNOTAVAIL` for `0.0.0.0`); `portRetries` / `rendererUrl` avoid that upstream behavior so the dev server can start.

Run `ref sync` before Cosmos so `@reference-ui/react` exists. From the repo root: `pnpm run dev:lib`. Or `pnpm run sync` in this package, then `pnpm run cosmos`. Open [http://localhost:5000](http://localhost:5000). Static export: `pnpm run cosmos-export`.

```ts
import { baseSystem } from '@reference-ui/lib'
import { colors, fonts } from '@reference-ui/lib/theme'
import { SearchIcon } from '@reference-ui/lib/icons'
```
