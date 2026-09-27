# Tabs variant-strip crew log

Branch: reference-system (stay; never switch; never commit).
Stance: breaking NOW, no shims (API-STANCE.md).

## Checkpoint plan
1. Scope: grep all `variant`/`TabsVariant`/pill consumers (Tabs dir + Showcase + stories/books/tests/TSX). DONE — see §Scope.
2. Learn collectible recipe shape from styletrace fix (a5e86f4e9: ATM-SITE-87 + member_alias cases).
3. Baseline: `pnpm agentct Tabs` green BEFORE the strip; record snapshot list.
4. Strip: delete `variant`/`TabsVariant`/line-pill branches from Tabs.tsx; kernel keeps ONE unstyled-structural look? NO — kernel keeps line look? DECIDE: Book owns BOTH recipes; kernel = unstyled structure + selected/disabled states? Must keep pixel-identical signed visuals via recipes. Read SPEC/DECISIONS for the agreed end-state.
5. Book recipes: author line + pill in Tabs.book.tsx in the collectible shape; migrate Pill story/tests to recipes.
6. Field test: verify recipe classes collected (no missing utilities). If missing → STOP, capture missing utils + recipe shape, report blocked.
7. Proof: `pnpm agentct Tabs` (unit+e2e green, snapshots byte-identical) + view-story both recipes + nested ux-designer review.
8. Report: landed/blocked + evidence + files changed + flags.

## Scope (step 1)
In-repo `variant="pill"` / TabsVariant consumers:
- packages/reference-lib/src/components/Tabs/Tabs.tsx (kernel: TabsVariant, 3 variant props, context, isLine branches, data-variant)
- packages/reference-lib/src/components/Tabs/Tabs.book.tsx (PillTabs story, line/pill comment)
- packages/reference-lib/src/components/Tabs/Tabs.story.tsx (Pill story)
- packages/reference-lib/src/components/Tabs/Tabs.test.tsx (pill unit test)
- packages/reference-lib/src/components/Tabs/__e2e__/Tabs.ct.spec.ts (TB-DOM-05 pill test + data-variant assertion)
- packages/reference-lib/src/components/Tabs/Tabs.md, SPEC.md, FEATURES.md, DECISIONS.md (docs)
- Showcase.book.tsx uses Tabs WITHOUT variant (line default) — migration = apply Line recipe explicitly if kernel goes unstyled.
- No matrix/consumers outside Tabs dir use variant. Tree/RovingFocus hits are false positives.

## Design (from fix cases + v4 probe log + BUGS doc)
- Fix a5e86f4e9 proves the recipe shape: top-level consts spread by identifier
  onto member-form use sites (`<Tabs.Tab {...lineTabMember}>`,
  `<Tabs.Panel {...panelLookMember}>`, inline `<Tabs.Panel mt="3r">`) ALL
  collect (ATM-SITE-87: 7 wants incl pb_3.5r/mb_-1px/py_5r). Panel now traced.
- Collection law (v4, still valid): inline JSX literals + top-level consts
  spread by identifier (direct/ternary/undefined-branch) harvested; function
  calls NOT. v4 green runs were stale-daemon CSS; this crew is the first real
  field test of Tab/Panel member-spread collection.
- Kernel end-state: HEADLESS (both line+pill move to Book). Strip all visual
  props from List/Tab/Panel; keep roles/ARIA/tabindex/data-state/
  data-disabled/data-orientation/disabled/hidden. Delete TabsVariant,
  3 variant props, context.variant, data-variant, isLine branches.
- Recipe consts: fully-explicit per-combo top-level consts, SINGLE owner =
  Tabs.book.tsx (exported). Shapes restricted to in-law forms: single spread,
  flat ternary of identifiers at snapshotted use sites; nested ternary ONLY in
  Handoff (non-snapshotted, dynamic disabled) — and union property covers it
  (every Handoff util also emitted via Horizontal flat spreads).
- Combos: lineListH/V, pillList(H+V for completeness), lineTabH/V x
  Sel/SelDis/Unsel/Dis, pillTabH x 4 (+pillV x4 for completeness), panelLook,
  lineListH/VStyle (border var inline styles). Verbatim kernel values.
- Consumers import consts from Tabs.book: Tabs.story.tsx (CT parity),
  Tabs.test.tsx (unit class pins), Showcase.book.tsx (line look). LinkNav
  className recipe UNTOUCHED (kernel emitted classes preserved by verbatim
  recipe values — verify).
- Docs: Tabs.md/SPEC/FEATURES/DECISIONS variant-retention reversals.

## Progress
- 2026-09-27: plan filed; scope done; fix cases + v4 log read; design banked.
- 2026-09-27: git status showed uncommitted HQ/captain updates. Read them before
  touching anything: the strip is CANCELLED by superseding HQ decision. STOOD DOWN.

## STAND-DOWN (2026-09-27) — strip cancelled, zero Tabs dirt
This brief (tick-75 re-dispatch of crew 154 as the field test) was superseded
by tick 76 + 77, all recorded in the working tree BEFORE any edit of mine:
- captain-day.md tick 76: "HQ VARIANTS PHILOSOPHY (corrects triage):
  prepackaged variants stay; ... Strip crew (154) CANCELLED clean (plan only,
  zero Tabs dirt). Stance + bug file updated (strip superseded; fix needs a
  new lightweight field proof)."
- captain-day.md tick 77: HQ picked the mechanism (variant is SYSTEM-level,
  extended via normal css()/recipe(); users build typed MyTabs + recipe; no
  parallel API). System-variant crew (155) dispatched; doubles as the
  styletrace field proof. Running: Tabs-system.
- API-STANCE.md: "Tabs `variant` — PERMANENT kernel API (2026-09-27). No
  headless split..." + VARIANTS PHILOSOPHY ("The strip crew was cancelled").
- Tabs/DECISIONS.md: "`variant` is permanent kernel API... no variant strip,
  no migration." Tabs/FEATURES.md #1: HQ decision carries the same.
- docs/bugs/TABS_RECIPE_COLLECTION.md: CLOSED 2026-09-27 ("the strip
  re-attempt is off"); field proof = ATM-SITE-87 + member_alias + /tmp/tabs-probe/
  (verified present: input, probe.mjs, run.mjs, v-fnonly, v-fnspread, v-real,
  v-unknown). Fix stays load-bearing for userland variant overrides.
Action taken: NONE in Tabs dir (no baseline run, no edits — moot under
cancellation, and crew 155 owns Tabs-system right now). This log is the only
footprint: plan + design + stand-down record.
Files changed: this log ONLY (untracked, own surface). Nothing else touched.
