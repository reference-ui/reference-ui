# Splitter decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One-axis flex partition with draggable separator Handles and collapse.

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

### 1. Required controlled `value` + v2 Root contract — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` (`value:
  number[]` required, `defaultValue` deleted — zero `defaultValue`
  hits on the branch vs shipped optional); e2e `SP-CTRL-01`..`SP-CTRL-06`,
  unit `SP-TYPE-01`.
- **API sketch:** `value` becomes required (percentages summing to
  100); `defaultValue` and internal uncontrolled state are removed;
  `onChange` requests each changed complete array and `onChangeEnd`
  the last requested layout once per interaction; Root drops
  `disabled` (Handle owns it) and `display`/`flexDirection` leave the
  StyleProps surface.
- **Why not landed:** breaking API redesign, not stability — it deletes
  the shipped uncontrolled mode every current consumer may rely on;
  recon §4 exhibit 1 classes the deletion as mangling and the landing
  retained uncontrolled deliberately (SPEC.md "Still open").
- **Revisit when:** HQ schedules the Splitter v2 prop contract (ideally
  together with item 2, since the rename defines the same breaking
  release); SPEC.md work-order item 1 names it explicitly.
- **Open questions:** only timing and migration — TESTS.md freeze
  decision 1 fixes the shape; confirm whether a codemod covers
  internal `defaultValue` consumers or uncontrolled stays as a
  permanent convenience tier.

### 2. Panel `min`/`max` + DOM-order registration — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx`
  (`SplitterPanelProps`: `min`/`max`, `index` deleted); unit
  `SP-TYPE-01` (numeric/CSS-string `min`/`max`, behavior props on the
  right part).
- **API sketch:** `minSize`/`maxSize` become `min`/`max` (numbers are
  percentage points, strings are measured lengths — see item 3); the
  `index` prop is dropped and Panel order comes from DOM registration;
  `flex`/`flexGrow`/`flexBasis` leave the Panel/Handle StyleProps
  surface so applications cannot fight the kernel.
- **Why not landed:** breaking rename with no runtime win today — the
  landing wired the solver behind the shipped `minSize`/`maxSize`/
  `index` names instead; SPEC.md work-order item 1 sequences the
  rename with item 1.
- **Revisit when:** the v2 prop contract (item 1) is scheduled — the
  two renames must land in the same breaking release, with `index`
  removal proved by `SP-DYNAMIC-01` re-targeted to real DOM order.
- **Open questions:** none on shape (TESTS.md freeze decisions fix
  it); confirm the deprecation path (alias with dev warning vs.
  hard cut) for `minSize`/`maxSize`/`index`.

### 3. Measured CSS-length constraints — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `splitterMath.ts`
  (`parseCssLengthToPx`, `resolveConstraintToPercentage` — ported
  byte-identical but unwired at component level); unit `SP-MATH-06`,
  `SP-MATH-07`, `SP-MATH-08`, `SP-MATH-11`; e2e `SP-DYNAMIC-02`.
- **API sketch:** string `min`/`max` (`"120px"`, `"10rem"`, `"12r"`,
  `"20%"`) resolve against the available group size (Panel-axis sum,
  Handles excluded); `%` strings are of that available size, `r`
  resolves through the spacing root; conversion happens at
  pointerdown capture and on idle resize, never per move.
- **Why not landed:** feature, not salvage — the math is in the tree
  but the component passes numerics only; landing it needs idle
  `ResizeObserver` re-resolution, capture-time conversion, and the
  SSR story (`SP-ENV-01`), none of which the stability landing could
  carry.
- **Revisit when:** a consumer needs pixel-denominated constraints
  (fixed sidebar/console widths — see `SP-COMP-02`); pairs with item
  5, which defines where conversion is forbidden.
- **Open questions:** does the `r` unit resolve through the same
  spacing root as StyleProps in every theme (TESTS.md says yes —
  confirm no second root exists)? What is the dev diagnostic when a
  string fails to parse at capture time?

### 4. CSS-variable geometry contract — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` (Panel
  `--reference-splitter-panel-size`, Root `--reference-splitter-N`);
  e2e `SP-DOM-09`, `SP-DOM-12`, `SP-DOM-13`; freeze decision 6.
- **API sketch:** each Panel publishes its percentage as
  `--reference-splitter-panel-size` (unit included) with Panel
  `flex: 1 1 var(--reference-splitter-panel-size)` and
  `min-width`/`min-height: 0` on the layout axis; Root publishes
  `--reference-splitter-1..N` in Panel order; Splitter never writes
  inline `flex-basis`/`width` or `grid-template-*` as a competing
  signal.
- **Why not landed:** observable-CSS redesign — the landing kept the
  shipped `flexBasis: ${size}%` React-state writes so every frozen
  baseline stayed byte-identical; the variable contract changes what
  consumer CSS can read and what the hot path writes.
- **Revisit when:** item 5 (frame budget) is staffed — the variable is
  the write target the hot path needs; land both behind the same
  Book review showing consumer CSS reading the Root indexed vars.
- **Open questions:** none on names (TESTS.md fixes them); confirm HQ
  accepts the one observable change (idle DOM carries custom
  properties where it carries inline `flex-basis` today).

### 5. Pointer-session frame budget — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` pointer
  session (origin capture, ref writes, ARIA isolation); e2e
  `SP-PERF-01`..`SP-PERF-07`, `SP-MATH-12` (origin-relative math
  landed; the session architecture around it did not),
  `SP-CTRL-02`, `SP-CTRL-05`.
- **API sketch:** no new props — a performance contract: pointerdown
  captures origin pointer/layout/group size/converted constraints in
  one layout read; each move solves origin + total delta, writes CSS
  vars through refs, and fires one `onChange`; per move it must not
  React-commit, read layout, convert lengths, write ARIA, schedule
  rAF, or attach/detach listeners; visuals follow the solver until
  pointerup, then `value`.
- **Why not landed:** rewrite-class drag loop — the landing kept the
  shipped commit-per-move drag (React state per `pointermove`) and
  `SP-PERF-*` untouched; the budget needs items 3 and 4 (capture
  conversion target, var write target) first.
- **Revisit when:** items 3 and 4 land, or a perf profile shows drag
  jank in a real editor surface — then port the session per
  Splitter.md "While the pointer is down" and prove all seven
  `SP-PERF` cases.
- **Open questions:** is `SP-PERF-04`'s "same turn, before rAF" bar
  the committed bar on all three engines, or Chromium-first with
  Firefox/WebKit best-effort?

### 6. Full pointer-session robustness contract — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` session
  handling; e2e `SP-DRAG-01`, `SP-DRAG-04`..`SP-DRAG-12`,
  `SP-END-01`, `SP-END-03`, `SP-END-04` (`SP-END-01`/`SP-END-03`
  partially pinned by the landing's close-out fix).
- **API sketch:** no new props — behavior hardening: immediate
  pointer capture + Handle focus + `data-resizing` on primary
  pointerdown; group-wide single owner across concurrent pointers;
  touch identifier isolation with axis scroll suppression;
  primary-pen/primary-button gating; document selection lock and
  `col-resize`/`row-resize` cursor for the gesture; nested-group
  isolation (only the owning Handle's group moves); secondary-click
  termination; one cleanup on every cancel path (pointercancel, lost
  capture, `buttons=0`, blur, disable/removal, unmount) with no
  `onChangeEnd` and no stuck cursor/selection/listeners.
- **Why not landed:** breadth — the landing covers the common path
  (window pointermove/up, pointercancel cleanup, moved-drag
  close-out) and pinned `SP-END-01`/`SP-END-03` slices; the
  touch/nested/multi-pointer/cancel matrix is twelve cases of new
  behavior, not stabilization.
- **Revisit when:** a touch-device or nested-workspace (`SP-COMP-03`)
  consumer arrives, or the next a11y/robustness pass is staffed —
  `SP-DRAG-05` (touch) and `SP-DRAG-11` (nested) are the two
  highest-value first slices.
- **Open questions:** none on contract (TESTS.md fixes each path);
  confirm the `[browser:all]` cases stay engine-gated rather than
  colocated-CT.

### 7. Keyboard interaction sessions — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` key
  handling; e2e `SP-END-02` (repeated keydowns = one interaction
  ending on keyup), `SP-KEY-02` (cross-axis passthrough),
  `SP-KEY-07` (unsupported shortcuts preserved).
- **API sketch:** no new props — today each Arrow/Home/End keydown
  emits its own `onChange` + `onChangeEnd`; the freeze makes held
  repeats (Arrow, Shift+Arrow, Home/End, Enter collapse) one
  interaction with one `onChangeEnd` carrying the final layout on
  the matching keyup, while cross-axis Arrows and
  Ctrl/Alt/Meta-modified, PageUp/Down, Escape, F6, and printable
  keys pass to the application unprevented with no callbacks.
- **Why not landed:** session-state feature — the landing kept
  per-keydown end emission (shipped behavior) and pinned only
  Home/End bounds (`SP-KEY-04`); keyup-session tracking plus the
  passthrough matrix is new state, not a port.
- **Revisit when:** the keyboard/collapse pass (item 8) is staffed —
  both touch `handleKeyDown` and should land together so the end
  semantics are proven once.
- **Open questions:** none on contract (TESTS.md fixes it); confirm
  held-key auto-repeat rate differences across engines don't need a
  normalization story for the single-end assertion.

### 8. Enter collapse/restore — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx` Enter
  handling; e2e `SP-COLLAPSE-01`, `SP-COLLAPSE-02`,
  `SP-COLLAPSE-03`; freeze decision 3.
- **API sketch:** no new props — Enter on a Handle whose logical
  primary Panel opted into `collapsible` requests `collapsedSize`
  (redistributed through the solver, consumed event); Enter on a
  collapsed Panel restores the last feasible expanded size (clamped
  to current constraints, not the stale remembered value); Enter
  beside a non-collapsible Panel stays unprevented for the
  application with no callbacks.
- **Why not landed:** scoped out at triage — the landing wired
  collapse *snapping* through the solver (`SP-COLLAPSE-04/07/08`)
  but no Enter binding; the key needs the restore-memory and
  session semantics (items 7 and 9) to be meaningful.
- **Revisit when:** items 7 and 9 are staffed — Enter is the key
  cap on that pass; `SP-COMP-01` (collapsible sidebar) is its
  composition proof.
- **Open questions:** none on contract (APG window-splitter Enter
  + Zag restore memory are both frozen in TESTS.md); confirm HQ
  wants no visible affordance change on collapsible Handles
  (chevron/cue) alongside the key.

### 9. Collapse restore memory + dynamic panels — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx`
  (remembered sizes keyed by Panel id, atomic reorder/insert/
  remove); e2e `SP-COLLAPSE-05`, `SP-COLLAPSE-06`,
  `SP-DYNAMIC-01`, `SP-DYNAMIC-03`; freeze decision 7.
- **API sketch:** no new props — remembered expanded sizes key
  by stable Panel id (React key), never by array position, so
  reorder keeps each Panel's memory, removed Panels take theirs,
  and inserted Panels never inherit a stranger's size; arrays
  stay positional with atomic value/order updates; programmatic
  value changes crossing the collapse boundary update collapsed
  hooks with no callbacks; transiently invalid trees (hidden
  middle Panel) fail locally with a diagnostic and strand no
  document state.
- **Why not landed:** state-model feature — the landing has no
  id-keyed memory (single-session snapping only) and no
  dynamic-panel story; it needs item 2's DOM-order registration
  to define what "stable identity" means.
- **Revisit when:** item 2 lands (registration defines identity),
  then with item 8 as the collapse/dynamic pass.
- **Open questions:** must reinserting a removed Panel id recover
  its memory (TESTS.md says "may" — confirm may vs. must)? What
  is the dev diagnostic wording for transiently invalid anatomy?

### 10. RTL direction wiring — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx`
  (inherited-direction-aware adjacency and deltas); unit
  `SP-MATH-09`; e2e `SP-KEY-05`, `SP-KEY-08`, `SP-DRAG-02`,
  `SP-DOM-05`.
- **API sketch:** no new props — under inherited `dir="rtl"` the
  logical primary Panel becomes the right Panel, physical drag
  deltas and horizontal Arrow keys reverse, `aria-controls`
  follows the logical primary, and a mid-focus direction switch
  applies immediately; values stay paired with DOM-order Panels
  (no array reorder, no callbacks on direction change); vertical
  geometry is identical in both directions.
- **Why not landed:** scoped out at triage (`SP-KEY-05` skip
  recorded in the crew log) — the landing's key/drag paths are
  direction-blind (ArrowRight always grows `value[index]`);
  wiring inherited direction through keys, drag, and ARIA is a
  feature with an `[rtl]` proof axis.
- **Revisit when:** the first RTL product consumer appears, or
  the keyboard/drag hardening pass (items 6–7) is staffed —
  direction must be in the room when those paths are rewritten.
- **Open questions:** inherited `dir` vs. explicit prop — TESTS.md
  freezes inherited direction; confirm no `direction` prop
  backdoor is wanted for forced-direction testing.

### 11. Disabled/blocked Handle determinism — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx`
  (feasibility-derived disabled state); e2e `SP-DOM-08`,
  `SP-KEY-06`.
- **API sketch:** no new props — every feasible Handle is a
  `tabIndex=0` separator in DOM order; explicit `disabled` and
  *computed infeasibility* (both adjacent Panels pinned at
  bounds) both surface as `aria-disabled="true"` with no resize
  on any key or drag while focus behavior stays deterministic.
- **Why not landed:** the landing kept shipped disabled plumbing
  (explicit `disabled` short-circuits keys/drag) but never
  derives infeasibility — `aria-disabled` does not yet mean
  "cannot act", and multi-Handle tab order is unpinned.
- **Revisit when:** the keyboard/a11y pass (items 7–8) is staffed
  — feasibility derivation rides the same solver queries as
  honest ARIA bounds.
- **Open questions:** should a feasibility-blocked Handle remain
  focusable (`aria-disabled`, focusable) or leave the tab order
  (TESTS.md implies focusable-but-inert — confirm)?

### 12. Drag denominator is the Panel-axis sum — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, `splitterMath.ts`
  (conversion/tests against Panel-axis sum); unit `SP-MATH-11`
  (516px Root, 16px Handle → `min="100px"` resolves to 20, not
  ~19.4); crew log records the deliberate non-port.
- **API sketch:** no new props — measured-constraint conversion
  and pointer-delta mapping divide by available group size (sum
  of Panel sizes on the layout axis, Handles excluded) on both
  axes, so percentages describe Panel space and flex recipes
  agree with the solver.
- **Why not landed:** changes shipped drag feel — the component
  keeps the full-rect denominator, and adopting the Panel-axis
  sum alters every drag mapping by the Handle-thickness ratio;
  frozen-feel law forbids it without a deliberate pass.
- **Revisit when:** item 3 lands — `%`-string constraints need
  this denominator by definition, so the drag-feel change ships
  with measured constraints as one reviewed delta.
- **Open questions:** confirm HQ accepts the small drag-feel
  change on thick/custom Handles as part of item 3, rather than
  demanding feel-identical mapping.

### 13. Environment and composition proof suites — verdict: DEFERRED

- **Source:** quarantine commit `c7bdd1f7c`, matrix suites; e2e
  `SP-ENV-02` (`[react:all]` StrictMode 17/18/19),
  `SP-ENV-03` (ShadowRoot), `SP-ENV-04` (`[browser:all]` smoke),
  `SP-ENV-01` (`[ssr]`, landed adapted as the contract SSR case),
  `SP-COMP-01`..`SP-COMP-04` (sidebar, editor/console, nested
  workspace, inner grid).
- **API sketch:** no new API — proof obligations: one
  registration/session/request per physical action under
  StrictMode replay on React 17/18/19; focus and document-lock
  cleanup correct inside an open ShadowRoot; identical
  constrained drag + Arrow/Shift + Enter collapse across
  Chromium/Firefox/WebKit; the four product compositions
  (incl. inner-grid reflow with Splitter never writing
  `grid-template-*`).
- **Why not landed:** matrix-only — they verify items 3–10
  across runtimes that don't exist in the colocated loop, and
  most of the states they pin (RTL, Enter, measured
  constraints, nested isolation) don't exist yet.
- **Revisit when:** items 3–10 land — then re-target these cases
  against the real API instead of quarantine's rewrite (the 68
  e2e + 15 unit quarantine cases encode the mangled API and
  must not be copied verbatim).
- **Open questions:** does HQ still require React 17 in the
  matrix, or can the `[react:all]` axis shrink to 18/19?

### 14. Strict structural anatomy errors — verdict: OPEN

- **Source:** quarantine commit `c7bdd1f7c`, `Splitter.tsx`
  (descriptive anatomy/count errors thrown before any ARIA,
  capture, or listeners); e2e `SP-DOM-02` (leading/trailing/
  consecutive Handles, consecutive Panels, one-Panel tree,
  value-length mismatch).
- **API sketch:** no new props — each malformed tree (bad
  Handle/Panel alternation, one-Panel tree, `value` length ≠
  Panel count) reports a descriptive error naming the defect
  before any separator ARIA, pointer capture, or document
  listener is installed.
- **Why not landed:** needs a product call — quarantine throws,
  while the landing kept the shipped lenient render plus a dev
  `validateLayout` warning; throwing turns today's silently
  odd trees into crashes.
- **Revisit when:** HQ answers the question below; the mechanism
  (validation already exists in `splitter-math.ts`) makes this
  a one-line severity change plus `SP-DOM-02` proof.
- **Open questions:** throw (fail fast, quarantine's choice),
  dev-only error with lenient render (current landing), or
  render-nothing-with-diagnostic? What does a one-Panel tree do
  — error, or render a single pane without Handles?

### 15. Default min floor 0 vs shipped 5% — verdict: OPEN

- **Source:** quarantine commit `c7bdd1f7c` (freeze default min
  floor 0); crew log records the deliberate non-port ("default
  min floor stays 5% (shipped clamp preserved; quarantine
  default 0 NOT adopted)").
- **API sketch:** no new props — the implicit minimum Panel size
  applied when no `min`/`minSize` is given: quarantine's 0 (a
  Panel may shrink to nothing) vs today's 5% shipped clamp.
- **Why not landed:** changes shipped feel with no case forcing
  it — adopting 0 lets unconstrained Panels vanish under drag,
  which the landing judged a product call, not a bugfix.
- **Revisit when:** HQ answers the question below; trivial to
  land either way once decided (single default + solver
  re-proof).
- **Open questions:** may an unconstrained Panel collapse to
  zero by drag (freeze 0), or does every Panel keep a 5% implicit
  floor? If 0, is disappearing-by-drag distinguishable from
  `collapsible` collapse for screen-reader users?

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

### 1. 9px Handle below the 24px target minimum — verdict: OPEN

- **Evidence:** nested ux-designer review, filed in the crew log
  (`.agents/missions/quarantine-landing/splitter.md:24`) as a
  pre-existing non-blocker, separated from the SIGN verdict —
  the visible Handle is 9px against a 24px target minimum,
  mitigated only by keyboard operability.
- **API sketch:** no new props (most likely) — either a wider
  invisible hit area around the visible Handle bar (visual
  stays 9px, pointer target meets 24px) or a `hitSize`/
  StyleProps-documented target convention; keyboard path
  unchanged.
- **Why not landed:** finding postdates the landing, and the fix
  changes paint or pointer geometry — frozen-visuals law keeps
  it out of a stability landing.
- **Revisit when:** HQ answers the product question below; then
  it lands as pure CSS/geometry with a pointer-target proof
  case (no new TESTS.md ID exists — one must be written).
- **Open questions:** is a visually-9px Handle with a 24px
  invisible target acceptable ( neighbouring content loses
  click strip), or must the visible bar itself grow? What is
  the touch-target story on coarse pointers?

### 2. No `prefers-reduced-motion` on Handle transitions — verdict: DEFERRED

- **Evidence:** nested ux-designer review, filed in the crew log
  (`.agents/missions/quarantine-landing/splitter.md:24`) —
  Handle carries a 150ms `background-color` transition (shipped
  and quarantine alike) with no reduced-motion guard.
- **API sketch:** no new API — a `prefers-reduced-motion`
  media query disabling the Handle transition (and any future
  collapse affordance motion); no prop, no behavior change
  otherwise.
- **Why not landed:** finding postdates the landing; one-line
  CSS with no test story yet.
- **Revisit when:** the next a11y/CSS pass touches Splitter —
  pairs with suspected gap 1 (same Handle, same review).
- **Open questions:** none on direction; confirm the lib-wide
  reduced-motion convention (media query in theme vs.
  per-component) before writing it per-component.

### 3. Root-level `disabled` has no freeze case — verdict: OPEN

- **Evidence:** `Splitter.tsx:61` accepts root `disabled?: boolean`
  and threads it through context (`:244`, `:550`, `:677`) — but
  Splitter.md's Proposed API has no root `disabled`, no `SP-*`
  case in TESTS.md or quarantine covers whole-group disable
  (quarantine's disable story is per-Handle via item 11), and
  quarantine deleted the root prop outright.
- **API sketch:** either freeze it (disabled root: `data-disabled`,
  inert Handles, no callbacks — needs new `SP-*` cases) or
  remove the prop and let products disable per-Handle (or via
  `aria-disabled` on the host).
- **Why not landed:** quarantine never addressed it as a keeper,
  so the landing had no win to port and no mangling to reject;
  the prop passed through untouched.
- **Revisit when:** item 11 (per-Handle disable) lands — that
  forces the decision, since two disable mechanisms must not
  disagree about what "disabled group" announces.
- **Open questions:** do products need whole-group disable
  distinct from "every Handle disabled"? If yes, what does the
  group announce, and does root `disabled` imply all Handles
  report `aria-disabled`?

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

### 5. SP-A11Y-01 checker sweep never executed — verdict: DEFERRED

- **Evidence:** TESTS.md specifies the automated-checker sweep
  across horizontal, vertical, three-Panel, mixed-constraint,
  and collapsed fixtures — but it has no quarantine case ID
  (absent from the 68-case e2e file) and no colocated/CT proof;
  SPEC.md case index lists it unported.
- **API sketch:** no new API — run the configured accessibility
  checker after settling each named state; assert zero
  violations plus named Handles, perpendicular orientation,
  valid value ranges, primary `aria-controls`, and disabled
  state on every Handle, not just the first.
- **Why not landed:** nothing to port — the case was specified
  but never proven anywhere, and most of its states (items 8,
  10, 11) don't exist yet.
- **Revisit when:** items 8, 10, and 11 land — then execute the
  sweep as their joint acceptance gate.
- **Open questions:** which checker is "the configured" one for
  lib components — confirm the tool before the first run.

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

- Deepest behavior gap: the pointer-session frame budget (item 5 +
  item 4). In Book's `/splitter` Constrained story, drag a Handle and
  know every `pointermove` commits React today — the freeze wants
  origin-solve plus CSS-var ref writes with zero commits, zero layout
  reads, and frozen ARIA until release. This is also the item that
  forces the CSS-variable contract and the drag-denominator call, so
  it is the highest-leverage scheduling decision.
- Largest API-shape call: required `value` + `min`/`max` (items 1–2,
  OPEN-adjacent). In Book, the stories still use `defaultValue` and
  `minSize`/`maxSize`/`index` — the freeze renames all of it and
  deletes uncontrolled mode. Decide the v2 release vehicle (major +
  codemod vs. permanent convenience tier) before any other API work,
  because items 3, 9, and 13 all assume the renamed contract.
- Most immediate product questions: anatomy severity (item 14) and
  the min floor (item 15). Try rendering a one-Panel Splitter and an
  unconstrained drag-to-zero in Book — today the first renders oddly
  with a dev warning and the second stops at 5%. Both are one-line
  changes once HQ picks throw-vs-warn and 0-vs-5%.
- Keyboard/collapse cluster (items 7–9 + suspected gap 1): focus a
  Handle in the CollapsibleDemo story and press Enter — nothing
  happens; hold an Arrow — each repeat emits its own end event. Pair
  this pass with the 9px-target answer, since both touch the Handle.
