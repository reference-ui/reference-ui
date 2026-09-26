# RovingFocus decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: headless composite keyboard kernel — one tab stop, arrows, typeahead.

## Landed (context, 2-4 lines)

Landing `aa95c7005` ported the pure `TypeaheadModel` extraction plus 7 colocated
unit cases (RF-TYPE-02/03/04/05/07/08, RF-ENV-01 re-targeted), with per-element
RTL, stale-current repair, SSR claim-first-stop, and IME/editable guards.
Visuals frozen (CT snapshots byte-identical), UX APPROVED, consumers green.
Full arc: `.agents/missions/quarantine-landing/roving-focus.md`.

## Candidate features (quarantine-sourced)

### 1. Visual 2D grid navigation for `orientation="both"` — verdict: DEFERRED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` `handle2DNavigation` +
  `VisualItem` + `findNearestCenterItem`; cases RF-GRID-01..08 (quarantine
  matrix e2e claimed all green).
- **API sketch:** no new props — `orientation="both"` stops being "1D with both
  arrow axes" and becomes measured visual geometry: Up/Down pick the adjacent
  row's nearest-horizontal-center item, Left/Right stay in-row, ragged rows,
  DOM-order tie-break, reflow-aware (rects read per keystroke, no cached grid).
- **Why not landed:** feature-needs-design plus needs-browser-proof. The row-
  grouping heuristics (0.4/0.5 height thresholds, 0.001 tie epsilon) were never
  verified against a real ragged layout, and no Book consumer exercises `both`
  today, so landing law (stability + test-case wins only) excluded it.
- **Revisit when:** a grid consumer (picker/date-adjacent palette) lands in
  Book and RF-GRID-01/02/07 pass as CT browser cases against measured layouts.
- **Open questions:** nearest-center vs DOM-order-column for vertical moves in
  ragged rows — TESTS.md says nearest-center, but is that the UX HQ wants for
  sparse last rows? Should rect measurement cache within a keypress burst?

### 2. Transparent slot contract (`ReferenceSlotPartProps` + StyleProps) — verdict: DEFERRED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` (local
  `ReferenceSlotPartProps`, `splitCssProps` + `css()` in Root and Item); cases
  RF-API-01, RF-DOM-01, RF-DOM-02.
- **API sketch:** `RovingFocusProps` / `RovingFocusItemProps` extend
  `ReferenceSlotPartProps` (children: exactly one element); token-aware
  StyleProps split out, compiled with `css()`, and merged (className, style,
  ref, handlers) onto the single child node — no Root host, no Item wrapper.
- **Why not landed:** coupled to the mangled rewrite — quarantine redefined the
  slot types locally and RF-API-01 as written encodes the mangled API, so the
  case was skipped and the plumbing left out. The freeze direction (SPEC work-
  order #2, `RovingFocus.md` Proposed API) genuinely wants this shape, but it
  must land against the real Slot/PART conformance story, not quarantine's fork.
- **Revisit when:** Slot universal StyleProps-merge + PART ref/handlers
  conformance settle, so this slots onto one tested contract instead of
  re-implementing merge logic per component.
- **Open questions:** does HQ confirm transparent-slot (zero host nodes) as the
  catalog-wide primitive shape, or may RovingFocus keep its current
  Provider-wrapper Root? If transparent, who owns the merge helper — Slot?

### 3. Runtime single-element anatomy error (incl. Fragment rejection) — verdict: DEFERRED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` Root/Item child guards
  (`null`/non-element/Fragment → throw); case RF-DOM-06 (no colocated case ID).
- **API sketch:** no new props — Root and Item throw a descriptive
  single-element anatomy error at render for omitted, `null`, `false`, text,
  number, Fragment, or multi-element children, with no partial registration.
  Landed code rejects non-elements already; the delta is explicit Fragment and
  multi-element rejection.
- **Why not landed:** a runtime throw is a breaking behavior change for any
  consumer currently passing Fragments; landing froze behavior and the crew had
  no consumer audit. Needs-browser-proof for the no-partial-registration half.
- **Revisit when:** Listbox/Menu/Tabs/Tree are audited to pass single elements,
  and RF-DOM-06 passes as a browser case (error thrown, DOM untouched).
- **Open questions:** throw vs dev-only warning — HQ call. A throw matches
  RF-DOM-06 as specified; a warning is kinder during consumer migration.

### 4. Capture-phase Space typeahead guard — verdict: DEFERRED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx`
  `handleKeyDownCapture` (Space + active buffer → preventDefault, feed model);
  case RF-TYPE-06.
- **API sketch:** no new props — when `typeahead` is on and the search buffer
  is nonempty, Space is captured before button activation, appended to the
  buffer, and matched; neither the original nor the matched button activates.
- **Why not landed:** needs-browser-proof — button-activation prevention is
  observable only in a real engine, and the landing arc ported unit-pinned wins
  only. The freeze (SPEC surface, RF-TYPE-06) already specifies this behavior.
- **Revisit when:** RF-TYPE-06 passes as a CT browser case (space-containing
  label matched, zero activations) on react19.
- **Open questions:** none for the behavior itself — specified. Only whether HQ
  wants the capture handler always attached or only while a buffer is active
  (perf nit; quarantine attached always).

### 5. Pointer press sets current item — verdict: DEFERRED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` Item `handleClick`
  (`setCurrentId` on click); case RF-TAB-04 (focus-or-pointer currentness).
- **API sketch:** no new props — clicking/tapping an Item makes it the current
  (`tabIndex=0`) item, so Tab-out-and-back re-enters on the clicked item. Today
  most clicks become current indirectly via the focus handler; the explicit
  handler covers clicks that do not move DOM focus.
- **Why not landed:** needs-browser-proof (real pointer press, Tab-out/in
  re-entry) and a consumer-policy check — the UX review noted click-opened Menu
  parks focus on the container as pre-existing Menu policy, which this could
  disturb. Landing froze interaction behavior.
- **Revisit when:** RF-TAB-04 passes as a CT browser case with real pointer
  events, and Menu confirms its click-open focus policy against the new handler.
- **Open questions:** should pointer-press move DOM focus to the item, or only
  update currentness (tab-stop assignment) and leave focus where the browser
  put it? RF-TAB-04 requires re-entry focus on C — either implementation
  satisfies it, but the feel differs.

### 6. Controlled current-id API: keep vs strip to freeze — verdict: OPEN

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` — removed
  `currentId`/`defaultCurrentId`/`onCurrentIdChange` and the `id` prop,
  internal state only. The removal is the quarantine-sourced API position.
- **API sketch:** two directions. (a) Strip: delete the three controlled props
  (SPEC work-order #1, default strip); currentness becomes fully internal.
  (b) Keep + document: retain and specify controlled/uncontrolled semantics,
  amending the freeze with a named reason.
- **Why not landed:** landing law ports are API-identical; either direction is
  a breaking public-API decision needing HQ sign-off, not a quarantine lift.
  The landing kept the props (controlled support intact, additive-only).
- **Revisit when:** now — this item IS the revisit trigger. HQ must pick (a) or
  (b) before consumers are migrated onto the kernel, since (a) forces consumer
  refactors and (b) amends the freeze.
- **Open questions:** does any consumer (present or planned) need controlled
  currentness — e.g. Menu restoring focus to a trigger-adjacent item, or Tabs
  syncing currentness with selection? If yes, keep. If no consumer can name a
  use, strip per the freeze. Either way, is `defaultCurrentId` (uncontrolled
  initial) worth keeping even under (a)?

### 7. Nested-composite key isolation via blanket `stopPropagation` — verdict: DECLINED

- **Source:** quarantine `088e4a70c`, `RovingFocus.tsx` — `stopPropagation()`
  on every handled arrow/Home/End/typeahead key; related cases RF-NEST-01
  (inner-only handling) and RF-NEST-02 (outer fallback).
- **API sketch:** no new API — every key the kernel handles stops propagating,
  so an outer RovingFocus never also moves (RF-NEST-01 by brute force).
- **Why not landed:** the design contradicts its own sibling case — blanket
  propagation-stopping breaks RF-NEST-02, which requires an inner composite
  whose orientation does not support a key to leave the event unprevented so
  the bubbled key moves outer focus. Nesting needs a designed solution
  (support-check before consume), not a blanket swallow.
- **Revisit when:** a nesting design that satisfies RF-NEST-01 AND RF-NEST-02
  together is proposed and both pass as browser cases with real nested fixtures.
- **Open questions:** none — hard DECLINED. Killer reason: it makes RF-NEST-02
  unpassable by construction.

## Suspected gaps (no quarantine source)

### 1. Shadow-DOM navigation (composed order + deep active element) — verdict: DEFERRED

- **Evidence:** TESTS.md RF-ENV-02 is specified but unproven everywhere; no
  Book story mounts a composite in a ShadowRoot; quarantine surfaced only the
  dead `getDeepActiveElement` helper (see Non-decisions), never composed-order
  navigation.
- **API sketch:** no new props — registration order, focus tracking, and
  currentness follow composed shadow order; the deepest shadow active element
  is recognized; exactly one shadow child holds `tabIndex=0`.
- **Why not landed:** no shadow consumer exists and no shadow CT harness was
  available; purely speculative work against an unproven case.
- **Revisit when:** a first shadow-DOM consumer is planned (web-components
  distribution story) — then RF-ENV-02 becomes a real gate, not a checkbox.
- **Open questions:** is shadow support in-scope for reference-ui at all, or
  should RF-ENV-02 be cut from the contract? HQ product call.

### 2. Consumer forks: Tabs arrows + Listbox typeahead/IME must compose the kernel — verdict: OPEN

- **Evidence:** SPEC.md Gaps ("Tabs currently reinvents arrows instead of
  composing this kernel") and Done-when ("consumers do not ship a second arrow
  engine"); crew-log UX handoffs — Listbox's engine consumes IME-composing keys
  (focus stolen mid-composition), a bug the kernel's landed RF-TYPE-10 guards
  already prevent; `RovingFocus.md` "Problems we own" names Listbox/Menu/Tabs/
  Tree convergence as the component's reason to exist.
- **API sketch:** no RovingFocus API change — migration work owned with the
  consumer crews: Tabs replaces its arrow handling with `RovingFocus`
  composition; Listbox routes typeahead through the kernel (or its
  `TypeaheadModel`) so IME/editable guards apply once.
- **Why not landed:** out of the RovingFocus landing arc — consumer-owned code,
  each needing its own crew, Book proof, and UX sign-off.
- **Revisit when:** Tabs and Listbox crews schedule kernel adoption; RovingFocus
  side is ready (model is exported, guards are landed).
- **Open questions:** for HQ sequencing — Tabs first (pure arrow duplication)
  or Listbox first (live IME bug)? And does Menu's click-open focus-parking
  policy survive kernel composition unchanged?

## Non-decisions (rejected outright)

- `getDeepActiveElement` exported helper: unreferenced theater, dead in
  quarantine too — rejected in crew log + landing message; shadow needs a real
  design (Suspected gap 1), not a helper.
- `RovingFocus.book.tsx` (quarantine-added): superseded by the `.story.tsx`
  Book format — rejected in crew log ("book file" suspect).
- Public virtual-focus / `aria-activedescendant` mode: Combobox owns it —
  rejected in SPEC.md "Won't do", TESTS.md "Out of scope", `RovingFocus.md`
  "Virtual focus".
- Selection store / item actions: not a keyboard kernel's job — SPEC.md
  "Won't do" + "Next agent", TESTS.md "Out of scope".
- Accordion headers as a roving set: negative composition, headers stay native
  Tab stops — SPEC.md "Next agent", TESTS.md composition note.
- Toolbar / ToggleGroup / grid as extra runtime primitives: documented
  compositions, not new components — `RovingFocus.md` "Leave", TESTS.md "Out
  of scope".
- Headless 350ms typeahead timing: deliberately left; freeze is exact 1000ms
  idle — `RovingFocus.md` "Typeahead".
- Quarantine's "55/55 frozen and verified" SPEC rewrite: claimed proof without
  landing verification (crew baseline was 7/55) — SPEC.md untouched by landing;
  proof accrues per-case through the real gates.

## Walkthrough notes for HQ

- Most important #1: **Controlled current-id — keep or strip (Candidate 6,
  OPEN).** The one breaking API fork: stripping matches the freeze but may
  break consumers; keeping amends the freeze and needs a documented reason.
  Decide before consumer migration starts.
- Most important #2: **Transparent slot contract (Candidate 2, DEFERRED).** The
  freeze's typed API shape — `ReferenceSlotPartProps`, zero host nodes,
  StyleProps merge. Confirm the catalog-wide direction; when Slot conformance
  settles, this is the shape RovingFocus (and siblings) converge on.
- Most important #3: **Visual 2D grid (Candidate 1, DEFERRED).** The biggest
  missing behavior: `orientation="both"` is 1D-with-both-axes today. There is
  deliberately no grid consumer in Book to try — that absence is the tell.
- To feel what landed: open Listbox SingleSelection and Menu StandardDropdown
  in Book (dark, :5000) — same-letter cycling (`s` → Svelte → Solid), RTL
  arrow reversal, exactly-one-tab-stop, Escape focus restore. Typeahead
  Unicode/hidden-skip and the SSR stop are unit-pinned, not story-observable.
