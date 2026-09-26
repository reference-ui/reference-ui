# Tree decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: minimal APG tree — visible-only roving, single select, typeahead.

## Landed (context, 2-4 lines)

Quarantine-landing ported 14 zero-paint hardening wins (forwardRefs,
branch auto-detect, posinset/setsize, idempotent select, focus recovery,
shared TypeaheadModel, expander AT-exposure fix) plus 48 CT cases and 3
unit tests, leaving all 15 snapshots byte-identical: zero visual delta.
Log: `.agents/missions/quarantine-landing/tree.md`; landing commit
`22a414edc` (`feat(tree): land 14 quarantine stability wins + 51-case
suite, freeze visuals`, verified via `git log`).

## Candidate features (quarantine-sourced)

### 1. Combobox virtual-focus bridge + commit routing — verdict: DEFERRED

- **Source:** quarantine commit `b8b5f1aff`,
  `packages/reference-lib/src/components/Tree/Tree.tsx`
  (`ComboboxContext` import, `combobox.registerOption` /
  `setActiveValue` / `activeValue` wiring) and fixture section
  "Combobox Tree Integration" in `matrix/lib/src/tree.tsx`. Case IDs:
  `TR-CB-01`–`TR-CB-06`, `TR-COMP-03`.
- **API sketch:** no new Tree props. Nesting a Tree directly in
  `Combobox.Popover` auto-registers its visible item set through the
  shared bridge: DOM focus stays on the input,
  `aria-activedescendant` names mounted visible treeitems, horizontal
  keys request expansion under virtual focus, activation commits one
  scalar through `Combobox.onChange` only, and the virtually focused
  item publishes `data-active` as a preview hook independent of
  `aria-selected`.
- **Why not landed:** new cross-component feature, Combobox territory
  per TESTS.md "Owned elsewhere" (input focus and active-descendant
  lifecycle belong to Combobox). Landing stayed stability-only.
  Quarantine's `data-active=combobox-active` flavor would additionally
  have regressed the current `data-active=focus` semantics.
- **Revisit when:** Combobox owns the bridge contract: adapter shape,
  `data-active` semantics reconciliation (focus vs virtual-active),
  and the commit-authority proof land together on the Combobox side.
- **Open questions:** does `data-active` mean DOM focus, virtual
  focus, or both (two hooks)? Must registration be fully automatic
  (no adapter prop) or opt-in? Who clears stale active IDs on
  collapse — Tree push or Combobox pull?

### 2. Shadow-root focus discovery and traversal — verdict: DEFERRED

- **Source:** quarantine commit `b8b5f1aff`,
  `matrix/lib/tests/e2e/tree.spec.ts` (`TR-ENV-03`). No quarantine
  source change proved it — the case specifies reading focus from the
  owning root and matching light-DOM traversal inside an open
  ShadowRoot.
- **API sketch:** no new props. Focus reads (`document.activeElement`
  assumptions) become owning-root reads (`getRootNode()`), so
  vertical, horizontal, Home/End, and typeahead commands behave
  identically for trees mounted in a ShadowRoot.
- **Why not landed:** lib-wide framework concern, not Tree stability:
  shadow-portal key events hit React container-delegation retargeting
  (native target retargets to the host, so item handlers never fire).
  Same skip as Switch `SW-ENV-03`; fixing it in Tree alone would fork
  the event model.
- **Revisit when:** a lib-wide shadow strategy exists (portal event
  retargeting solved once, in shared infrastructure) with a passing
  CT that mounts Tree in an open ShadowRoot.
- **Open questions:** is ShadowRoot a supported mount target for all
  components or a Tree/portal-only carve-out? Native listeners at the
  shadow root vs React delegation — which layer owns the fix?

### 3. Exported `TreeHierarchyModel` (hierarchy unit model) — verdict: DECLINED

- **Source:** quarantine commit `b8b5f1aff`,
  `packages/reference-lib/src/components/Tree/Tree.tsx`
  (`export interface TreeNode`, `export class TreeHierarchyModel`
  with find/parent/sibling/traversal/mutation methods). Case IDs:
  `TR-DYNAMIC-01`, `TR-DYNAMIC-02` (unit).
- **API sketch:** a public mutable tree-collection class:
  `new TreeHierarchyModel({ rootNode })` with parent lookup,
  one-based level/position/set-size, depth-first next/previous,
  insert/remove/reorder/move-branch — the Zag tree-collection
  algorithm as a library export.
- **Why not landed:** test theater — the export is unreferenced by
  quarantine's own component (the shipped Tree traverses the live DOM,
  not the model), so the unit cases prove a fixture class, not the
  freeze. Dynamics are proven where they matter via browser cases
  `TR-DYNAMIC-03`–`TR-DYNAMIC-06` (focus recovery, state survival,
  leaf/branch flips, disabled churn), all landed.
- **Revisit when:** a real consumer needs hierarchy answers without a
  mounted DOM (SSR pre-computation, virtualized windowing) — with an
  in-component call site, not a standalone class.
- **Open questions:** none — killer reason: quarantine itself never
  called it, so exporting it would ship API surface with zero
  behavioral proof.

### 4. Controlled-only state (delete `defaultValue`/`defaultExpanded`) — verdict: DECLINED

- **Source:** quarantine commit `b8b5f1aff`,
  `packages/reference-lib/src/components/Tree/Tree.tsx` (no
  `defaultValue`/`defaultExpanded`, no internal store) and TESTS.md
  "Freeze defaults" (omission means controlled null/`[]`). Case ID:
  `TR-DOM-10` as frozen.
- **API sketch:** removes `defaultValue?: string | null` and
  `defaultExpanded?: string[]` from `TreeProps`; omitting `value` /
  `expanded` means controlled `null` / `[]`, and interaction emits
  requests that a non-updating parent visibly ignores.
- **Why not landed:** mangling-class breaking API change (recon
  §4 exhibit 1: uncontrolled-mode deletion across the quarantine
  branch). Current Tree ships uncontrolled mode with an internal
  store; landing re-targeted `TR-DOM-10` to pin that contract instead
  (uncontrolled omission expands/selects; controlled-without-callbacks
  stays put).
- **Revisit when:** HQ explicitly decides the library is
  controlled-only everywhere — a catalog-wide breaking change with a
  migration major, never a per-component drift.
- **Open questions:** none — killer reason: deleting working public
  API to match a freeze is a breaking change with no user ask.

### 5. Fall-through key handling for non-editable descendants — verdict: DECLINED

- **Source:** quarantine commit `b8b5f1aff`,
  `packages/reference-lib/src/components/Tree/Tree.tsx` (key
  handling that falls through for non-editable descendants instead of
  the current early return). No dedicated case ID; adjacent to
  `TR-KEY-10`.
- **API sketch:** no new props. Key events from interactive but
  non-editable descendants (links, buttons, application actions inside
  rows) would fall through to Tree navigation/selection/expansion
  instead of being left entirely to native behavior.
- **Why not landed:** out-of-scope rows per TESTS.md "Out of scope"
  (application links/actions inside rows are deliberately excluded
  from the minimal single-select APG tree), and the current
  early-return passes `TR-KEY-10` (editable-descendant boundary).
  Fall-through would grow row-interior semantics the freeze excludes.
- **Revisit when:** HQ scopes application content inside rows (links,
  actions, load-more) as a designed feature with its own key-ownership
  matrix — not as a drive-by behavior change.
- **Open questions:** none — killer reason: TESTS.md explicitly puts
  row-interior application content out of scope.

## Suspected gaps (no quarantine source)

### 1. Slot / part registration replacing `Children.forEach` sniffing — verdict: OPEN

- **Evidence:** SPEC.md "Gaps & incoherence" (`React.Children.forEach`
  sniffs Group vs row — not Slot / part registration) and SPEC.md
  work order item 6 ("Replace child sniffing with part registration
  (Slot)"). Landing kept the render-time children scan deliberately:
  with the two-path branch/leaf DOM, registration state would
  mismatch SSR hydration.
- **API sketch:** no public prop change. `Tree.Item` learns it owns a
  `Tree.Group` via Slot composition / part registration context
  rather than scanning `children` element types at render time —
  internal architecture, same authored JSX.
- **Why not landed:** internal refactor with hydration risk and no
  behavioral delta; landing froze what works (render-time scan is
  SSR-safe) and left the architecture call to HQ.
- **Revisit when:** the library settles a shared Slot/part-registration
  pattern other components already use, so Tree follows a proven
  shape instead of inventing one.
- **Open questions:** does Slot registration preserve SSR safety for
  the two-path branch/leaf DOM? Is child-sniffing banned
  catalog-wide or tolerated where hydration-safe?

### 2. Shared `RovingFocus` for roving (not DOM queries) — verdict: OPEN

- **Evidence:** SPEC.md "Gaps & incoherence" ("Roving via DOM queries,
  not shared RovingFocus") and TESTS.md "Owned elsewhere" (generic
  one-tab-stop/typeahead behavior belongs to `RovingFocus`). Landing
  moved typeahead onto the shared `TypeaheadModel` but left arrow
  roving on DOM queries.
- **API sketch:** no public prop change. Up/Down/Home/End move through
  the visible set via the shared `RovingFocus` engine (registration +
  visible-set filter) instead of `querySelector` traversal — internal
  architecture, identical key map.
- **Why not landed:** behavior is fully proven via `TR-KEY-01`–`08`
  on the DOM-query implementation; swapping engines mid-landing risked
  the visible-only invariant (collapsed descendants absent from the
  set) for no observable gain.
- **Revisit when:** `RovingFocus` supports a visible-set / filtered
  membership natively, so Tree can adopt it without reimplementing
  collapse filtering on top.
- **Open questions:** should the shared engine own visibility
  filtering, or does each consumer filter? Who pays for the
  `TR-KEY-08` stale-registration proof after the swap?

## Non-decisions (rejected outright)

- `id` → `value` / `Expander itemId` → `aria-label` Book rewrites: prop-rename churn, rejected in crew log (`tree.md` Triage SUSPECT: "Tree.book.tsx changes").
- `CollapsedByDefault` story deletion and uncontrolled-story removal: controlled-only theater in docs, rejected in crew log (uncontrolled preserved).
- Single-path branch DOM restructure (flexWrap/inline children): visual restructure of frozen DOM, rejected in crew log (SUSPECT: "frozen").
- SPEC "Resolved / Production Yes" claims: freeze-declaration inflation, rejected in crew log (SUSPECT; SPEC.md Production stays **No**).
- Multi-select, virtualization, treegrid, DnD, checkboxes, load-more: explicitly out of scope per TESTS.md "Out of scope" and SPEC.md "Won't do" — never candidates.

## Walkthrough notes for HQ

- Most important #1: the Combobox bridge stays **deferred** (candidate 1) — nesting Tree in a Combobox popover today gets no virtual focus, no `aria-activedescendant`, no routed commit. In Book, open the Tree + Combobox stories side by side and confirm no composition story exists; the design question is `data-active` semantics (focus vs virtual-active) before any code.
- Most important #2: uncontrolled mode is **preserved**, controlled-only **declined** (candidate 4) — `defaultValue`/`defaultExpanded` keep working. In Book, open `CollapsedByDefault` and expand/select without any state props; deleting that would be a breaking change needing a catalog-wide major.
- Most important #3: the hierarchy model export is **declined as theater** (candidate 3) — dynamics are proven in the browser, not via a class quarantine itself never called. In Book, try collapsing an ancestor of a selected nested item (selection survives, focus lands on the branch) to feel `TR-DYNAMIC-03`/`04` without any model import.
- Bonus feel: the expander AT-exposure fix is the biggest landed a11y win — in Book's FileExplorer story, inspect any branch Expander: it is a named `button[tabindex=-1]` with `aria-controls` resolving to its Group, no longer `aria-hidden`.
