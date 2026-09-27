# Tabs system-variant crew log (155)

Branch: reference-system (stay; never switch; never commit).
HQ: `variant` is SYSTEM-level, extended with normal `css()`/`recipe()` — no
variants prop, no theme registry. Users build typed MyTabs + recipe.
Doubles as styletrace field proof for `docs/bugs/TABS_RECIPE_COLLECTION.md`.

## Checkpoint plan
1. Style-system recon (css/recipe/RecipeConfig + kernel authoring) — DONE, §Recon.
2. Scope: Tabs-variant consumers + class pins in-repo — DONE, §Scope.
3. Baseline `pnpm agentct Tabs` green BEFORE edits; record unit/CT/snapshots.
4. Design (§Design) → implement in Tabs dir only.
5. `sync`; inspect generated CSS (recipe classes + MyTabs + css() override).
6. `pnpm agentct Tabs` (unit+e2e; 22 snapshots byte-identical) + view-story.
7. Nested ux-designer review (spawn; pool-full → self-review by method + flag).
8. Typecheck (`tsc --noEmit`) for custom-name type proof.
9. Report: design, MyTabs proof, tests, UX verdict, styletrace verdict, files.

## Recon (step 1)
- System API (`@reference-ui/react`, generated `react.d.mts`): `css(...)`,
  `recipe<const TConfig extends RecipeConfig>(config): RecipeRuntimeFn<TConfig>`,
  `RecipeConfig { className, base?, variants?, defaultVariants?, compoundVariants? }`,
  `RecipeVariantProps<T>` (typed selections), `RecipeStyleObject`. No sva (banned).
- Kernel precedent: `SummaryChip.tsx` authors `recipe({className:'summaryChip',...})`
  at module top level; sync compiles → `@layer recipes` classes + tables in
  `react.mjs` (`we(ye,U.recipes,...)`); runtime resolves selections to classes.
- Extraction (atomic-rs): `recipe()` needs inline object literal, no spreads,
  explicit `className` literal; variant matrices + compounds + nested conditions
  (`_hover` wants carry `when`). Dynamic call selections → full matrix printed.
- DUPLICATE className = `DuplicateRecipe` ERROR, first-wins (`assembly.rs`) →
  same-className kernel/user merging is OUT; users get their own classNames.
- Override by cascade: utilities layer follows recipes layer, so host
  StyleProps / `css()` / `css` prop beat recipe classes naturally.
- Primitives: `variant?: unknown` (WIDE OPEN) — the system-level precedent for
  an open kernel `variant` type. `PrimitiveVariantProp` unions typegen aliases.
- agentct does NOT sync; CT imports generated `@reference-ui/react/styles.css`.
  Flow: edit → `pnpm --filter @reference-ui/lib run sync` → `agentct stop` →
  `agentct Tabs`. `.reference-ui` is git-ignored (regen is not dirt).
- Only runner on the tree (captain-day tick 77: Running: Tabs-system).

## Scope (step 2)
- Tabs dir: Tabs.tsx (kernel), Tabs.book.tsx (LinkNav PINNED atomic classes —
  MUST migrate), Tabs.story.tsx, Tabs.test.tsx (pill class pins — MUST update),
  __e2e__ (computed-style asserts, no class pins; 22 snapshots), docs.
- Outside Tabs dir: Showcase.book.tsx (Tabs, no variant — check class pins),
  Tree.book/story (check). Migrate ONLY if they pin Tabs variant classes.
- Panel: variant-independent (static py/px/color) → stays inline props, no recipe.

## Design (step 4)
- Kernel recipes (exported — the style system IS the API, no parallel API):
  `tabsListRecipe` (axes variant{line,pill} × orientation; compounds for
  borders + gap), `tabsTabRecipe` (variant × orientation × selected × disabled;
  compounds for cross-terms; `_hover`/`_focusVisible` nested inside values).
  Panel untouched. `base` holds only truly shared styles.
- `TabsVariant` stays `'line'|'pill'` (built-ins); the three `variant` props +
  context go OPEN (`TabsVariant | (string & {})`) mirroring primitive `variant?:
  unknown`. Unknown names → kernel base classes only + honest `data-variant`;
  user recipe classes arrive via `className` (their own className — no dup error).
- ALL variant ternaries leave style positions (unknowns must not inherit pill
  fragments); the List inline border-var `style` stays (fires line+H/V only).
- LinkNav: pinned atomics → live `tabsListRecipe(...)`/`tabsTabRecipe(...)`
  calls (no pinning drift ever again).
- MyTabs (`Tabs.myTabs.tsx`? story + unit): own classNames (`myTabsList`,
  `myTabsTab`), custom typed name (`underline`) via `RecipeVariantProps`, own
  typed `variant` prop, kernel composition; plus a `css()` override demo of a
  built-in. Story export + types test + assertion-only CT (no new snapshots).
- Docs (Tabs dir): DECISIONS (mechanism recorded), FEATURES #1, Tabs.md, SPEC
  variant prose — tight updates only.

## Progress
- 2026-09-27: plan filed; recon + scope done; design banked.
- 2026-09-27: BASELINE green — Unit 35 passed; E2E 10/10 react19 (22 snaps).
- 2026-09-27: implemented (Tabs.tsx recipes + open variant; MyTabs.tsx;
  story; tests; LinkNav live recipes). No outside-Tabs migration needed
  (Showcase variant-less; Tree hits false positives).
- 2026-09-27: SYNC green, zero recipe diagnostics. Emitted: tabsList (2
  compounds), tabsTab (10 compounds), myTabsList/myTabsTab, css() c_red.500.
  Declarations verbatim (base, 3px trio, hover/focus selectors). Footprint:
  pb_3.5r/mb_-1px/bg_ui.tab.track.background gone (in recipes), py_5r stays
  (Panel inline), bg_gray.200 stays (other owners).
- 2026-09-27: VERIFY 1 — 10/11 E2E (all 22 legacy snaps byte-identical;
  new TB-SYS-01 red: same-layer order fight, kernel `border:none` beat
  the demo's recipe border). Fix: indicator via css() utilities (the
  documented escape hatch). VERIFY 2 — Unit 38/38, E2E 11/11, 22/22 snaps.
- 2026-09-27: TYPECHECK — zero Tabs errors (8 pre-existing elsewhere:
  Accordion/DateField/NumberField/Slot/playwright — not mine). All three
  @ts-expect-error directives bite (no TS2578).
- 2026-09-27: EYES — capture Pill + LinkNav sane; TB-SYS-01 screenshot
  shows underline flavor + red override win. Videos unviewable in env
  (no webm reader, no ffmpeg, MCP pipe broken — capture fallback used);
  motion surface = one verbatim 150ms transition string (HEAD-identical).
- 2026-09-27: UX — nested spawn REJECTED (pool 8/8); SELF-REVIEW by the
  method (FLAGGED): look APPROVE (22/22 identical + captures sane),
  feel APPROVE (zero behavior-code delta; arrows/selection/focus paths
  untouched), a11y APPROVE (roles/attrs/tabindex untouched; focus ring
  decls verbatim incl. per-variant offsets), MyTabs new-surface APPROVE
  (2px indicator, baseline, honest data-variant, red override wins).
- 2026-09-27: STYLETRACE VERDICT — real recipe()/css() collection PROVEN
  (kernel defs + dynamic selections, userland defs + selections, story +
  component css() sites, literal LinkNav selections; zero sync
  diagnostics). Member-form const-SPREAD collection (the a5e86f4e9
  domain) NOT exercised — no spreads added/removed; leave to
  ATM-SITE-87/member_alias fixtures. See §Styletrace below.

## Styletrace field proof (docs/bugs/TABS_RECIPE_COLLECTION.md)
- Collected: tabsList (base+2 axes+2 compounds), tabsTab (base+4 axes+10
  compounds), myTabsList/myTabsTab, css() c_red.500 (story) +
  bd-b-w_2px indicator pair (component), LinkNav literal selections.
- Declarations verbatim incl. trio splits (3px indicator), nested _hover
  / _focusVisible selectors, per-variant outline offsets, transition.
- Diagnostics: none on Tabs (DuplicateRecipe absent; classNames unique).
- Explicit answer: recipe()-SHAPED styles collect correctly now. The
  bug file's member-form-SPREAD shape is a different collection path
  and is NOT field-proven by this crew (nothing to reopen; nothing
  claimed).
- Caveat: tree got busy mid-mission (Collapsible/Slider/playtest
  churn); all greens held with zero flip-flop across 3 agentct runs.
