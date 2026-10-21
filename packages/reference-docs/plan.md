# Docs gap pass against the Panda corpus (2026-10-21)

Source: three scouts mapped every Panda page (`vendor/docs/panda/website/content/docs/**`
and the v2 blog) against Reference UI's code and our docs. Each topic is "ours",
"ours but simpler" or "doesn't exist here"; nothing below imports a Panda concept we lack.

Writing rules: corpus first (`memex search … --in docs-corpus`), `technical-writing`
skill, frozen voice pages (initialize, theming, library-components), name the corpus
pages each change follows.

## New guides

| # | Page | Follows (Panda) | Our facts |
|---|---|---|---|
| G1 | Style a multi-part component (own + third-party headless) | recipes/slot-recipes, design-systems/wrap-headless-libraries | `data-slot` + `globalCss()` (core `tests/cases/global/SPEC.md`), `css()` via `className` |
| G2 | Troubleshooting: styles not applied | reference/debugging, design-systems/troubleshooting | `ref sync --verbose/--json/--debug`, `logs`, `debug`, sync "Common errors" |
| G3 | Set up with your bundler (Vite, webpack) | get-started/vite | `ref sync && vite build`; matrix bundlers vite7, webpack5. Next.js only if verified |
| G4 | Choose a styling API (style props → css() → recipe() → tokens) | get-started/thinking-in-panda | system/css, recipes, primitives, tokens |
| G5 (low) | Style HTML you don't control (Markdown/CMS) | theming/typography | `globalCss()` selectors |

## System: new pages

| # | Page | Follows | Our facts |
|---|---|---|---|
| S1 | Diagnostics | reference/diagnostics | ~56 ATM-* codes in `rs/atomic/src/diagnostics/codes.rs`; docs name 2 |
| S2 | Types | reference/types | StyleProps, CssStyles, SystemStyleObject, RecipeConfig, RecipeProps, ReferenceUIConfig |

## System: edits to existing pages

- `style-props.mdx`: value-level conditions `color={{ base, _hover }}` (CORE-NAMER-02, CORE-PGEN-18).
- `css.mdx`: only `css()`/`recipe()` bound to `@reference-ui/react|styled` are extracted (`extract/bindings.rs`).
- `recipes.mdx`: every variant value is generated, so runtime-picked values need no `staticCss`.
- `share.mdx`: `recipe()` definitions don't travel through `extends` (CORE-SYNC-10).
- `tokens.mdx`: value shape per category.
- `sync.mdx`: what's in `.reference-ui/`, and whether to commit it.
- Browser support + `@layer` requirement (cascade-layers or a FAQ). Floor unknown: needs owner.
- `system.mdx:19`: rendered TODO about Atlas in the diagram.

## Needs a ruling before docs (product, not prose)

- 8 style props are typed but refused at sync with no CSS: `truncate`, `srOnly`,
  `boxSize`, `hideBelow`, `hideFrom`, `textStyle`, `gradientFrom/To/Via`
  (`canon/src/css/unrealizable.rs`, ATM-EXT-01). Fix, untype, or document.
- `positionTry` is half-wired: compiler hook exists, no export, SPEC says out.
- `global-css.mdx:75-76` says breakpoint keys print `@media`; SPEC says `@container`.
  The walker prints `@media`, so the SPEC row looks stale.
- Next.js support: untested.

## Not gaps (doesn't exist here, by design or absent)

Patterns, `styled`/`as`, slot recipes/`sva`, `cx`, text/layer/animation styles, custom
conditions/utilities/breakpoints, named themes, plugins, JS `token()`, studio, JSON spec,
deprecations, analyze, lint plugin, PostCSS, Storybook, llms.txt, v2 upgrade, non-React
frameworks.

## Status (2026-10-21)

Done: G1-G4 (multi-part-components, troubleshooting, choose-a-styling-api, bundlers),
S1 diagnostics, S2 types, and a corpus sweep of every non-frozen guides/* and system/*
page (one Opus-medium writer per page). G5 (uncontrolled HTML) not started.

## Rulings log

Orchestrator rulings where the spec was silent:
- `debug` config key: documented as accepted-but-ignored (nothing reads it); pages point
  to `ref sync --watch --debug`.
- `.reference-ui/`: docs tell users to gitignore it (init doesn't; sync rebuilds it and
  writes host/pid lock files).
- Same `name` twice: documented as rejected/deduplicated, not a shared layer (code says so).
- Webpack section kept, though no kept matrix suite runs webpack since `db0e03664`.

## Owner decisions surfaced by the sweep

- Refused-but-typed props (truncate, srOnly, boxSize, hideBelow/From, textStyle,
  gradientFrom/To/Via): fix, untype, or document.
- `debug` config key: wire it up or drop it (`core/src/config/types.ts:86`).
- Token leaf with `value` + `light`: `value` becomes the dark value (`base-system/src/lower/mod.rs:302`). Bug?
- `splitVariantProps` types both halves as variant props, so wrapper examples can't use it.
- `tests/cases/global/SPEC.md:64` says globals are `@container` only; the walker prints `@media`. Stale row.
- Webpack: restore a kept webpack5 matrix suite, or drop the webpack docs section.
- Browser support floor; Next.js support; `positionTry` intent.
- Does "a recipe nothing calls emits no CSS" belong in recipes or troubleshooting?
- `pnpm agentdocs q` checks 0 `.mdx` files: the gate doesn't lint pages at all.
