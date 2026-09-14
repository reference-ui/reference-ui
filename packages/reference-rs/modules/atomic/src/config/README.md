# Config

The design-system description `compile()` will ingest as a typed
`BaseSystem`: tokens, conditions, declared recipes, `globalCss()`,
`keyframes()`, breakpoints, `staticCss`.

This module is the ingest shape. It is not a second authoring API.
Authors still write `tokens()`, `font()`, `globalCss()`, `keyframes()`
in `@reference-ui/system`, and `css()` / `recipe()` in
`@reference-ui/react`. Core already knows this data; later it passes a
JSON/struct in here.

Styletrace’s JSX names become `extract/sites` input, not a config array.

## `staticCss` — config is the third want source

Do not omit this. Core ships a `staticCss` expansion that requests
**every token value** for ~35 properties — every `*Color`, every
`padding*` / `margin*`, `gap`, `width`, `height`, `size`, `borderRadius`.

That is why `bg={runtimeProp}` resolves today without extract ever seeing
the leaf. It is the real mechanism behind Postel's Law on StyleProps,
and it is load-bearing: drop it and every fully dynamic style prop loses
its class.

**Decided:** `config` lowers `staticCss` into **wants**, alongside
`extract/sites` and `extract/leaves`. So wants come from three places, and by
the time `resolve` and `stylesheet` see them there is no distinction — one
AtomSet, one namer, one dedup. We do **not** expand it at emit time; that
would give staticCss a second path into the sheet that `runtime` cannot see.

Consequences to keep straight:

- `stylesheet` never special-cases a static atom. It is an atom.
- The "a collected want that never became an atom is a P0" rule covers these
  too, so a `['*']` expansion that silently truncates is a P0, not a perf tweak.
- AtomSet size is dominated by this expansion, not by source leaves. Gate B
  goldens should assert the expansion explicitly, or a regression here is
  invisible until a runtime prop goes unstyled in a browser.
- Cross-check the property list against `resolve/shorthands`: `padding` and
  `margin` in that list are shorthands, so they expand before naming.

## Must not

- Become a user-facing `system.config.ts` dialect in v1.
- Delete core’s public `tokens()` because the struct moved.
