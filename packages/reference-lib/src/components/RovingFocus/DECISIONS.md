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

Moved items now live in `PATCHES.md` (mechanical, test-pinnable) or
`FEATURES.md` (needs design). Titles kept here as an index; full prior text
(incl. sources and open questions) is preserved in the new files' entries.

### 1. Visual 2D grid navigation for `orientation="both"` — verdict: DEFERRED → moved to FEATURES.md #1 (row-grouping heuristics + nearest-center UX need design and a real grid consumer).

### 2. Transparent slot contract (`ReferenceSlotPartProps` + StyleProps) — verdict: DEFERRED → moved to FEATURES.md #2 (catalog-wide API shape decision, lands on Slot conformance).

### 3. Runtime single-element anatomy error (incl. Fragment rejection) — verdict: DEFERRED → moved to FEATURES.md #3 (throw vs dev-only warning is an HQ behavior call + needs consumer audit).

### 4. Capture-phase Space typeahead guard — verdict: DEFERRED → moved to PATCHES.md #1 (fully specified; RF-TYPE-06 CT case pins it today).

### 5. Pointer press sets current item — verdict: DEFERRED → moved to FEATURES.md #4 (focus-move vs currentness-only feel differs; Menu policy reconciliation needed).

### 6. Controlled current-id API: keep vs strip to freeze — verdict: OPEN → moved to FEATURES.md #5 (the breaking API fork; HQ must pick before consumer migration).

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

### 1. Shadow-DOM navigation (composed order + deep active element) — verdict: DEFERRED → moved to FEATURES.md #6 (in-scope-or-cut is an HQ product call; no consumer exists).

### 2. Consumer forks: Tabs arrows + Listbox typeahead/IME must compose the kernel — verdict: OPEN → moved to FEATURES.md #7 (cross-crew migration with sequencing + Menu-policy UX calls).

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

- Most important #1: **Controlled current-id — keep or strip (FEATURES.md
  #5).** The one breaking API fork: stripping matches the freeze but may break
  consumers; keeping amends the freeze with a named reason. Decide before
  consumer migration starts — feel the stakes in FEATURES.md #7.
- Most important #2: **Transparent slot contract (FEATURES.md #2).** The
  freeze's typed API shape — `ReferenceSlotPartProps`, zero host nodes,
  StyleProps merge. Confirm the catalog-wide direction; when Slot conformance
  settles, this is the shape RovingFocus (and siblings) converge on.
- Most important #3: **Visual 2D grid (FEATURES.md #1).** The biggest missing
  behavior: `orientation="both"` is 1D-with-both-axes today. There is
  deliberately no grid consumer in Book to try — that absence is the tell.
- The one mechanical patch: **Space typeahead guard (PATCHES.md #1)** —
  specified, needs no design call; RF-TYPE-06 as a CT browser case proves it.
- Design-backlog tour: anatomy error (FEATURES.md #3), pointer currentness
  (FEATURES.md #4), shadow scope (FEATURES.md #6), consumer convergence
  (FEATURES.md #7) — each names its HQ call and a maintainer take.
- To feel what landed: open Listbox SingleSelection and Menu StandardDropdown
  in Book (dark, :5000) — same-letter cycling (`s` → Svelte → Solid), RTL
  arrow reversal, exactly-one-tab-stop, Escape focus restore. Typeahead
  Unicode/hidden-skip and the SSR stop are unit-pinned, not story-observable.
