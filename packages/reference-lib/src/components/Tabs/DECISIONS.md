# Tabs decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Controlled tablist with automatic/manual activation and tab/panel linkage.

## HQ standing decisions

- **`variant` is permanent kernel API (2026-09-27).** Tabs stays a
  complete, immediately useful styled component: structure and
  classNames frozen, `line`/`pill` in the kernel. The headless /
  Book-recipe direction is closed — no variant strip, no migration.
  Customization grows through the variant axis (authors add their own
  variant or override one). Supersedes the walkthrough fork 2/3
  freeze framing and the `FEATURES.md` #1 Book-migration take for
  `variant`. Mechanism landed 2026-09-27 (crew 155): SYSTEM-level prop —
  prepackaged kernel recipes + open `TabsVariantProp`; unknown names
  resolve base-only; worked `MyTabs` proof; 22/22 snapshots identical.
- **Collector note:** the member-form collection gap that blocked
  Book-side styles (`docs/BUGS/TABS_RECIPE_COLLECTION.md`) was a real
  engine miss, fixed in styletrace + atomic (`a5e86f4e9`,
  `94bd4b6f3`; stations `ATM-SITE-87`, `member_alias`). It stays
  relevant: userland variant overrides ride the same member-form
  collection.

## Landed (context, 2-4 lines)

Landing ported 7 stability wins (nested-tablist scoping, redundant-request
suppression, live RTL direction, disabled-never-tab-stop, focus-following
roving stop + consumer `onFocus`, `useId` identity, duplicate-value throw
reworked to effect claiming for React 17/18), grew the suite to 17
colocated + 6 CT (18/18 CT across React majors), and added
Manual/Rtl/Nested stories. Visuals frozen — UX APPROVE, no drift. Crew
log: `.agents/missions/quarantine-landing/tabs.md`; landing commit
`e22d94f99`.

## Candidate features (quarantine-sourced)

Moved items now live in `PATCHES.md` (mechanical, test-pinnable) or
`FEATURES.md` (needs design). Verdicts stand; only the prose moved.

- 1. Required controlled value; API freeze removals — verdict: DEFERRED → moved to `FEATURES.md` #1 (breaking API removal needs a major-milestone design call).
- 2. RovingFocus composition — verdict: DEFERRED → moved to `FEATURES.md` #2 (cross-kernel ownership calls, not a mechanical swap).
- 3. Always-mounted panel children — verdict: DEFERRED → moved to `FEATURES.md` #3 (effects/state semantics need UX/product sign-off).
- 4. Registration maps (identity registry) — verdict: DEFERRED → moved to `PATCHES.md` #1 (specified behavior; tests pin ID linkage and stability).
- 5. Focus rescue on programmatic hide — verdict: DEFERRED → moved to `FEATURES.md` #4 (fallback chain and rescue scope need UX confirmation).
- 6. Pointerdown-early activation — verdict: DEFERRED → moved to `FEATURES.md` #5 (press-timing behavior every consumer feels; needs UX design).
- 7. Disabled/removed-tab focus handoff — verdict: DEFERRED → moved to `FEATURES.md` #6 (mode scope and removal/disable unification need design calls).
- 8. Ref forwarding on all parts — verdict: OPEN → moved to `FEATURES.md` #7 (new API surface plus a ref-idiom call).

### 9. Label typeahead — verdict: DECLINED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:333`
  (`typeahead={false}`); `TB-EVENT-03` pins typeahead OFF; `Tabs.md`
  ("Typeahead stays off").
- **API sketch:** would add optional typeahead (printable characters
  move focus/selection by label prefix). Never proposed as API — this
  item records the freeze so it stays off deliberately.
- **Why not landed:** deliberately off — labels must not become an
  undocumented selection mechanism; RovingFocus owns typeahead and
  Tabs opts out.
- **Revisit when:** never expected — would require HQ to overturn
  `TB-EVENT-03` plus the `Tabs.md` convergence note.
- **Open questions:** none — hard DECLINED. Killer reason: the APG tabs
  pattern has no typeahead; printable keys must stay available to
  nearby editing surfaces.

### 10. Anatomy console.warn diagnostics — verdict: DECLINED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:223-249`
  (missing/extra List, unpaired Tab/Panel, unmatched-value warns);
  `TB-DOM-13` and the diagnostic half of `TB-DYNAMIC-02`.
- **API sketch:** dev-only `console.warn`s for a missing or duplicated
  List, Tab-without-Panel / Panel-without-Tab by value, and a
  controlled value matching no registered Tab.
- **Why not landed:** dev-console noise with marginal value — duplicate
  identity (the corrupting case) already throws hard, and unmatched
  values render tolerantly today.
- **Revisit when:** a production debugging story shows silent-tolerant
  rendering hiding an app bug that a warn would have caught same-day.
- **Open questions:** none — hard DECLINED. Killer reason: warns train
  consumers to ignore the console; the duplicate-value throw covers the
  one case that corrupts ARIA.

## Suspected gaps (no quarantine source)

Moved items now live in `PATCHES.md` (mechanical, test-pinnable) or
`FEATURES.md` (needs design). Verdicts stand; only the prose moved.

- 1. Tab-stop policy when selection is disabled — verdict: OPEN → moved to `FEATURES.md` #8 (first-enabled fallback vs honest zero stops needs an HQ/UX policy pick).
- 2. ShadowRoot focus tracking — verdict: DEFERRED → moved to `PATCHES.md` #2 (`TB-ENV-03` pins it; the owner question is engineering, not product).
- 3. Link-navigation Tabs — verdict: OPEN → moved to `FEATURES.md` #9 (tablist-with-links vs nav-styled-as-tabs needs a design call).

### 4. Deselectable / nullable value — verdict: DECLINED

- **Evidence:** `Tabs.md` ("Zag `deselectable` … Leave"); TESTS.md
  out-of-scope ("Nullable/deselectable Tabs"); SPEC vendor "Leave".
- **API sketch:** would allow `value={null}` or clicking the selected
  tab to deselect, leaving zero panels visible.
- **Why not landed:** not APG Tabs — nullable selection is
  accordion/menu behavior wearing tab styles.
- **Revisit when:** never expected — would contradict the APG pattern
  Tabs implements.
- **Open questions:** none — hard DECLINED. Killer reason: a
  zero-selected tablist has no valid `aria-selected` state; that is a
  different component.

### 5. Public Provider API — verdict: DECLINED

- **Evidence:** `Tabs.md` ("Do not add a public `Tabs.Provider`"); SPEC
  won't-do ("Provider API").
- **API sketch:** would expose tab state via context (`Tabs.Provider`
  / `useTabsContext`) for external tab-strip wiring.
- **Why not landed:** fixed anatomy needs no provider — List/Tab/Panel
  compose under Tabs with value identity; internal context suffices.
- **Revisit when:** never expected — external composition that needs
  tab state already holds it, because selection is controlled.
- **Open questions:** none — hard DECLINED. Killer reason: the
  controlled `value` IS the external API; a provider would duplicate
  it.

### 6. Indicator / panel transitions / size helpers as kernel — verdict: DECLINED

- **Evidence:** SPEC won't-do ("Indicator / panel transitions as
  kernel"); TESTS.md out-of-scope ("panel-size transition helpers,
  indicators").
- **API sketch:** would add selected-tab indicator positioning, panel
  enter/exit transitions, and animated panel-height helpers to the
  kernel.
- **Why not landed:** the kernel owns activation policy only (TESTS
  driver line) — motion is Book/consumer territory.
- **Revisit when:** never in the kernel — a Book cookbook recipe may
  demo indicator + transitions without kernel API.
- **Open questions:** none — hard DECLINED. Killer reason: motion in
  the kernel couples every consumer to one animation opinion; a
  policy-only kernel stays composable.

### 7. Tabs-owned popup layering — verdict: DECLINED

- **Evidence:** SPEC won't-do ("Overlay in panels"); TESTS "Owned
  elsewhere" ("Popup layer behavior in panels: `Overlay`/`Popover`");
  `TB-NEST-02` requires interop, not ownership.
- **API sketch:** would add focus-trapping, layering, or dismiss
  ownership for popups rendered inside panels.
- **Why not landed:** Overlay/Popover own layers; Tabs must merely not
  break them — an interop property, not Tabs API.
- **Revisit when:** never — layering bugs in panels file against
  Overlay/Popover.
- **Open questions:** none — hard DECLINED. Killer reason: two layer
  owners means two focus traps fighting; Tabs owns activation policy
  only.

Omitted with stated reason: proof-only cases with no API delta need
test titles, not decisions (`TB-SELECT-02`/`03` controlled semantics,
`TB-AUTO-05` rejected-nav focus stability, `TB-MANUAL-02`/`03` native
Space/Enter timing, `TB-DYNAMIC-01` insert/reorder stability,
`TB-COMP-*` compositions, `TB-ENV-01`/`02` SSR/version proofs,
`TB-A11Y-01` checker runs). `TB-SELECT-05`/`TB-MANUAL-05`
consumer-cancel already holds via the pre-existing `defaultPrevented`
guards (`Tabs.tsx:169,302`) — proof-only.

## Non-decisions (rejected outright)

- Controlled-only flag-day rewrite (throw + API removals + RovingFocus
  + maps in one 962-line diff) — rejected as a landing vehicle; goals
  re-enter as candidates 1/2/4 (log Deferred list).
- Pill `variant` deletion + pill chrome removal — rejected, visuals
  frozen; pill story pixel-verified post-landing (log view-story
  check; SPEC gaps line keeps `variant`).
- Chrome edits (`textShadow`/`boxShadow`/focus-offset removal,
  transition-string narrowing) — SUSPECT per recon §4-6, rejected
  outright (log Recon analysis).
- Weakened colocated tests (quarantine's near-trivial 31-line test
  diff on a 962-line rewrite) — rejected; suite rewritten to 17
  colocated on the current API (log; recon §5 exhibit).
- Render-phase duplicate-value claiming — React 17/18-fragile (hook
  state resets between double-render invocations); reworked as
  effect-with-cleanup claiming (log SURPRISE 2 + handoff 1).
- Matrix-only paths (quarantine unit +1181 / e2e +610) not kept —
  re-targeted colocated per the landing rule (landing commit
  `e22d94f99`).

## Walkthrough notes for HQ

- Biggest fork 1/3 — always-mounted panels (`FEATURES.md` #3): hidden-panel
  state dies on every tab switch today. Feel it in Book's Tabs stories
  with stateful panel content (type in a panel input, switch away and
  back — it resets). HQ call: kernel law per `Tabs.md`, or a per-panel
  opt-in recipe.
- Biggest fork 2/3 — controlled-value freeze (`FEATURES.md` #1): the
  breaking API cut — `defaultValue`/`variant`/root-`disabled` die and
  pill visuals move to Book. Feel it in the Manual/Rtl/Nested stories,
  which run uncontrolled + variant today; the freeze deletes those
  props outright.
- Biggest fork 3/3 — RovingFocus composition (`FEATURES.md` #2, with
  `PATCHES.md` #2 riding along): `Tabs.md` claims "Built on
  `RovingFocus`" but arrows are hand-rolled (`Tabs.tsx:167-228`),
  including the Shadow-DOM dead end. Feel it by keyboarding the
  Horizontal story, then comparing with the RovingFocus story's
  movement. HQ call: composition design first, then the shadow proof
  lands under whichever owner emerges.
- Likely-to-do mechanicals live in `PATCHES.md` (#1 registry, #2 shadow
  proof) — each names its pinning test, no HQ call needed. Everything
  else open sits in `FEATURES.md` (#1–#9) with API sketches and a
  one-line maintainer take each.
- To verify the landed state: run `pnpm agentct Tabs` (17 unit + 6 CT
  on React 19; 18/18 CT across majors per the crew log) and click
  through the Horizontal / Pill / Vertical stories in Book.
