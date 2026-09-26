# Listbox decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: controlled option engine — single/multi selection, roving focus, typeahead, virtual adapter.

## Landed (context, 2-4 lines)

Quarantine-landing ported commit `dcefd8d85`'s behavior engine verbatim
(463 → 1256 lines, 2 flagged adaptations) plus a 29/73 in-dir suite (7
unit + 25 CT × React 17/18/19), leaving 8 frozen snapshots unmoved:
zero visual delta. Combobox-context and matrix-only cases handed off.
Log: `.agents/missions/quarantine-landing/listbox.md`; landing commit
`8f6a78892` (`feat(listbox): land quarantine stability + 29-case suite,
freeze visuals`, verified via `git log`).

## Candidate features (quarantine-sourced)

### 1. Type `onChange` (finish work-order #1) — verdict: OPEN

- **Source:** quarantine commit `dcefd8d85`,
  `packages/reference-lib/src/components/Listbox/Listbox.tsx`
  (`ListboxProps<T = any>` keeps `onChange?: (value: any)`); Q unit
  "compiles with controlled types and no defaultValue" pins only the
  absence of `defaultValue`, not value typing. No case ID types the
  callback.
- **API sketch:** thread the existing (currently unused) generic:
  `ListboxProps<TValue extends string = string>` with
  `value?: TValue | TValue[] | null` and
  `onChange?: (value: TValue | TValue[] | null) => void`, shared by
  `Option`, `VirtualFocusItem`, and `computeNextMultipleSelection`.
- **Why not landed:** quarantine kept `any`; landing stayed
  Q-faithful. SPEC.md work-order #1 is half-open (kill `defaultValue`
  done, typing open) and Gaps still lists the untyped callback.
- **Revisit when:** HQ approves generic value threading through
  Option/Listbox/virtual adapter plus the Combobox consumer, with
  `tsc` over the full tree as the oracle.
- **Open questions:** single vs multiple overloads, or one union
  signature? Do unknown multi values (`LB-MULTI-03` append
  semantics) widen the type or stay `string`? Must virtual items
  share the generic, or does the adapter stay loosely typed?

### 2. Wire `validateVirtualAdapter` into registration — verdict: DEFERRED

- **Source:** quarantine commit `dcefd8d85`, `Listbox.tsx`
  `validateVirtualAdapter` (current line 65): exported, never called
  internally (defined once, zero call sites). Case IDs: `LB-VIRT-01`
  (standalone unit, landed) and `LB-VIRT-09` (atomic replace +
  diagnostics, unproven in-dir).
- **API sketch:** no new props. Registration calls the validator on
  `virtual.items` change and on indexed Option mount; an invalid
  mapping emits the existing descriptive diagnostic.
- **Why not landed:** quarantine shipped it unwired; wiring it into
  the hot path exceeds the quarantine brief (crew log: "Gaps noted,
  NOT invented").
- **Revisit when:** `LB-VIRT-09` matrix re-targeting, which must
  decide the throw-vs-warn policy first.
- **Open questions:** dev-only throw or always-on? Per-render cost
  on large adapters — memoize by `items` identity? Does a failed
  diagnostic block focus or only warn?

### 3. Strengthen duplicate detection to same-pass re-registration — verdict: OPEN

- **Source:** quarantine commit `dcefd8d85`, `Listbox.tsx` option
  registry; case ID `LB-DOM-06`. Crew-log Surprises: the diagnostic
  fires only when same-value options carry distinct ids; derived-id
  collisions slip through. Colocated `Listbox.test.ts` pins the
  implemented semantics.
- **API sketch:** no API change. Any same-pass re-registration of
  an already-registered value throws the descriptive identity error
  naming the value, even when derived ids collide (the render map
  clears per Listbox render, so a same-pass duplicate is always a
  real duplicate).
- **Why not landed:** quarantine's diagnostic has the distinct-id
  caveat; landing kept faithful rather than redesigning validation.
- **Revisit when:** next freeze pass — safe per the crew-log
  analysis, needs only the error-shape decision below.
- **Open questions:** error message shape — name the value plus the
  colliding option ids? Dev-only or production throw?

### 4. RovingFocus re-convergence (own kernel → composition) — verdict: DEFERRED

- **Source:** quarantine commit `dcefd8d85` removed the
  `<RovingFocus.Root orientation loop typeahead>` /
  `RovingFocus.Item` wrappers; live-DOM orientation/RTL navigation
  plus `Intl.Collator` typeahead now live in `Listbox.tsx`. Dead
  `RovingFocus`/`TypeaheadModel` imports dropped at port; a local
  `getComputedDirection` stands in for RovingFocus-private
  `getDirection`. TESTS.md "Owned elsewhere" still routes generic
  movement/typeahead to RovingFocus; SPEC.md Gaps flags
  convergence as future work. No single case ID — spans
  `LB-KEY-*`, `LB-DOM-08/09`.
- **API sketch:** no public API change. Internal: re-compose
  RovingFocus Root/Item, or RovingFocus exposes its
  movement/typeahead kernel (`getDirection` export,
  `TypeaheadModel` reuse, `RF-GRID-*` 2D movement) for Listbox to
  consume.
- **Why not landed:** quarantine's engine is proven (29 in-dir
  cases green); recomposing mid-landing risks behavior drift under
  frozen visuals, and RovingFocus owns the other side of the seam.
- **Revisit when:** RovingFocus exports direction/typeahead seams;
  convergence is proven when the 29-case suite stays green with
  zero public API change.
- **Open questions:** does RovingFocus want Listbox as a consumer
  (grid-movement `RF-GRID-*` handoff)? Who owns collator typeahead
  long-term? Live-DOM queries vs registry — any perf cliff at
  scale?

### 5. Restore uncontrolled `defaultValue` — verdict: DECLINED

- **Source:** quarantine commit `dcefd8d85` deleted
  `defaultValue?: ListboxValue` plus the internal store (base
  `7aea45265` lines 15, 233, 246); Q unit "compiles with controlled
  types and no defaultValue" pins the removal. Recon §4.1 lists
  uncontrolled-mode deletion as mangling-class — but for Listbox
  it is SPEC-mandated (crew log).
- **API sketch (rejected):** `defaultValue?: ListboxValue` plus an
  internal `useState` shadow store; omitted `value` +
  `defaultValue` becomes uncontrolled mode.
- **Why not landed:** SPEC.md work-order #1 and Next-agent ("No
  `defaultValue`") plus TESTS.md Freeze defaults forbid it; zero
  in-repo consumers (stories/book/Field all controlled or bare);
  `LB-DOM-10` pins omission as controlled `null`.
- **Revisit when:** never, short of a SPEC rewrite — controlled-only
  is the freeze, and compat was verified read-only before landing.
- **Open questions:** none — hard DECLINED. Killer reason: TESTS.md
  Freeze defaults makes omission deterministic controlled state; an
  uncontrolled store would resurrect the shadow-state class that
  `LB-SINGLE-06` / `LB-MULTI-06` exist to kill.

### 6. `Section` / `Header` / `Empty` chrome fate — verdict: DEFERRED

- **Source:** base `7aea45265` → quarantine `dcefd8d85` kept all
  three byte-identical (crew log); `Listbox.Section` / `.Header` /
  `.Empty` at current lines 1143/1188/1217. No case ID — zero
  TESTS.md cases reference them. Zero consumers: no references
  outside the Listbox dir, absent from story and book.
- **API sketch:** either (a) remove the three exports (breaking)
  and route all grouping through native `div[role=group]`, or (b)
  document them as legacy chrome with a removal version.
- **Why not landed (no action taken):** visuals frozen plus
  base-compatible; removal is a breaking API decision HQ must take
  explicitly, not landing-crew hygiene. SPEC.md Gaps records them
  as "extra chrome parts beyond freeze".
- **Revisit when:** HQ schedules a breaking catalog pass; removal
  oracle is zero tree references (already true) plus
  major-version release notes.
- **Open questions:** does any downstream consumer outside this
  repo use them — can we observe that? Deprecation warning first,
  or hard removal?

### 7. `isInsideCombobox` dead context field: consume or delete — verdict: OPEN

- **Source:** quarantine commit `dcefd8d85`, `Listbox.tsx` context
  value (current line 160, written line 1046, read nowhere). No
  case ID. Crew log: "provided but unconsumed".
- **API sketch:** internal only. Either (a) consume it: Option
  branches combobox-vs-standalone behavior off Listbox context
  instead of importing ComboboxContext directly (one context hop),
  or (b) delete the field.
- **Why not landed:** quarantine provided it unconsumed; landing
  kept faithful, and wiring exceeds the brief.
- **Revisit when:** the next Listbox touch that edits context
  (e.g. candidate §4 convergence) — resolve then, don't let it
  linger past one more freeze.
- **Open questions:** is the direct ComboboxContext import the
  layering wart, or the duplicate boolean? Which direction does the
  Combobox crew prefer?

## Suspected gaps (no quarantine source)

### 1. Public `Listbox.Group` wrapper — verdict: DECLINED

- **Evidence:** TESTS.md Out-of-scope ("A public Listbox
  Group/Section wrapper"); SPEC.md Next-agent ("No public Group");
  `LB-GROUP-01..06` prove native `div[role=group]` suffices;
  [Listbox.md](./Listbox.md):63 — "would add no invariant beyond
  that native markup". Quarantine never proposed one.
- **API sketch (rejected):** `Listbox.Group` registering label plus
  nesting, owning group-level ARIA instead of authored markup.
- **Why not landed:** deliberate cut, not oversight: native markup
  plus DOM-order flattening covers naming, nesting, navigation,
  and typeahead (`LB-GROUP-01..06`).
- **Revisit when:** a grouping invariant emerges that authored
  markup cannot express — name the invariant, not the wrapper.
- **Open questions:** none — hard DECLINED. Killer reason: a
  wrapper would re-own what ARIA already gives native group roles
  for free.

### 2. Extended selection (shift-range / select-all) — verdict: DECLINED

- **Evidence:** `LB-MULTI-05` asserts Shift/Control/Meta modifiers
  produce no range, select-all, or extension request; SPEC.md
  Won't do ("Shift-select / select-all"); Vendor Leave
  ("shift-range / select-all"); TESTS.md Out-of-scope.
- **API sketch (rejected):** Shift+arrows extend from an anchor;
  Mod+A selects all; selection model gains anchor/focus state.
- **Why not landed:** the freeze keeps toggle-only multiple
  selection; vendor-only extended selection is deliberately not
  inherited.
- **Revisit when:** a committed consumer states range demand that
  cannot be composed above the toggle API (state the consumer, not
  the abstraction).
- **Open questions:** none — hard DECLINED. Killer reason:
  `LB-MULTI-05` freezes the absence, and ranges need anchor state
  that doubles the selection machine for zero demand.

### 3. Public Virtualizer — verdict: DECLINED

- **Evidence:** SPEC.md Won't do ("Shipping a Virtualizer");
  TESTS.md Out-of-scope ("a public Virtualizer"); [Listbox.md](./Listbox.md)
  virtualization section ("still does not render or measure the
  window"); Vendor Leave. Quarantine built the adapter, never a
  Virtualizer.
- **API sketch (rejected):** `<Listbox.Virtualizer overscan
  itemSize>` measuring rows and owning the rendered window.
- **Why not landed:** the adapter
  (`virtual={{ items, scrollToIndex }}`) is the contract — Listbox
  owns ARIA plus coordination, the application owns measurement
  (`LB-VIRT-*`, `LB-COMP-03`).
- **Revisit when:** never as Listbox API; genuine demand ships as a
  separate component, not a Listbox prop.
- **Open questions:** none — hard DECLINED. Killer reason: measuring
  plus windowing is an application/virtualizer job; Listbox owns
  set metadata and scroll coordination only.

### 4. Omitted interaction models (long-press, drag/drop, load-more, links/actions) — verdict: DECLINED

- **Evidence:** TESTS.md Out-of-scope lines 594-599 (range,
  select-all, drag/drop, load-more, links, actions; React Spectrum
  long-press touch and drag/drop suites left behind);
  `LB-POINTER-02` freezes touch as tap-only.
- **API sketch (rejected):** long-press selection timers;
  draggable options; load-more sentinel rows; action slots inside
  options.
- **Why not landed:** each is a separate interaction model with its
  own accessibility contract; the freeze covers tap/click/keyboard
  only.
- **Revisit when:** per model, with the vendor accessibility
  contract stated up front (e.g. APG grid vs listbox for drag).
- **Open questions:** none — hard DECLINED. Killer reason: each
  model is a component-sized accessibility surface, and none has a
  committed consumer.

### 5. Focusable-but-not-selectable disabled options — verdict: DECLINED

- **Evidence:** [Listbox.md](./Listbox.md):96-97 explicitly leaves
  React Aria's alternate policy ("Disabled options are never
  focusable or selectable in this freeze"); `LB-DOM-04` /
  `LB-DOM-11` / `LB-DYNAMIC-04` freeze exclusion plus tab-stop
  removal. Quarantine implemented exclusion only.
- **API sketch (rejected):** focusable-always disabled options, or
  a `disabledBehavior?: 'exclude' | 'focusable'` policy prop.
- **Why not landed:** the freeze chose exclusion; a mixed policy
  doubles navigation, typeahead, and ARIA rules for zero demand.
- **Revisit when:** an accessibility finding shows exclusion hides
  content from AT users in a committed consumer (state the
  consumer and the finding).
- **Open questions:** none — hard DECLINED. Killer reason:
  `LB-DOM-04` pins `tabindex="-1"` plus never-focus; flipping
  needs a case-ID-level SPEC rewrite, not a prop.

### 6. PageUp/PageDown navigation capture — verdict: DECLINED

- **Evidence:** `LB-KEY-06` asserts Escape/Tab/PageUp/PageDown pass
  through untouched, to "prevent accidental growth into an
  extended-selection widget". Quarantine implemented passthrough
  only.
- **API sketch (rejected):** PageUp/Down jump N options or a
  viewport; Escape clears or blurs.
- **Why not landed:** deliberately left to browser/application —
  and Listbox owns no viewport metrics, so any page size would be
  a magic number (ties to suspected §3: paging needs a measurer).
- **Revisit when:** alongside a Virtualizer that owns viewport
  geometry — paging without metrics is arbitrary jumps.
- **Open questions:** none — hard DECLINED. Killer reason: no
  viewport metrics, no honest page size.

## Non-decisions (rejected outright)

- Quarantine's dead `RovingFocus` / `TypeaheadModel` imports plus its non-exported `getDirection` dependency — dropped at port for a 4-line local direction helper, no coupling to the RovingFocus crew — recorded in `.agents/missions/quarantine-landing/listbox.md` (Port adaptations, Surprises).
- Quarantine's 73/73 matrix-proof claim — SPEC.md records the 29/73 in-dir floor instead; re-targeting belongs to matrix crews — recorded in [SPEC.md](./SPEC.md) (Status) and the crew log (Handoffs).
- Stripping `Section` / `Header` / `Empty` chrome during landing — frozen visuals plus base compatibility forbid it; future tracked as candidate §6 — recorded in [SPEC.md](./SPEC.md) (Gaps & incoherence).
- Shared-theme focus-ring suppression shipped via the Field commit — global blast radius, not Listbox scope, rejected for landing — recorded in `docs/MISSIONS/QUARANTINE_RECON.md` (§4.3).

## Walkthrough notes for HQ

- Most important #1: `onChange` is still `(value: any)` (candidate §1, OPEN) — the primary callback has no type safety, and the `ListboxProps<T>` generic already exists unused. Feel it: open the `ControlledMirror` / `RequestLog` stories and hover `onChange`; request arrays flow untyped.
- Most important #2: RovingFocus re-convergence (candidate §4, DEFERRED) — Listbox carries its own movement/typeahead kernel while TESTS.md still assigns generic movement to RovingFocus. Feel it: try `Horizontal`, `HorizontalRTL`, and `Typeahead` — mirrored arrows, wrap typeahead, zero RovingFocus in the tree. The decision is who owns movement long-term, not what the user sees.
- Most important #3: uncontrolled `defaultValue` stays dead (candidate §5, DECLINED) — controlled-only is the freeze, not quarantine mangling. Feel it: open `Defaults` (omitted props mean controlled `null`; requests never stick without a parent update) and `RequestLog` (every request logged, none auto-applied).
- Secondary: `Virtual` (scroll-before-focus coordination, `aria-setsize`/`posinset`) plus `ZeroValues` (`""` / `"0"` identities) show what quarantine bought with no new public API; `Cancel` shows consumer `preventDefault` authority over selection.
