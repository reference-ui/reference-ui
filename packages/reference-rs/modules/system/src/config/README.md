# Config

The design-system description Panda currently reads from generated
`panda.config.ts` (Liquid `panda.liquid`, JS extensions bundle, rhythm,
shorthands, recipes, conditions, `globalCss`, `keyframes`, breakpoints,
`jsx` extra names).

System compile needs that dictionary in-process. This module is the ingest
shape. It is not a second authoring API. `tokens()`, `font()`,
`globalCss()`, `keyframes()`, `cva()` in user space stay as they are.
Core’s `createBaseArtifacts` / system config already knows this data —
today it renders Liquid for Panda. Later it passes a JSON/struct in here.

Styletrace’s JSX extra names become `extract/sites` input, not a Panda
`jsx` array.

## `staticCss` — config is the third want source

Do not omit this the way the rest of the tree used to. Core ships
`src/system/panda/config/static-css.ts`, wired into `panda/config/base.ts:29`
and `system/build/styled/config.ts:22`. It requests **every token value**
(`properties: { color: ['*'], … }`) for ~35 properties — every `*Color`, every
`padding*` / `margin*`, `gap`, `width`, `height`, `size`, `borderRadius`.

That is why `bg={runtimeProp}` resolves today without extract ever seeing the
leaf. It is the real mechanism behind "Postel's Law on StyleProps", and it is
load-bearing: drop it and every fully dynamic style prop in the codebase loses
its class.

**Decided:** `config` lowers `staticCss` into **wants**, alongside
`extract/sites` and `extract/leaves`. So wants come from three places, and by
the time `resolve` and `stylesheet` see them there is no distinction — one
AtomSet, one namer, one dedup. We do **not** expand it at emit time the way
Panda does in `static_css.rs`; that would give staticCss a second path into the
sheet that `runtime` cannot see.

Consequences to keep straight:

- `stylesheet` never special-cases a static atom. It is an atom.
- The "a collected want that never became an atom is a P0" rule covers these
  too, so a `['*']` expansion that silently truncates is a P0, not a perf tweak.
- AtomSet size is dominated by this expansion, not by source leaves. Gate B
  goldens should assert the expansion explicitly, or a regression here is
  invisible until a runtime prop goes unstyled in a browser.
- Cross-check the property list against `resolve/shorthands`: `padding` and
  `margin` in that list are shorthands, so they expand before naming.

## Files (when coded)

- `mod.rs` — `SystemConfig`
- `tokens.rs` — dictionary for `resolve/tokens`
- `breakpoints.rs` — for `resolve/conditions`
- `recipes.rs` — declared recipes (plus what extract finds in source)
- `static_css.rs` — only if config is where staticCss lowers (see above)

## Lift

- **Panda:** `vendor/panda/crates/pandacss_config/src/lib.rs` (`UserConfig`),
  `theme.rs`, `validate.rs`. `pandacss_project/src/system.rs` compiles it
  to an immutable runtime config — that compile lives in `src/lib.rs`
  later, not a second dialect.
- **Not lifted:** plugin `hooks`, JS `createShorthandUtility` as config
  (those are `resolve/shorthands` now), `include` globs as a substitute
  for styletrace, `jsx` extra names (styletrace).

## Must not

- Become a user-facing `system.config.ts` dialect in v1.
- Delete core’s public `tokens()` because the struct moved.
