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
- `positionTry` ruled 2026-10-21: no `positionTry()`/`viewTransition()` factories (positioning
  belongs to lib's Overlay); the compiler hook is gone. The CSS properties stay style props.
- `global-css.mdx:75-76` says breakpoint keys print `@media`; SPEC says `@container`.
  The walker prints `@media`, so the SPEC row looks stale.
- Next.js support: untested.

## Not gaps (doesn't exist here, by design or absent)

Patterns, `styled`/`as`, `sva` (slots are a `recipe()` key), `cx`, text/layer/animation styles, custom
conditions/utilities/breakpoints, named themes, plugins, JS `token()`, studio, JSON spec,
deprecations, analyze, lint plugin, PostCSS, Storybook, llms.txt, v2 upgrade, non-React
frameworks.

## Status (2026-10-21)

Done: G1-G4 (multi-part-components, troubleshooting, choose-a-styling-api, bundlers),
S1 diagnostics, S2 types, and a corpus sweep of every non-frozen guides/* and system/*
page (one Opus-medium writer per page). G5 (uncontrolled HTML) not started.

## Rulings log

Orchestrator rulings where the spec was silent:
- Docs never frame Reference UI by absence ("has no slot recipe", "no bundler plugin"): say what to do.
- `.reference-ui/`: docs tell users to gitignore it (init doesn't; sync rebuilds it and
  writes host/pid lock files).
- Same `name` twice: documented as rejected/deduplicated, not a shared layer (code says so).
- Webpack section kept, though no kept matrix suite runs webpack since `db0e03664`.

## Bugs fixed from the sweep (2026-10-21, on public-release)

Each: Opus-medium investigator (repro) -> implementer -> Opus-xhigh review -> fixes -> land.
- `debug` config key removed: type-only since the engine swap (df385ab47).
- extendSystem token modes match the compiler; numeric slots rejected (85751610c, 0653335b8, 7192605bc).
- Shipped ReferenceUIConfig gains the MCP keys (0653335b8).
- Recipe types: splitVariantProps keeps rest typed; boolean, numeric and per-breakpoint variant
  values type-check; responsive keys limited to breakpoints recipes print; generic wrappers work
  (0d7d9e8b9, 30f71e432, 5829fe364).
- Range keys built from breakpoint names only: css({ srOnly }) / css({ fooDown }) no longer vanish;
  one warning per bad key (2682c3195, 137b8ebe6, 9fe010a3e).
- 26 typed-but-refused extension props removed at the canon source; refusal retired, test-time
  guards added; MCP prop lists pruned (+16 stale names); changeset for the type break
  (070394cb3, 4e0ff8b87, 6eb4fef34).
- Test hygiene: CORE-SYNC-11/TOKEN-02 line numbers (8e08db964), CORE-SYNC-14 restores its fixture
  (a531af56a), census fails clearly on a stale dist (d1bca8eb1).

Rulings: refused props are removed, not implemented (core SPECs already rule out truncate,
hideFrom/Below, textStyle; boxSize = size). Range keys: `<bp>Down`/`<bp>Only` exact,
`<from>To<to>` case-insensitive. Unknown JSX attributes stay silent at sync (type error is the
signal). ATM-W-UNREALIZABLE-EXTENSION retired but kept in the code table.

Follow-up slices (not started): folded JSX spreads warn on readOnly/onPointerDown
(fold/call_lower.rs ignores JsxAttributes); typegen emits custom-scale keys extract rejects
(filter breakpoints.rs through range_shape); structural unknown-property fact instead of
message parsing (needs an ExtractDetail variant).

## Owner decisions surfaced by the sweep

- `tests/cases/global/SPEC.md:64` says globals are `@container` only; the walker prints `@media`. Stale row.
- `srOnly` as a real feature (visually-hidden bundle)? Removed for now; would be ATM-EXT-02 with its own lowering.
- Webpack: restore a kept webpack5 matrix suite, or drop the webpack docs section.
- Browser support floor; Next.js support.
- Does "a recipe nothing calls emits no CSS" belong in recipes or troubleshooting?
- `pnpm agentdocs q` checks 0 `.mdx` files: the gate doesn't lint pages at all.


## Wrap-up tracker (2026-10-22): everything known, to land

Process for every item: implement on a branch/worktree -> landing gate (agentrs t, agentcore run,
core unit suite, real sync of docs/lib/book, git status clean) -> xhigh review for non-trivial work -> land.

- [x] Bounded walkers wave 1 landed 2026-10-22 (ff to 86dee34c6, 26 commits): every xhigh item fixed with a red-first test;
      gate: agentrs t (1,644 Rust, 822 vitest), 347 cases, core vt 1080/1080, dogfood all exit 0, dev:docs 60s+edit.
      Rulings: STT-WRAP-13 perf after memo +10%/+35 ms accepted; circular key alias left; reach over-reports, never misses.
      Repros: 12-barrel clique 41 s -> 0.4 s; 5,000-paren lanes SIGILL -> 210 ms.
- [ ] `ref sync --watch` OOM: dev:docs watcher died at ~4 GB heap after 35 min of heavy edits (2026-10-22 00:03,
      predates wave 1). Investigator running; fix + a bounded-heap watch test to follow.
- [ ] Bounded walkers wave 2: parse-depth guard (F2), symlink-safe walks (F5), corpus test (T2), boundary smoke (T5).
- [ ] Bounded walkers wave 3: named errors for cyclic/deep token trees (F8), include brace cap (F9), expression-walker depth budgets (F3).
- [ ] recipe({ slots }) (feat/recipe-slots): xhigh review, quiet-machine bench rerun (>=8 rounds, alternating), land.
- [ ] Small fixes:
  - tasty resolver reports `INSTALL.md?raw` imports as unresolved (strip query suffixes).
  - Verify `pnpm agentrs q` thresholds vs AGENTS.md section 4 (cook saw file 1500 / complexity 60 / args 12 vs 500/15/5).
  - Stale SPEC rows: core tests/cases/global/SPEC.md:64 (@media in globals) and :61 (@position-try is authorable via globalCss).
  - lib book sync warns `accent`/`bg` unknown colour in Switch.tail.test.tsx:30,34.
  - Folded JSX spreads warn on readOnly/onPointerDown (fold/call_lower.rs ignores JsxAttributes).
  - typegen emits custom-scale range keys extract rejects (filter breakpoints.rs through range_shape).
  - Structural unknown-property fact instead of message parsing (ExtractDetail variant).
  - styletrace tests need gitignored fixtures/sync-root/.reference-ui: generate it in test setup so fresh worktrees pass.
  - vendor-rust-tasty-dts.mjs fails on ./index.js specifiers (vendored tasty + styletrace d.ts stale; core types displayMembersOf locally).
  - style-prop-reference.mdx compiles past Babel's 500 KB deopt line.
  - `pnpm agentdocs q` lints no .mdx.
  - A third-party tasty hook calling public getDisplayMembers() starts a fresh walk (document or guard).
  - Docs: "a recipe nothing calls emits no CSS" goes in troubleshooting (ruling).
- [x] Docs from map.md (2026-10-22): nested sidebar section > group > page, 288px (6d786c095, e62a72731); all 9 P1–P3
      pages landed (b59c4b673 … 079dc46f4, 7e14bd98a). Rulings: groups sort with pages by `order`; no sub-section icons
      (indent + rule reads cleaner); docs-only commits gate on agentdocs q + real docs sync + clean render.
      Open: map.md "Tones" -> "Tones and opacity" retitle; Vite/webpack "Verify the setup" not re-run; Sizes shows literal
      `8.5r` (unverified that sync reads lib's `controlHeight`); system exports gaps -> small fixes 13/18; frontmatter
      colon drops a page silently -> small fix 19.
- [x] Owner decisions (2026-10-22, owner "yes" to recommendations; orchestrator filled the rest):
  1. Imports: ui.config.ts -> @reference-ui/core; theme files -> @reference-ui/system (give it the real
     TokenConfig/FontOptions/... types); components -> @reference-ui/react. Imports and packages page documents it.
  2. colorMode typed 'light' | 'dark'.
  3. srOnly stays out (plain CSS bundle, writable with css()).
  4. Webpack: keep the docs; restore a kept webpack5 matrix suite (test-core).
  5. Browser support stated by feature: CSS cascade layers, container queries, color-mix().
  6. Next.js: not documented until a test covers it.
  7. ColorModeContext/DocumentContext/LayerScopeContext stay exported (lib uses them), undocumented (internal).
