# Tabs decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Controlled tablist with automatic/manual activation and tab/panel linkage.

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

### 1. Required controlled value; API freeze removals — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:93-95` (required-value
  throw) + `TabsProps` (no `defaultValue`/`variant`/`disabled`); SPEC work
  order #1; no single case ID (contract-wide — `TB-SELECT-02`/`03` assume
  controlled).
- **API sketch:** `value: string` required, throwing `requires a controlled
  \`value\` prop` when `undefined`; delete `defaultValue`, `variant`
  (`line`/`pill`), and root `disabled`; line/pill visuals move to Book,
  not the kernel.
- **Why not landed:** breaking flag-day — landing preserved uncontrolled
  mode + variant + pill per the visuals freeze, and pill deletion without
  a Book migration is mangling-class.
- **Revisit when:** a major / kernel-freeze milestone can take breaking
  API removal, with Book-owned line/pill stories replacing `variant`
  first.
- **Open questions:** does root `disabled` die entirely or survive as
  sugar over per-tab `disabled`? Does uncontrolled mode get any stay of
  execution (TESTS out-of-scope says no)? What is the Book migration path
  for current `variant="pill"` consumers?

### 2. RovingFocus composition — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:333`
  (`RovingFocus.Root`, `typeahead={false}`) + `Tabs.tsx:623`
  (`RovingFocus.Item`); `Tabs.md` ("Built on `RovingFocus`"); SPEC work
  order #2 and engine row ("Prototype. Does not compose RovingFocus").
- **API sketch:** no public API change. List renders inside
  `RovingFocus.Root` (orientation, loop, typeahead off), Tab inside
  `RovingFocus.Item`; delete the hand-rolled List keydown
  (`querySelectorAll`, `document.activeElement`, dir lookup at
  `Tabs.tsx:167-228`). Tabs keeps activation policy only.
- **Why not landed:** concurrent RovingFocus crew + rewrite risk; the
  hand-rolled arrows were hardened instead (nest scoping, live RTL,
  wrap/Home/End — all green).
- **Revisit when:** the RovingFocus kernel API stabilizes; or Shadow-DOM
  arrows (gap 2) force shared movement ownership.
- **Open questions:** does RovingFocus expose the focus-vs-selection
  split manual mode needs (active-tab bookkeeping when focus leaves the
  selected tab)? Who owns disabled-skip truth — the RovingFocus item
  registry or Tabs?

### 3. Always-mounted panel children — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `TabPanel`
  (`Tabs.tsx:683-703` — children always rendered, inactive panels use
  native `hidden`); `TB-DOM-05` (mounted-inactive-panel policy);
  `Tabs.md` ("Every declared Panel stays mounted").
- **API sketch:** remove the `{isSelected && children}` gate
  (`Tabs.tsx:438`); inactive panels render children under native
  `hidden`, so effects, form state, and timers in hidden panels stay
  alive.
- **Why not landed:** state/effects semantics change — hidden panels'
  effects run and forms keep state, which needs UX/product sign-off
  (crew SURPRISE 1; the current unmount policy was pinned by CT instead).
- **Revisit when:** a consumer needs cross-tab form state or background
  panel effects; or a freeze milestone adopts the `Tabs.md` text as law.
- **Open questions:** do hidden panels keep effects running, or is there
  an opt-in (`keepMounted` per panel vs global)? How do hidden-panel
  data fetches behave? Does `hidden` suffice for AT, or is `inert`
  needed too?

### 4. Registration maps (identity registry) — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:102-168`
  (`registeredTabs`/`registeredPanels`, `tabIds`/`panelIds`,
  `hasTab`/`hasPanel`); cases `TB-DOM-06` (explicit IDs),
  `TB-DYNAMIC-01`/`02` (dynamic collections).
- **API sketch:** internal only. Value → `{ id, element, disabled }`
  maps with effect subscribe/unsubscribe; explicit Tab `id` flows into
  the Panel's `aria-labelledby` (today it dangles — Panel rebuilds the
  tab ID from `baseId`, `Tabs.tsx:414`); insert/reorder/remove keep IDs
  stable; powers enabled-tab queries for gaps 1 and candidate 7.
- **Why not landed:** marginal without its consumers — duplicate
  detection landed cheaper via claim counts, and quarantine's
  render-pass-coupled maps were React 17/18-fragile (crew SURPRISE 2).
- **Revisit when:** gap 1's policy is picked (needs an enabled-tab
  query), an explicit-ID linkage bug is reported, or dynamic add/remove
  breaks ID stability.
- **Open questions:** maps-in-ref + version counter (quarantine shape)
  vs state? Do the maps include disabled tabs' elements (focus rescue
  needs them)? What is the StrictMode double-effect discipline for
  register/unregister?

### 5. Focus rescue on programmatic hide — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:196-221`
  (previous-value effect moves focus to the newly selected or
  first-enabled tab); `TB-SELECT-07`; `Tabs.md` already promises it
  ("moves focus out of a panel that becomes hidden").
- **API sketch:** no new props. When the controlled value changes and
  `document.activeElement` sits inside the now-hidden panel, move focus
  to the newly selected Tab (or nearest-enabled fallback), with no
  `onChange`.
- **Why not landed:** behavioral addition needing UX design; needs an
  element registry (candidate 4) to find the fallback robustly. Current
  code leaves focus under `hidden` — a documented gap, not pinned.
- **Revisit when:** candidate 4 lands (element lookup) and UX confirms
  the target policy; or an a11y audit flags focus-under-hidden.
- **Open questions:** exact fallback chain when the newly selected tab
  is disabled (nearest enabled — which direction on ties)? Does rescue
  apply to uncontrolled mode too? `preventScroll` on the rescue focus?

### 6. Pointerdown-early activation — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:461-510`
  (pointerdown/mousedown request + completing-click dedupe);
  `TB-SELECT-08`; `TB-SELECT-06` pins the blur-order contract this
  exists to make deterministic.
- **API sketch:** no new props. Primary pointerdown/mousedown on an
  enabled unselected Tab requests selection immediately (focus +
  `onChange`); the completing click dedupes; consumer `preventDefault`
  on pointerdown cancels. `TB-SELECT-06` blur ordering must be pinned
  in the same change.
- **Why not landed:** behavioral addition needing UX design — it changes
  press-vs-click timing every consumer feels, and blur ordering must
  land with it.
- **Revisit when:** UX designs press timing (drag-off-tab cancellation?
  text selection inside rich labels?); or a blur-order bug forces a
  deterministic event boundary.
- **Open questions:** does pointerdown activation break text selection
  in rich tab labels? Touch long-press / context-menu interplay? Should
  manual mode also early-activate on pointer (quarantine did — is that
  right for manual)?

### 7. Disabled/removed-tab focus handoff — verdict: DEFERRED

- **Source:** quarantine commit `a49fc0626`, `Tabs.tsx:425-438`
  (disable-while-focused moves to first enabled); `TB-DYNAMIC-03`
  (nearest-enabled handoff, ties to preceding).
- **API sketch:** no new props. In manual mode, when the focused
  (unselected) tab disables or unmounts, focus and the current stop
  move to the nearest enabled tab (ties to preceding), while selection
  and the visible panel stay unchanged and no request fires.
- **Why not landed:** behavioral addition needing UX design; quarantine
  implemented only half of `TB-DYNAMIC-03` (first-enabled, not
  nearest; disable-only, not removal).
- **Revisit when:** candidate 4 lands (needs the ordered enabled-tab
  list); or a dynamic tab-strip consumer (closable tabs) arrives.
- **Open questions:** nearest-with-tie-to-preceding (TESTS) vs
  first-enabled (quarantine) — confirm TESTS wins. Does handoff also
  fire in automatic mode? Same path for removal-during-focus and
  disable-during-focus?

### 8. Ref forwarding on all parts — verdict: OPEN

- **Source:** quarantine commit `a49fc0626`, `composeRefs` +
  `forwardedRef` on List/Tab/Panel (`Tabs.tsx:74-84,413,603,673`);
  `TB-DOM-09` requires object/callback refs to reach native hosts.
- **API sketch:** List/Tab/Panel accept `ref` and attach it to the
  documented host (`div`/`button`/`div`), composing with internal refs
  and cleaning up on unmount. Current parts take no ref at all.
- **Why not landed:** API surface, not stability — landing took tests +
  hardening only, and no consumer has asked.
- **Revisit when:** `TB-DOM-09` proof is scheduled, or the first
  consumer needs programmatic focus/measurement of a part host.
- **Open questions:** repo idiom — ref-as-prop (React 19) or
  `forwardRef` for 17/18 compat? Must the Panel ref stay stable across
  select/unselect (the host does, even though children unmount)?

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

### 1. Tab-stop policy when selection is disabled — verdict: OPEN

- **Evidence:** crew log "Known gap: disabled-selected tab leaves zero
  tab stops until focus lands"; `Tabs.tsx:60-62` syncs the roving stop
  to `value` even when that tab is disabled; `TB-DOM-08` allows
  selected+disabled but names no tab stop; UX residual (a).
- **API sketch:** no new props. When the controlled value's tab is
  disabled, either the roving stop falls back to first-enabled
  (quarantine's external-sync policy) or the list honestly exposes
  zero stops (native `disabled` is unfocusable anyway).
- **Why not landed:** no quarantine source for the policy as API; needs
  candidate 4's machinery plus a UX call that was out of landing scope.
- **Revisit when:** HQ/UX picks the policy AND candidate 4 lands (the
  fallback cannot find first-enabled without a registry).
- **Open questions:** first-enabled fallback vs honest zero stops —
  which is less surprising for keyboard and AT users? When the disabled
  tab re-enables, does the stop move back?

### 2. ShadowRoot focus tracking — verdict: DEFERRED

- **Evidence:** `Tabs.tsx:183` uses `document.activeElement`, which
  returns the shadow host inside a ShadowRoot — so the active index is
  -1 and arrow keys go dead; `TB-ENV-03` specified, unproven.
- **API sketch:** no new props. Resolve the active element through
  shadow roots (`getRootNode` + `shadowRoot.activeElement` walk), or —
  preferably — move movement into RovingFocus, which owns cross-root
  correctness.
- **Why not landed:** no quarantine source (quarantine delegated to
  RovingFocus); no shadow consumer; the fix belongs to the movement
  owner, not a Tabs patch.
- **Revisit when:** candidate 2 (RovingFocus composition) lands, with
  RovingFocus owning the fix; or a shadow-DOM consumer reports dead
  arrows.
- **Open questions:** where should the root-walk live — a Tabs fallback
  or the RovingFocus kernel? Leaning RovingFocus per TESTS "Owned
  elsewhere".

### 3. Link-navigation Tabs — verdict: OPEN

- **Evidence:** TESTS.md out-of-scope names link-navigation Tabs;
  tab-styled links are the standard shape for docs-site and settings
  navigation, so demand is plausible but unattested.
- **API sketch:** a Tab rendering an anchor (`href`) while keeping
  tablist semantics — or a documented "tabs look, links behave" Book
  recipe; needs a design call on whether arrow movement and automatic
  activation apply to links at all.
- **Why not landed:** no quarantine source; no consumer demand; anchor
  semantics (middle-click, open-in-tab, visited) collide with the
  button/ARIA tab pattern.
- **Revisit when:** a first-party consumer (docs site, settings nav)
  needs tab-styled navigation with real URLs.
- **Open questions:** real tablist-with-links (APG tabs assume in-page
  panels — does the pattern stretch?) vs nav-styled-as-tabs — which
  shape? Do panels exist for link tabs, or is each activation a page
  load?

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

- Biggest fork 1/3 — always-mounted panels (candidate 3): hidden-panel
  state dies on every tab switch today. Feel it in Book's Tabs stories
  with stateful panel content (type in a panel input, switch away and
  back — it resets). HQ call: kernel law per `Tabs.md`, or a per-panel
  opt-in recipe.
- Biggest fork 2/3 — controlled-value freeze (candidate 1): the
  breaking API cut — `defaultValue`/`variant`/root-`disabled` die and
  pill visuals move to Book. Feel it in the Manual/Rtl/Nested stories,
  which run uncontrolled + variant today; the freeze deletes those
  props outright.
- Biggest fork 3/3 — RovingFocus composition (candidate 2): `Tabs.md`
  claims "Built on `RovingFocus`" but arrows are hand-rolled
  (`Tabs.tsx:167-228`), including the Shadow-DOM dead end (gap 2).
  Feel it by keyboarding the Horizontal story, then comparing with the
  RovingFocus story's movement.
- To verify the landed state: run `pnpm agentct Tabs` (17 unit + 6 CT
  on React 19; 18/18 CT across majors per the crew log) and click
  through the Horizontal / Pill / Vertical stories in Book.
