import { defineConfig } from '@reference-ui/core'
import { baseSystem as libSystem } from '@reference-ui/lib/baseSystem'
import { baseSystem as aliasedHostSystem } from '@fixtures/aliased-host-library'

/**
 * T17 — consumer style props on prebuilt components.
 *
 * Topology (identical to T16):
 *   @reference-ui/lib  ──▶ extend ──┐   (lib itself layers @reference-ui/icons)
 *                                     ├──▶ chain-t17 (user space)
 *   @fixtures/aliased-host-library ──▶ layer ───┘
 *
 * Contract: a named style prop on a prebuilt component from a composed
 * package ALWAYS paints. The consumer compile keeps the prop on the package's
 * tag, resolves it against the CONSUMER's tokens, and emits the deterministic
 * `<system>__<stem>` class the package's runtime mints — one group for each
 * system the package renders through — into its own utilities block. The value lands on the component's
 * outermost element and overrides the package default.
 *
 * Novel probe tokens live in `src/tokens.ts`. The spec proves they are absent
 * from the published icons/lib/fixture sheets, so a passing paint cannot be a
 * coincidental package-shipped hit.
 *
 * Re-sync / re-materialize order (G1 §3 amendment ii) — the sheet only backs
 * the foreign class after this chain, run from the monorepo root:
 *   1. rebuild the Rust binding (`pnpm agentrs t` / `pnpm agentrs b`)
 *   2. `ref sync` icons, then lib (lib layers icons)
 *   3. re-materialize each package's `react.mjs`
 *      (`scripts/materialize-runtime.mjs`; mandatory after the runtime change)
 *   4. republish base systems (icons → lib → consumers)
 *   5. matrix `setup --packages=@matrix/chain-t17 --sync`
 *   6. run the contract (`pnpm agent test --packages=@matrix/chain-t17`)
 */
export default defineConfig({
  name: 'chain-t17',
  include: ['src/**/*.{ts,tsx}'],
  extends: [libSystem],
  layers: [aliasedHostSystem],
  debug: false,
})
