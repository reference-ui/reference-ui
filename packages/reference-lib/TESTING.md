# Testing `@reference-ui/lib`

This is the normative proof architecture for Reference UI's runtime primitives.

The public design and freeze gates live in
[`src/components/components.md`](./src/components/components.md). Shared
internal state uses Zustand plus `src/core/hooks`
([`src/core/hooks/hooks.md`](./src/core/hooks/hooks.md)). Each
`src/components/<Name>/TESTS.md` is the executable contract for one owner.
Implementation lives in this package. Black-box proof lives in `matrix/lib`.
Cosmos is for looking; Playwright is for asserting.

In this document, **freeze** means “the current falsifiable design decision,”
not “treat existing prose as gospel.” Before manufacture, vendor regressions,
APG/web-platform evidence, type contradictions, adversarial compositions, and
better ownership arguments can—and should—change the API, cases, defaults,
parts, or component inventory. A test is not weakened to protect a prior
decision, and a prior decision is not retained merely because it already has a
case ID. Stable IDs preserve review history; they do not make behavior immune
to correction.

The component surface is deliberately small. A vendor test does not justify a
new public component by itself. First assign the behavior to an existing
primitive, an internal kernel, native HTML, or a documented composition.

## Deliverables

| Concern | Location |
| --- | --- |
| Public design and omissions | `src/components/components.md` |
| Zustand + core hooks spec | `src/core/hooks/hooks.md` |
| High-level component contract | `src/components/<Name>/<Name>.md` |
| Exact cases and source provenance | `src/components/<Name>/TESTS.md` |
| Visual exploration | this package's Cosmos fixtures |
| Public-API browser proof | `matrix/lib/tests/e2e/<name>.spec.ts` |
| Pure model proof | `matrix/lib/tests/unit/<name>.test.ts` |
| Consumer fixtures | `matrix/lib/src/<name>.tsx` |

`matrix/lib` imports only from `@reference-ui/lib`. A case that passes only by
importing `packages/reference-lib/src/...` does not prove the public API.

## Contract index

The current design pass contains **1,510 tagged behavior cases** plus **84
composition gates** across 24 top-level components: **1,594 stable case IDs**
in total. Four NumberField cases and two DateField cases are required manual
release gates; the other 1,588 are automated contracts. Components may carry more than three
composition gates when ownership boundaries require distinct proof:

- **Foundation:** [ReferenceLibrary](./src/components/ReferenceLibrary/TESTS.md),
  [Portal](./src/components/Portal/TESTS.md),
  [Overlay](./src/components/Overlay/TESTS.md),
  [Popover](./src/components/Popover/TESTS.md),
  [Toast](./src/components/Toast/TESTS.md)
- **ARIA widgets:** [Listbox](./src/components/Listbox/TESTS.md),
  [Combobox](./src/components/Combobox/TESTS.md),
  [Menu](./src/components/Menu/TESTS.md),
  [Tabs](./src/components/Tabs/TESTS.md),
  [Slider](./src/components/Slider/TESTS.md),
  [Switch](./src/components/Switch/TESTS.md),
  [Tree](./src/components/Tree/TESTS.md),
  [NumberField](./src/components/NumberField/TESTS.md),
  [DateField](./src/components/DateField/TESTS.md),
  [Calendar](./src/components/Calendar/TESTS.md),
  [Collapsible](./src/components/Collapsible/TESTS.md),
  [Accordion](./src/components/Accordion/TESTS.md),
  [Splitter](./src/components/Splitter/TESTS.md),
  [Tooltip](./src/components/Tooltip/TESTS.md)
- **Visual chrome:** [Field](./src/components/Field/TESTS.md)
- **Authoring machinery:** [Slot](./src/components/Slot/TESTS.md),
  [Presence](./src/components/Presence/TESTS.md),
  [RovingFocus](./src/components/RovingFocus/TESTS.md),
  [FocusLock](./src/components/FocusLock/TESTS.md)

The count is intentionally not a promise that every case becomes a separate
test function. Parameterized tests may prove a matrix under one stable case
ID. What matters is that every setup/action/assertion remains visible and
traceable.

## Component design loop

Design one component in this order:

1. **Name one owner.** State the hard invariant this primitive centralizes and
   what remains native HTML, application code, another owner, or composition.
2. **Triangulate evidence.** Read actual tests and implementation seams from at
   least two relevant vendors where available; include vanilla/APG/browser
   behavior rather than copying one React anatomy.
3. **Freeze anatomy.** Specify every native tag, role, relationship, generated
   ID, transparent root, valid child shape, and absence of hidden markup.
4. **Freeze controlled state.** Define values, defaults, request callbacks,
   programmatic updates, rejected requests, invalid runtime input, and dynamic
   collection identity. Document the internal Zustand store, actions,
   selectors, hooks, lifecycle, isolation, and multi-root/MFE behaviour
   ([hooks.md](./src/core/hooks/hooks.md)).
5. **Freeze events.** Specify input modalities, callback order, propagation,
   cancellation through `preventDefault()`, stale-handler behavior, and exactly
   when native browser behavior remains untouched.
6. **Freeze observable styling.** Name every authoritative `data-*`, ARIA, and
   CSS custom property. Internal geometry must not overwrite arbitrary
   application classes, transforms, or styles.
7. **Port regressions as cases.** Rewrite each relevant vendor regression as
   setup → action → observable assertion against Reference UI's public API.
   Merge duplicate tests and explicitly reject vendor-only surface.
8. **Prove compositions and environments.** Run three materially different
   compositions plus relevant browser, React, RTL, SSR, Shadow DOM, multi-root,
   pointer/touch, IME, motion, scroll, and viewport edges.
9. **Run the agent gate.** Give an agent only public docs and adversarial product
   requirements; an API failure is evidence, not something to prompt around.
10. **Freeze only after blockers close.** A test requiring an unexpressed
    behavior becomes an API blocker. It is never silently weakened or used to
    justify a duplicate top-level component.

## Contract vocabulary

Every checklist item in a component `TESTS.md` is required unless it appears
under **Deferred** or **Out of scope**.

Case IDs are stable and become the beginning of the test title:

```ts
test("OV-DISMISS-04: prevented Escape does not request dismissal", async () => {})
```

Provenance tags describe why a case exists:

- **`[vendor]`** — ports one observable upstream test.
- **`[convergence]`** — resolves equivalent or conflicting behavior across
  vendors into one Reference UI contract.
- **`[reference]`** — proves a Reference UI-specific API, ownership rule, or
  freeze gate.

Execution tags keep the matrix intentional:

- **`[unit]`** — DOM-free or deterministic model test.
- **`[browser]`** — Chromium in the daily loop.
- **`[browser:all]`** — Chromium, Firefox, and WebKit before freeze.
- **`[react:all]`** — React 17, 18, and 19 compatibility.
- **`[ssr]`**, **`[rtl]`**, **`[shadow]`**, **`[touch]`** — targeted
  environments, not a request for a full Cartesian product.
- **`[manual]`** — requires verification on a real platform or device and is
  not replaced by automated DOM or browser simulation.
- **`[release]`** — a required release gate whose result must be recorded
  before release.

Each case must say enough to implement without reopening vendor source:
fixture state, user action, and observable result. Every `[vendor]` case must
resolve to a path in that file's Source evidence section; when it ports one
specific named regression rather than a merged behavior matrix, include the
upstream test title inline. Generic headings such as "keyboard works" are not
cases.

### Case writing standard

Every case is a compact behavioral specification, not a test-name stub. Use
this shape:

```md
- [ ] `OV-DISMISS-04` `[vendor]` `[browser]` —
  **Overlay should remain open when the top layer prevents Escape dismissal.**
  Open two nested controlled overlays, prevent the inner dismissal request,
  and press Escape while focus is inside it. Assert that neither controlled
  `open` prop changes, the outer callback is not called, and focus/layer order
  remain intact. This proves cancellation stops at the layer that handled the
  key instead of leaking to an ancestor.
```

The bold sentence names the component, expected behavior, and circumstance in
plain language. The following two or three sentences provide:

1. the minimum fixture and controlled starting state;
2. the user or programmatic action;
3. every public observable to assert, including callback order or absence; and
4. a short reason when the case protects a non-obvious regression, ownership
   boundary, browser behavior, or composition invariant.

Use concrete values where boundaries matter. Name the browser input rather
than saying "interact." Name the focused node rather than saying "focus
works." Name callbacks and their ordered arguments rather than saying "state
updates." A reader should be able to turn the paragraph into a test without
inventing missing behavior or consulting an implementation.

## One behavior, one owner

Cross-component behavior is tested at the lowest public primitive that owns
the invariant. Consumers get one integration case proving that they use the
kernel; they do not copy its matrix.

| Owner | Behavior proved once |
| --- | --- |
| `Slot` | prop, handler, style, class, ARIA-token, and ref merging |
| `Portal` | relocation, late containers, SSR mount gate, no wrapper |
| `Presence` | animation/transition exit detection and interruption |
| `FocusLock` | tabbable catalog, containment, shards, nesting, restore |
| `RovingFocus` | one tab stop, arrows, Home/End, loop, RTL, typeahead, 2D |
| `Overlay` | shared layer stack, Escape/outside ordering, branches, inert, scroll |
| `Popover` | anchored positioning, collision, virtual anchors, hover grace |
| `ReferenceLibrary` | document-level runtime mount and failover |
| `Toast` | identity, queue, timers, limit, announcements |
| Widget primitive | only its selection, activation, hierarchy, or value policy |

Examples:

- Menu-in-dialog Escape ordering belongs to `Overlay`; `Menu` owns submenu
  intent and menu keyboard behavior.
- Combobox owns focus remaining in the input; `Listbox` owns option selection
  and virtualized option metadata.
- Accordion owns single/multiple expansion; `Collapsible` owns disclosure
  linkage; `Presence` owns exit detection.
- Tooltip runs one positioning smoke case; the flip/shift/arrow matrix belongs
  to `Popover`.

When a later primitive makes an owner integration possible, add the case to
the owner's existing spec. Do not create a duplicate "system" spec.

## Universal part conformance

Every documented rendered part runs the same parameterized conformance checks
in addition to its component-specific list:

- [ ] `PART-TYPE-01` `[reference]` `[unit]` —
  **Each public part should expose the exact native, StyleProps, behavior, and
  ref type intersection for its documented host.** Compile accepted native and
  token-aware examples plus `@ts-expect-error` cases for wrong tags, refs,
  invalid controlled unions, `as`, and behavior/style name collisions. Assert
  the declaration surface rejects ambiguity before runtime.
- [ ] `PART-DOM-01` `[reference]` `[browser]` —
  **Each fixed part should render its documented native tag and role without
  adding an undocumented host.** Parameterize every fixed part with visible
  child content and inspect its exact DOM ancestry. Assert the named element
  is the public node and no behavior-only wrapper appears.
- [ ] `PART-DOM-02` `[reference]` `[browser]` —
  **Each transparent or Slot-like part should preserve authored DOM when its
  valid child shape is used.** Render empty-valid transparent roots and
  one-element Slot-like parts, then inspect parent/child relationships. Assert
  configuration components add no node and Slot behavior lands on the one
  authored element.
- [ ] `PART-PROP-01` `[reference]` `[browser]` —
  **Each rendered part should preserve native props when behavior is active.**
  Supply representative native attributes, `data-*`, `aria-*`, `className`,
  inline style, and an unrelated event handler, then exercise the component.
  Assert every value/event remains on the documented native node.
- [ ] `PART-STYLE-01` `[reference]` `[browser]` —
  **Each style-bearing part should accept Reference UI StyleProps under base,
  responsive, and color-mode circumstances.** Supply token-aware props, `css`,
  `colorMode`, a container, and responsive `r`, then cross the query boundary.
  Assert generated classes and computed values update on the same native node
  without masking behavior-owned geometry or state.
- [ ] `PART-REF-01` `[reference]` `[react:all]` —
  **Each rendered or slotted part should expose its actual native element
  through every supported ref form.** Mount with object and callback refs,
  rerender, and unmount under React 17, 18, and 19. Assert attachment identity
  plus exactly the version-appropriate cleanup or null call.
- [ ] `PART-REF-02` `[reference]` `[react:all]` —
  **Each part should compose internal and consumer refs without creating a
  ref-driven render loop.** Use a callback ref that schedules a parent render
  while StrictMode replays attachment. Assert finite renders, stable settled
  registration, and one live native-node identity.
- [ ] `PART-EVENT-01` `[reference]` `[browser]` —
  **Each cancelable behavior should run consumer handlers first and honor
  `preventDefault()` only at its documented boundary.** Exercise the relevant
  native input once normally and once with consumer prevention. Assert exact
  callback order, one internal default in the first run, and no canceled
  default or accidental cancellation of unrelated browser behavior.
- [ ] `PART-STATE-01` `[reference]` `[browser]` —
  **Each behavior-owned state attribute should remain authoritative while
  unrelated consumer styling survives.** Supply conflicting managed ARIA/data
  plus unrelated classes/styles, then change controlled state. Assert managed
  values follow the component and unrelated presentation remains intact.
- [ ] `PART-ID-01` `[reference]` `[ssr]` —
  **Each generated relationship should keep a unique stable ID across render,
  hydration, and explicit-ID changes.** Server-render repeated equal-label
  instances, hydrate, rerender, and replace one explicit ID. Assert no
  mismatch/duplicate, explicit IDs win, and every referencing attribute changes
  atomically.
- [ ] `PART-CONTROL-01` `[reference]` `[browser]` —
  **Each controlled component should render only its props when an application
  rejects a request.** Trigger every request callback without updating the
  controlled prop. Assert one request with exact arguments and no hidden
  visual, ARIA, mounted-state, or selection mutation.
- [ ] `PART-DYNAMIC-01` `[reference]` `[browser]` —
  **Each collection-bearing component should discard stale registration when
  parts are inserted, removed, reordered, renamed, or disabled.** Mutate keyed
  parts around the current item and perform the next interaction. Assert IDs,
  order, focus targets, callbacks, and listeners use only the settled current
  collection.
- [ ] `PART-DEFAULT-01` `[reference]` `[unit]` —
  **Each optional behavioral prop should use its documented omitted value
  without truthiness coercion.** Parameterize omission, `undefined`, `null`
  where accepted, `false`, zero, empty string, and empty collection according
  to the prop type. Assert each valid value remains distinct and every omitted
  path is deterministic.

A component file lists its exact part/tag/role matrix and any deliberate
exception. These cases are generated/shared test code, not omitted assertions.

## Proof levels

### 1. Type and export contract

Compile public examples from the component design doc. Prove required props,
event types, fixed native prop inheritance, ref types, and rejected invalid
combinations. Runtime tests do not replace this.

Fixed-host public parts derive from `ReferencePartProps<"button" | "div" |
...>`, the matching generated primitive's native props + token-aware
StyleProps + ref contract (with conflicts omitted before defining a controlled
callback). Bare `HTMLAttributes<T>` is insufficient because it carries neither
the public ref nor Reference UI styling surface.

### 2. Pure model tests

Use Vitest only where a real browser adds no information:

- Slot merge and ref composition.
- Collection registration, typeahead buffer, and 2D navigation math.
- Floating placement middleware.
- Toast queue and remaining-time arithmetic.
- Slider and Splitter constraint math.
- Calendar ISO-date/grid/range arithmetic.

The public behavior still receives a browser integration case.

### 3. Browser contract tests

Playwright is the default proof for focus, portals, native editing, event
ordering, Pointer Events, CSS lifecycle, scrolling, geometry, and APG keyboard
behavior. Assert DOM state, focus, callback logs, computed style, and bounding
rectangles—not implementation state.

### 4. Owned composition tests

Each primitive has at least three substantially different compositions from
`components.md`. Combined behavior is added to the owning primitive's spec.
An unfinished consumer must not block its dependencies.

### 5. Agent verification

Before API freeze, give an agent only the public docs and ask it to build three
non-copy-paste requirements, including one adversarial composition. Run the
same black-box cases against the result. A primitive is not agent-ready if the
agent must import internals, add a second behavior runtime, override generated
ARIA, or fight hidden state.

Record the prompt, produced fixture, failures, and any API change it forced.
This is a freeze gate, not a subjective demo review.

## Harness shape

```text
matrix/lib/
  matrix.json
  src/
    app.tsx
    overlay.tsx
    popover.tsx
    ...
  tests/
    e2e/
      overlay.spec.ts
      popover.spec.ts
      ...
    unit/
      slot.test.ts
      calendar.test.ts
      ...
```

- The Vite app is a small router: `/overlay`, `/popover`, and so on.
- One page may expose several named fixtures, selected by query string.
- Fixture controls expose callback order and controlled state as visible text
  or DOM attributes so Playwright never imports internals.
- Use role/name selectors for semantics. Use test IDs only for geometry,
  intentionally hidden nodes, or duplicate labels.
- Use native `page.keyboard`, pointer, touch, focus, and scroll operations.
  Do not replace browser behavior with dispatched React events.
- CSS transition/animation fixtures use explicit durations and wait for the
  relevant event/state, never an unexplained sleep.
- Geometry assertions include a tolerance and verify relationships (inside the
  clipping rect, aligned to anchor), not fragile exact pixels.
- Run automated accessibility checks on each freeze composition, but never
  treat them as substitutes for keyboard, focus, and announcement assertions.

`matrix.json` declares:

```json
{
  "name": "lib",
  "bundlers": ["vite7"],
  "react": ["react19", "react18", "react17"]
}
```

## Execution matrix

Avoid a browser × React × direction × environment explosion. Expand one axis
at a time.

| Gate | Runtime |
| --- | --- |
| Agent loop | React 19 + Chromium, one spec |
| Pull request | React 19 + Chromium, all implemented specs |
| Browser freeze | React 19 + Chromium, Firefox, WebKit for `[browser:all]` |
| React compatibility | Chromium + React 17, 18, 19 for `[react:all]` |
| Targeted environment | React 19 + the case's SSR/RTL/Shadow/touch fixture |
| Release | browser freeze + React compatibility + targeted cases |

At minimum, the targeted environment fixtures cover:

- `dir="rtl"` inherited from ordinary DOM, including dynamic direction change.
- Server render plus hydrate with no warnings, duplicate IDs, or first-frame
  access to `window`/`document`.
- Open and closed ShadowRoots where observable, slotted children, and a
  `DocumentFragment` portal destination.
- Two independent React roots in one document; global systems do not duplicate
  or strand state when the active mount unmounts.
- `prefers-reduced-motion`, zero-duration CSS, hidden documents, and interrupted
  exits.
- Mouse, pen, touch, keyboard, and IME/composition where the primitive handles
  those modalities.
- Nested scrolling, zoom, visual viewport, and Mobile Safari for primitives
  that own geometry or scroll lock.

## Vendor-port workflow

Vendored repositories are references, not dependencies.

1. Read the relevant component design and existing `TESTS.md`.
2. Search the actual vendor tests, not only source or docs.
3. Copy the observable bug/behavior into a case; discard vendor anatomy,
   provider contracts, styling, uncontrolled conveniences, and unrelated
   product features.
4. Merge equivalent cases. Assign shared behavior to one owner.
5. When vendors disagree, write the Reference UI expected result first and
   cite every relevant source. Resolve it using web-platform/APG behavior and
   `components.md`, not majority vote.
6. Preserve an upstream path and exact test title. If test code is copied
   substantially rather than re-authored, preserve the upstream license and
   attribution.
7. A vendor regression with no current public expression is an **API freeze
   blocker**, not a silently skipped test and not automatic permission to add
   a component.

The current source map is [`vendor/VENDOR.md`](../../vendor/VENDOR.md). Vendor
clones are intentionally ignored; record their commit SHAs in the implementation
PR so a later upstream rename does not erase provenance.

## Pre-manufacture coverage closure

"Exhaustive" means exhaustive against the frozen Reference UI scope, the
recorded vendor revisions, relevant APG/web-platform requirements, and the
environment matrix below. It does not mean copying every vendor API or claiming
that future browser regressions cannot exist.

No component implementation starts until its design review records every
surveyed vendor test in one of four buckets:

1. **Ported** — represented by a stable Reference UI case ID.
2. **Merged** — observably equivalent to one or more named case IDs.
3. **Owned elsewhere** — linked to the lower primitive that proves the
   invariant, plus one consumer integration case where necessary.
4. **Deliberately left** — vendor styling, uncontrolled convenience,
   framework anatomy, provider API, or product behavior outside this freeze,
   with the reason stated.

Reviewers then challenge every component across the same dimensions:

- exact anatomy, native props/refs, generated IDs, accessible names, and empty
  or malformed composition;
- controlled defaults, accepted boundaries, invalid runtime values, rejected
  requests, programmatic updates, and dynamic insertion/removal/reorder;
- keyboard, pointer, touch, pen, hover, IME, native form behavior, and
  assistive-technology observables;
- callback arguments/order, propagation, cancellation, duplicate-authority
  prevention, and stale-handler cleanup;
- focus entry/movement/containment/return, hidden or exiting content, nested
  layers, branches, and portalled order;
- styling hooks, computed geometry, collision/resize/scroll behavior, reduced
  motion, and interrupted lifecycle;
- SSR/hydration, RTL, Shadow DOM, iframe/multi-document, multiple React roots,
  React 17/18/19, and Chromium/Firefox/WebKit where relevant;
- all three required compositions, including one adversarial combination that
  stresses ownership boundaries rather than a happy-path demo.

The review closes only when each dimension is either represented by
descriptive case IDs or explicitly inapplicable with an ownership reason.
Unexpressible behavior blocks the API; an implementation plan is not allowed
to reinterpret, omit, or weaken it.

## Test-derived API decision ledger

The vendor pass left the inventory at 24 components after Field joined as
visual chrome: wrapping inputs in a box is unavoidable, and generated
Input recipes must surrender standalone chrome inside that box without
Field copying `aria-invalid`. DateField remains in on the same grounds as
NumberField. Switch remains in on anatomy grounds. The resulting
decisions are:

1. **Universal parts/defaults:** every rendered part has fixed native
   prop/ref typing and every optional behavioral prop has a deterministic
   omitted-value case.
2. **Popover:** Trigger, hover grace, impatient click, tab-order bridge, and
   `closeOnScroll` stay Popover. Geometry is Overlay's Floating UI port;
   Content/Arrow wrap Overlay parts and publish `--reference-overlay-*`.
   Unprevented Trigger activation requests controlled open/dismiss.
3. **Listbox/Combobox/Tree:** `VirtualFocusAdapter` owns complete logical
   metadata and scroll-to-index. Built-in Listbox/Tree register automatically;
   custom grids add `ComboboxGridAdapter.getNextIndex()` and transparent
   `Combobox.VirtualItem` nodes. Active descendant is never published before
   its real node mounts.
4. **Menu:** submenu open state is controlled false when omitted, selection is
   cancelable before one root dismissal request, command/link and controlled
   checkbox/radio items share navigation without losing native anchor behavior,
   nested Menu uses `Menu.Trigger` + `Menu.Content` (wrapped Overlay.Content)
   instead of `Sub*`, and each menu tree has one shared layer hierarchy.
5. **Tree:** child rows live in explicit `Tree.Group`; native-button
   `Tree.Expander` changes expansion without stealing the roving tab stop or
   selecting the row.
6. **Combobox:** custom-value and blur/Tab/Escape policies, Input-XOR-Trigger
   anatomy, sole commit authority, and `Combobox.Popover` as wrapped
   `Overlay.Content` are fixed.
7. **Slider/Splitter:** non-conflicting geometry custom properties are public.
   Both distinguish per-step requests from one successful interaction-end
   callback. Slider preserves thumb identity and supports explicit minimum-step
   distance. Splitter fixes percentage/CSS constraint units, normalization,
   primary pane, keyboard increments, stable panel identity, and
   collapse/restore.
8. **Calendar:** visible month and locale are explicit, today has deterministic
   SSR behavior, locale week start is overridable, weekday label width is
   explicit, unavailable ranges are contiguous-only, outside dates request
   month changes, custom `Calendar.Day` content retains managed semantics, and
   malformed ISO input fails safely.
9. **ReferenceLibrary/Tooltip:** skip-delay is document-scoped configuration
   with frozen timing; global Toast/announce operations route through an
   explicit target Document when more than one host is eligible. A disabled
   Trigger requests closure and Tooltip has no animated exit contract.
10. **Toast:** host/position/item DOM, styling hooks, Presence exit, defaults,
    focus/hover timers, unmounted FIFO overflow, queue retention, and
    request-safe server behavior are public contracts.
11. **Presence:** finite transitions and animations are both observed;
    zero-duration/hidden-document exits settle safely, and nested Presence
    instances coordinate descendant completion without a public Provider
    (Zustand / `src/core/hooks` registration, [hooks.md](./src/core/hooks/hooks.md)).
12. **Focus return:** FocusLock and Overlay resolve an optional explicit
    return target at deactivation/exit completion, with captured-origin
    proximity fallback and a no-restore option.
13. **Switch:** a compact `button[role=switch]` that is complete at low
    specificity. StyleProps on Switch style the track and a default thumb is
    rendered; `Switch.Thumb` replaces it when the thumb needs its own
    surface. Controlled boolean requests and shared `data-state` are in;
    hidden form inputs, mixed state, geometry custom properties, and an
    input host are out. Checkbox and radio remain native.
14. **NumberField:** one conventional controlled root owns a localized dirty
    text session, invertible Intl formats, one step lattice, styleable named
    steppers, managed numeric invalid state, and canonical form serialization.
    `NumberField.Group` consumes Field's bezel recipe on the same
    `div[role="group"]`. It deliberately leaves wheel stepping, multiple
    step scales, parser overrides, and automatic label translation out.
15. **DateField:** one textbox owns a localized dirty date session, locale
    `formatToParts` grammar, caret-aware day/month/year stepping, and
    canonical ISO serialization. Calendar and Popover compose through the
    shared ISO value. Segment spinbuttons, two-digit year windows, `Date`
    objects, clamping, and a packaged DatePicker are out.
16. **Field:** a wrapping `div` owns bezel chrome. Nested `input` /
    `textarea` / `select` surrender standalone recipes through CSS.
    Invalid, disabled, read-only, and focus follow `:has()` against the
    enclosed control. `status="warning"` is the only Field-owned visual
    state. No role, no validity ARIA, no Form/Field provider.
    `NumberField.Group` consumes that one recipe while keeping
    `role="group"`. A Combobox token picker is Field + scalar Combobox +
    application Buttons, not a fourth primitive.

This ledger records the current result, not a presumption of correctness. No
inventory-level blocker is known at this point, but any descriptive case that
remains impossible through the public API reopens the relevant component—or
the inventory itself—before implementation. It is never weakened or deleted
to preserve the ledger, nor automatically solved by adding a duplicate runtime.

## Agent loop

Work one primitive at a time:

```bash
cd matrix/lib
pnpm exec playwright test tests/e2e/overlay.spec.ts
```

Run one contract by stable ID:

```bash
cd matrix/lib
pnpm exec playwright test tests/e2e/overlay.spec.ts -g "OV-DISMISS-04"
```

Run all implemented primitives:

```bash
cd matrix/lib
pnpm exec playwright test
```

The one-spec command must stay fast: host Playwright, workspace React, existing
`node_modules`, no Dagger, registry, or Webpack. If generated primitives are
stale, run this package's `pnpm run sync`, then rerun the spec.

## Compatibility pipeline

```bash
pnpm pipeline test --packages=@matrix/lib
pnpm pipeline test --packages=@matrix/lib --react=react19
pnpm pipeline test --packages=@matrix/lib --react=react17
pnpm pipeline test --packages=@matrix/lib --full
```

`--packages=@matrix/lib` selects only this matrix package. `--react` pins one
declared runtime. `--full` expands the package's declared React × bundler
matrix. React 17/18 compatibility remains in the Dagger consumer because two
React versions cannot share the host `node_modules`.

Do not use the full repository pipeline as the daily component loop.

## Freeze gate

A primitive freezes only when:

1. Every required checklist case in its `TESTS.md` exists and passes.
2. No API blocker or vendor disagreement remains undecided.
3. Exact DOM, native props, controlled state, event order/cancellation, IDs,
   refs, and state attributes pass universal conformance.
4. Pure algorithms have boundary/property cases and one public browser proof.
5. Its three compositions pass, including the special gates in
   `components.md` (virtualized Listbox/Combobox, non-Sunday and range Calendar,
   nested visible-only Tree, labelled/wrapping/in-overlay Switch,
   labelled prefix Field, DateField Input inside Field,
   NumberField.Group consuming the Field recipe, Combobox token picker
   inside Field).
6. Relevant Chromium/Firefox/WebKit, RTL, SSR/hydration, Shadow DOM/multi-root,
   touch/IME, reduced-motion, and React 17/18/19 tags pass.
7. The owning combined cases pass without duplicated suites in consumers.
8. The agent-verification fixtures succeed without escape hatches.

## Implementation order

1. Zustand dependency plus `src/core/hooks` adapters
   ([hooks.md](./src/core/hooks/hooks.md))
2. `Slot`, `Portal`, `Presence`
3. `Field` (generated Input/Textarea/Select recipes recognize the ancestor)
4. `RovingFocus`, `FocusLock`
5. `Overlay`
6. `Popover`
7. `ReferenceLibrary`, `Toast`, `Tooltip`
8. `Listbox`, `Menu`, `Tree`
9. `Combobox`, `Tabs`
10. `Slider`, `Switch`, `NumberField`, `Collapsible`, `Accordion`, `Splitter`
11. `Calendar`, `DateField`

This order follows behavior dependencies, not visual complexity.

## Do not

- Do not test components through compiler fixtures or source imports.
- Do not put proof in Cosmos.
- Do not copy the same layer, focus, roving, Presence, or positioning matrix
  into every consumer.
- Do not use snapshots for interaction contracts.
- Do not add a public Provider, `as` prop, semantic variant, or vendor part only
  to make a ported test compile. Zustand stores stay internal; Context is not
  a public API.
- Do not mark a browser-dependent case complete from jsdom.
