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

Moved to [FEATURES.md](./FEATURES.md) entry 1: needs Combobox-owned bridge design (`data-active` semantics, adapter shape, commit authority).

### 2. Shadow-root focus discovery and traversal — verdict: DEFERRED

Moved to [FEATURES.md](./FEATURES.md) entry 2: needs a lib-wide shadow/event strategy, not a Tree-only fix.

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

Moved to [FEATURES.md](./FEATURES.md) entry 3: needs a shared Slot-pattern design to follow first.

### 2. Shared `RovingFocus` for roving (not DOM queries) — verdict: OPEN

Moved to [FEATURES.md](./FEATURES.md) entry 4: needs visible-set engine design (filter ownership) first.

## Non-decisions (rejected outright)

- `id` → `value` / `Expander itemId` → `aria-label` Book rewrites: prop-rename churn, rejected in crew log (`tree.md` Triage SUSPECT: "Tree.book.tsx changes").
- `CollapsedByDefault` story deletion and uncontrolled-story removal: controlled-only theater in docs, rejected in crew log (uncontrolled preserved).
- Single-path branch DOM restructure (flexWrap/inline children): visual restructure of frozen DOM, rejected in crew log (SUSPECT: "frozen").
- SPEC "Resolved / Production Yes" claims: freeze-declaration inflation, rejected in crew log (SUSPECT; SPEC.md Production stays **No**).
- Multi-select, virtualization, treegrid, DnD, checkboxes, load-more: explicitly out of scope per TESTS.md "Out of scope" and SPEC.md "Won't do" — never candidates.

## Walkthrough notes for HQ

- Most important #1: the Combobox bridge stays **deferred** — full spec now in [FEATURES.md](./FEATURES.md) entry 1. To feel the gap: in Book, open the Tree + Combobox stories side by side and confirm no composition story exists — nesting Tree in a Combobox popover today gets no virtual focus, no `aria-activedescendant`, no routed commit. The design question is `data-active` semantics (focus vs virtual-active) before any code.
- Most important #2: uncontrolled mode is **preserved**, controlled-only **declined** (candidate 4, kept verbatim above) — `defaultValue`/`defaultExpanded` keep working. In Book, open `CollapsedByDefault` and expand/select without any state props; deleting that would be a breaking change needing a catalog-wide major.
- Most important #3: the hierarchy model export is **declined as theater** (candidate 3, kept verbatim above) — dynamics are proven in the browser, not via a class quarantine itself never called. In Book, try collapsing an ancestor of a selected nested item (selection survives, focus lands on the branch) to feel `TR-DYNAMIC-03`/`04` without any model import.
- Open-items map: every open/deferred item now lives in [FEATURES.md](./FEATURES.md) (entries 1–4) because each needs a design call; [PATCHES.md](./PATCHES.md) is therefore empty. To feel what the two refactor entries must preserve: in Book's FileExplorer story, arrow-key through branches (visible-only roving entry 4 must not regress) and note the SSR-safe two-path branch/leaf DOM (entry 3 must stay hydration-safe).
- Bonus feel: the expander AT-exposure fix is the biggest landed a11y win — in Book's FileExplorer story, inspect any branch Expander: it is a named `button[tabindex=-1]` with `aria-controls` resolving to its Group, no longer `aria-hidden`.
