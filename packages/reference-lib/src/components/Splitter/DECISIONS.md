# Splitter decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One-axis flex partition with draggable separator Handles and collapse.

Mechanical follow-ups live in [PATCHES.md](./PATCHES.md); design-gated
follow-ups live in [FEATURES.md](./FEATURES.md). This file keeps the
landed context, every declined decision verbatim, and pointers for
everything that moved.

## Landed (context, 2-4 lines)

Quarantine-landing ported the constraint solver (`splitter-math.ts`,
byte-identical to quarantine `splitterMath.ts`) plus 16 colocated unit
cases, wired solver-based drag/keyboard/Home/End with honest separator
ARIA and no-op callback suppression, and kept all frozen visual
baselines green with a nested UX sign-off. Log:
`.agents/missions/quarantine-landing/splitter.md`; landing commit
`9639bb98e` ("feat(splitter): port quarantine constraint solver, honest
separator ARIA, no-op suppression", verified on `reference-system`).

## Candidate features (quarantine-sourced)

Moved items keep their titles below with a pointer to their new home;
full provenance (source, API sketch, why-not-landed, revisit-when, open
questions) moved with them.

- 1. Required controlled `value` + v2 Root contract — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (breaking v2 prop contract, needs release-vehicle design).
- 2. Panel `min`/`max` + DOM-order registration — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (breaking rename, ships with item 1).
- 3. Measured CSS-length constraints — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (new string-constraint behavior; SSR story and failure diagnostic undecided).
- 4. CSS-variable geometry contract — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (observable-CSS redesign needing HQ sign-off).
- 5. Pointer-session frame budget — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (rewrite-class drag loop; cross-engine bar undecided).
- 6. Full pointer-session robustness contract — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (contract frozen in TESTS.md; pin the twelve cases).
- 7. Keyboard interaction sessions — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (contract frozen; keyup-session tracking + passthrough matrix).
- 8. Enter collapse/restore — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (APG + Zag contract frozen; bind the key).
- 9. Collapse restore memory + dynamic panels — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (reinsert-recovery semantics and diagnostic wording undecided).
- 10. RTL direction wiring — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (contract frozen; wire inherited direction through keys, drag, ARIA).
- 11. Disabled/blocked Handle determinism — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (focusable-but-inert vs. out-of-tab-order is a UX call).
- 12. Drag denominator is the Panel-axis sum — verdict: DEFERRED → moved to [FEATURES.md](./FEATURES.md) (changes shipped drag feel; ships with measured constraints).
- 13. Environment and composition proof suites — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (matrix proof obligations; re-target, don't copy).
- 14. Strict structural anatomy errors — verdict: OPEN → moved to [FEATURES.md](./FEATURES.md) (throw vs. dev-error vs. render-nothing is a product call).
- 15. Default min floor 0 vs shipped 5% — verdict: OPEN → moved to [FEATURES.md](./FEATURES.md) (0 vs. 5% is a product call).

### 16. Grid / block / one-Panel layout modes — verdict: DECLINED

- **Source:** quarantine commit `c7bdd1f7c` (enforces single-axis
  `Panel (Handle Panel)+` anatomy, never builds another mode);
  no case ID — quarantine withholds the API (nearest cases:
  `SP-DOM-02` rejects one-Panel trees, `SP-DOM-13` type-errors
  authored `display: grid`, `SP-COMP-04` proves grids live
  *inside* Panels).
- **API sketch:** would add a grid mode (rewriting
  `grid-template-*` from the pointer), a block/BYO-parent mode,
  or a one-Panel tree as a supported form.
- **Why not landed:** quarantined to withhold it — Splitter.md
  ("no grid mode … Flex is the 1D tool"), SPEC.md "Won't do:
  Grid mode", and TESTS.md "Out of scope" (grid/block mode,
  one-Panel tree, second `Resizable`) all agree.
- **Revisit when:** never via Splitter — a 2D chrome need ships
  as nested Splitters or PageLayout grid wrapping a Splitter,
  per Splitter.md's convergence table.
- **Open questions:** none — killer reason: three independent
  sources (quarantine anatomy, SPEC, design narrative) decline
  it; a grid mode reintroduces the width/flex/grid consistency
  hole the whole design exists to delete.

### 17. Extra callbacks, collapse animation, persistence — verdict: DECLINED

- **Source:** quarantine commit `c7bdd1f7c` (keeps exactly
  `onChange`/`onChangeEnd`, no animation, no storage); no case
  ID — quarantine never builds them (nearest: `SP-CTRL-*` fix
  the two-callback contract, `SP-COLLAPSE-*` snap without
  animation).
- **API sketch:** would add `onCollapse`/`onExpand`/
  `onDragStart`/`onDragEnd`/`onHandleHover`, a parallel
  `isCollapsed` boolean, collapse transitions, snap points,
  auto-save/persistence, imperative layout methods, or public
  hit-region APIs.
- **Why not landed:** quarantined to withhold it — TESTS.md "Out
  of scope" names every one of these, and Splitter.md "Leave"
  lists baked callbacks, collapse animation with forced reflow,
  and auto-save/`defaultSize`.
- **Revisit when:** never via this primitive — each is
  application code over the `value`/`onChange` contract (a
  preset/sidebar product owns its persistence; animation is
  application CSS against `data-resizing`/collapsed hooks).
- **Open questions:** none — killer reason: all of them are
  expressible today through the controlled array plus state
  hooks; no Splitter API is needed.

## Suspected gaps (no quarantine source)

- 1. 9px Handle below the 24px target minimum — verdict: OPEN → moved to [FEATURES.md](./FEATURES.md) (invisible hit area vs. wider bar is a product call).
- 2. No `prefers-reduced-motion` on Handle transitions — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (one-line CSS once the lib-wide convention is confirmed).
- 3. Root-level `disabled` has no freeze case — verdict: OPEN → moved to [FEATURES.md](./FEATURES.md) (freeze vs. remove with group announce semantics undecided).

### 4. No default separator accessible name — verdict: DECLINED

- **Evidence:** nested ux-designer review, filed in the crew log
  (`.agents/missions/quarantine-landing/splitter.md:24`) — Handles
  render with no accessible name unless the application supplies
  one.
- **API sketch:** would add a baked-in fallback name (e.g.
  "Resize") or auto-generated "Resize \<panel\>" labels.
- **Why not landed:** declined by the freeze, not overlooked —
  TESTS.md `SP-DOM-08` ("an application supplies the accessible
  name, while Splitter owns whether the separator can act") and
  Splitter.md ("Leave baked `aria-label`") assign naming to the
  application; a baked English fallback would be wrong in every
  other locale.
- **Revisit when:** never via a baked default — if unnamed
  separators prove to be a real consumer pitfall, the lever is a
  dev warning for missing names, not a product string.
- **Open questions:** none — killer reason: the freeze assigns
  naming to the application and explicitly leaves baked labels;
  a default name is a product string Splitter must not own.

- 5. SP-A11Y-01 checker sweep never executed — verdict: DEFERRED → moved to [PATCHES.md](./PATCHES.md) (specified checker run; execute once its states exist).

## Non-decisions (rejected outright)

- Quarantine's single-commit rewrite vehicle (`c7bdd1f7c`, 978/467
  `.tsx` rewrite deleting uncontrolled mode + renaming props + dropping
  Thumb in one commit) — mangling-class, rejected as a vehicle; the
  designed successors are items 1–2; see crew log
  (`splitter.md:11-13`) and recon §4 exhibit 1.
- `SplitterThumb` deletion (12 `Thumb` hits on base, 0 on quarantine)
  — chrome-removal-class, rejected; Thumb retained and UX-signed; the
  freeze "Won't do" covers dots-as-kernel, not the part itself; see
  crew log (`splitter.md:13,28`) and SPEC.md "Still open".
- Verbatim lift of quarantine's 68 e2e + 15 unit splitter cases —
  they encode the mangled API (required `value`, renamed props) and
  have no matrix home on this branch; re-target, don't copy; see crew
  log (`splitter.md:11,22`) and SPEC.md "Named `[x]` 24 / 83".

## Walkthrough notes for HQ

- Deepest behavior gap: the pointer-session frame budget
  ([FEATURES.md](./FEATURES.md), with the CSS-variable contract beside
  it). In Book's `/splitter` Constrained story, drag a Handle and
  feel every `pointermove` commit React — the freeze wants
  origin-solve plus CSS-var ref writes with zero commits, zero layout
  reads, and frozen ARIA until release. Feel for jank on a heavy
  page: that is the scheduling argument, and the item forces the
  variable contract and drag-denominator calls too.
- Largest API-shape call: required `value` + `min`/`max`
  ([FEATURES.md](./FEATURES.md)). In Book, the stories still use
  `defaultValue` and `minSize`/`maxSize`/`index` — the freeze renames
  all of it and deletes uncontrolled mode. Pick the v2 release
  vehicle (major + codemod vs. permanent convenience tier) before any
  other API work, because measured constraints, restore memory, and
  the proof suites all assume the renamed contract.
- Most immediate product questions: anatomy severity and the min
  floor ([FEATURES.md](./FEATURES.md)). Try rendering a one-Panel
  Splitter and an unconstrained drag-to-zero in Book — today the
  first renders oddly with a dev warning and the second stops at 5%.
  Both are one-line changes once HQ picks throw-vs-warn and 0-vs-5%.
- Keyboard/collapse cluster ([PATCHES.md](./PATCHES.md) sessions +
  Enter; [FEATURES.md](./FEATURES.md) restore memory + 9px target):
  focus a Handle in the CollapsibleDemo story and press Enter —
  nothing happens; hold an Arrow and feel each repeat emit its own
  end event. Pair this pass with the 9px-target answer, since both
  touch the Handle.
- Likely-to-do first slices ([PATCHES.md](./PATCHES.md)): touch drag
  and nested-group isolation (robustness contract), the RTL axis once
  keys/drag are touched, and the reduced-motion guard alongside any
  Handle CSS work.
