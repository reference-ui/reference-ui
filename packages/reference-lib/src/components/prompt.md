# Reference UI Component Manufacturing Orchestration Prompt

Master orchestration standard and operational framework for manufacturing all 24 components across `@reference-ui/lib`.

---

## 1. System Mission & Manufacturing Mandate

You are manufacturing a designated component for `@reference-ui/lib`. Your mandate is to engineer a production-ready, fully-typed, high-performance, accessible React 19 primitive that satisfies 100% of its design specification (`<Component>.md`) and passes all tagged behavior cases and composition gates in its executable test contract (`TESTS.md`).

Reference UI rejects monolithic widgets, polymorphic `as` props, wrapper `<div>` soup, and public context-provider contracts. Every component manufactured must follow a primitive-first, compiler-backed, headless-state architecture that mirrors the web platform directly.

---

## 2. Agent Assignment Template

When dispatching or continuing a component manufacturing task, use this standard assignment block:

```markdown
Continue manufacturing `<COMPONENT_NAME>` for `@reference-ui/lib`.

Assigned Component: `packages/reference-lib/src/components/<COMPONENT_NAME>/`
Design Specification: `packages/reference-lib/src/components/<COMPONENT_NAME>/<COMPONENT_NAME>.md`
Test Contract: `packages/reference-lib/src/components/<COMPONENT_NAME>/TESTS.md`
Global Architecture: `packages/reference-lib/src/components/components.md`
Core Hooks & Zustand Substrate: `packages/reference-lib/src/core/hooks/hooks.md`
Testing Architecture & Proof Harness: `packages/reference-lib/TESTING.md`
Matrix Test Suite: `matrix/lib/`
```

---

## 3. The 24-Component System Map & Dependency Graph

Components are organized into five strict manufacturing tiers (Tier 0 to Tier 4). Agents can manufacture components in parallel within a tier, but all upstream dependencies from preceding tiers must be satisfied before downstream components consume them:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 0: Authoring & Runtime Foundations                                                │
│ ReferenceLibrary • Slot • Presence • Portal • FocusLock • RovingFocus                  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ TIER 1: Overlays, Popups & Visual Substrate                                            │
│ Overlay • Popover • Tooltip • Toast • Field                                            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ TIER 2: Atomic Controls & Disclosures                                                  │
│ Switch • Collapsible • Accordion • Tabs • Slider • Splitter                            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ TIER 3: Composite Selection & Navigation Widgets                                       │
│ Listbox • Combobox • Menu • Tree                                                       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│ TIER 4: High-Precision Editors & Grid Engines                                          │
│ NumberField • DateField • Calendar                                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Component Directory & Architecture Matrix

| Component | Tier | Primary Architectural Role | Upstream Dependencies | Default Fixed Host | State Substrate |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`ReferenceLibrary`** | 0 | Document-scoped runtime mount & failover | Platform DOM | None / Document host | Document Zustand store |
| **`Slot`** | 0 | Prop, style, ref & ARIA token merge onto 1 child | Core utils | Authored child element | Pure model / memoized merge |
| **`Presence`** | 0 | CSS animation/transition exit detection & gating | Core utils | Authored child element | DOM animation event store |
| **`Portal`** | 0 | DOM subtree relocation with late-container ref | Core utils | None (teleported DOM) | React portal / SSR gate |
| **`FocusLock`** | 0 | Focus containment, boundary traps & return focus | Core utils | Container element / Shard refs | Tabbable tree solver |
| **`RovingFocus`** | 0 | 1D/2D roving `tabIndex`, arrow navigation, typeahead | Core utils | `div` / `ul` / Group container | Instance Zustand store |
| **`Overlay`** | 1 | Floating positioning, layer stack, modality & dismiss | `Portal`, `Presence`, `FocusLock` | `div[data-reference-overlay]` | Document layer registry |
| **`Popover`** | 1 | Anchored popup, hover grace polygon & impatient click | `Overlay`, `Slot` | `div[data-reference-popover]` | Hover intent store |
| **`Tooltip`** | 1 | Non-modal description with document skip-delay | `Popover`, `ReferenceLibrary` | `div[role="tooltip"]` | Document skip-delay store |
| **`Toast`** | 1 | Notification queue, swipe-to-dismiss & timer engine | `ReferenceLibrary`, `Presence` | `ol` / `li[role="status"]` | Document queue store |
| **`Field`** | 1 | Form control bezel, label/error linking & `:has()` CSS | `Slot` | `div[data-reference-field]` | Ancestor selector CSS |
| **`Switch`** | 2 | Sliding thumb toggle & form synchronization | `Slot` | `button[role="switch"]` | Controlled boolean prop |
| **`Collapsible`** | 2 | Single disclosure panel with animated height | `Presence` | `div[data-reference-collapsible]` | Controlled open state |
| **`Accordion`** | 2 | Single/multiple collapsible grouping | `Collapsible`, `RovingFocus` | `div[data-reference-accordion]` | Instance collection store |
| **`Tabs`** | 2 | Tab list & tab panel coordination | `RovingFocus` | `div` / `button[role="tab"]` | Instance active-tab store |
| **`Slider`** | 2 | Single/multi-thumb continuous range slider | `Slot` | `div[role="slider"]` | Constraint & drag engine |
| **`Splitter`** | 2 | Resizable split-pane layout & keyboard stepping | `Slot` | `div[role="separator"]` | Drag session store |
| **`Listbox`** | 3 | Flat option selection & virtualized collection | `RovingFocus`, `Slot` | `div[role="listbox"]` | Instance selection store |
| **`Combobox`** | 3 | Input + popup listbox with autocomplete filtering | `Listbox`, `Popover`, `Field` | `input[role="combobox"]` | Input & popup coordinator |
| **`Menu`** | 3 | Dropdown/context menus & nested submenus | `Overlay`, `RovingFocus` | `div[role="menu"]` | Submenu intent store |
| **`Tree`** | 3 | Hierarchical multi-level tree navigation | `RovingFocus`, `Collapsible` | `div[role="tree"]` | Tree traversal engine |
| **`NumberField`** | 4 | Locale-aware numeric parsing, stepping & formatting | `Field`, `Slot` | `input[type="text"]` | Numeric parse/edit engine |
| **`DateField`** | 4 | Locale date editing, single/range & picker combobox | `Field`, `Popover`, `Calendar` | Dual-host (`input` / `div`) | Segmented date engine |
| **`Calendar`** | 4 | Gregorian ISO grid, month navigation & range select | `RovingFocus`, `Slot` | `div[role="grid"]` | Gregorian date engine |

---

## 4. The 7 Immutable Architectural Laws

Every manufactured component must strictly conform to Reference UI's foundational invariants:

### Law 1: Deterministic Host Elements & Zero Polymorphism
- Every public rendered part has a fixed, statically-typed native HTML host element.
- **No polymorphic `as` props** or runtime element switching.
- Public parts are typed with `ReferencePartProps<Tag>` or `ReferenceSlotPartProps`.
- *Explicit Dual-Host Exception*: `DateField` childless `<DateField />` resolves directly to `input[type=text]`; compound `<DateField>` with children renders the canonical `Field` bezel (`div[data-reference-field]`).

### Law 2: The Part-Resolution Law & Prop Precedence
All prop resolution must strictly follow Reference UI's deterministic order:
```
finalProps = merge(inputDefaults, rootInputProps, explicitInputProps, managedMachineProps)
```
- **Defaults:** Lowest precedence.
- **Root Shorthands:** Seed implicit child parts.
- **Explicit Part Props:** Author overrides on specific sub-parts.
- **Managed Machine Props:** Highest precedence for authoritative attributes (`aria-expanded`, `aria-controls`, `data-state`, `data-disabled`, `role`).
- **Classes & Styles:** Merged cleanly using token-aware utilities; never overwrite user classes or inline styles.
- **Refs:** Composed into a single stable callback ref that updates both internal machinery and consumer ref.

### Law 3: Headless State & Internal Zustand Substrate
- All multi-part and cross-tree state coordination uses internal Zustand stores (`src/core/hooks/`).
- **Zero Public Providers**: Applications are **never** required to wrap component trees in a `<Provider>` or `*.Provider`.
- Stores remain private implementation details; consumers interact exclusively via JSX parts, props, and documented public domain hooks/actions (e.g. `toast.show()`, `announce()`).
- **Store Lifecycles**:
  - *Instance Stores*: Isolated per component instance; torn down on unmount; resilient to React StrictMode double-mounting.
  - *Document Stores*: Keyed by `Document` for cross-tree global lifecycles (`ReferenceLibrary`, `Toast` queue, `Tooltip` skip-delay, `Overlay` layer stack).
- **Native React Context Policy**: Used *only* for private parent-to-child subtree relationship resolution (e.g. a `Listbox.Option` locating its parent `Listbox`). Context is never used as the global state store.

### Law 4: Event Chaining & Prevention Boundaries
- Consumer-authored event handlers (`onClick`, `onKeyDown`, `onPointerDown`, etc.) **always execute before** internal state machine transitions.
- If the consumer calls `event.preventDefault()`, the internal default action is canceled only if documented as cancelable.
- Native browser behaviors unrelated to the component contract must not be suppressed or intercepted.

### Law 5: Strict Public API & Type Boundary
- All public components, sub-parts, types, and domain hooks must be exported directly from `@reference-ui/lib` (`src/index.ts`).
- Public part interfaces extend `ReferencePartProps<Tag>` with managed machine properties omitted before defining controlled callbacks.
- Every style-bearing part inherits token-aware `StyleProps`, `css`, responsive baseline rhythm (`r`), and `colorMode`.
- Slot-like transparent parts implement `ReferenceSlotPartProps` (strictly 1 valid React child element, no wrapper DOM node).
- `matrix/lib` must import exclusively from `@reference-ui/lib`—never from internal package paths.

### Law 6: Separation of Testing Concerns
- **Model / Unit Tests (`vitest`)**: Execute in pure, deterministic environments (`matrix/lib/tests/unit/`). Test pure state machines, date/math algorithms, string parsing/formatting, and token merging. **Never** use synthetic, fragile JSDOM component mocks.
- **Browser Contract Tests (`playwright`)**: Execute in real browsers (`matrix/lib/tests/e2e/`). Test actual DOM hierarchies, focus management, pointer/touch physics, keyboard traps, APG interactions, animations, and accessibility trees (`role`, `aria-*`, `data-*`).

### Law 7: Accessibility & Platform Primacy
- Conformance with W3C WAI-ARIA Authoring Practices (APG) is mandatory.
- Generate stable, unique IDs using SSR-safe utilities (`useId` with React 17/18/19 fallback).
- Hidden inputs (`input[type=hidden]`) must participate in HTML `<form>` submissions with canonical serialized values when `name` is provided.
- Do not use `setCustomValidity` or break native form validation constraints unless explicitly required by spec.

---

## 5. Universal Part Conformance Suite (`PART-*`)

Every rendered part must pass the 13 universal conformance checks in addition to its component-specific test cases:

```
┌─────────────────┬──────────┬────────────────────────────────────────────────────────────────────────┐
│ Conformance ID  │ Target   │ Observable Verification Contract                                       │
├─────────────────┼──────────┼────────────────────────────────────────────────────────────────────────┤
│ PART-TYPE-01    │ Unit     │ Declaration rejects invalid tags, refs, and conflicting style/props.   │
│ PART-DOM-01     │ Browser  │ Renders exact documented native tag without undocumented wrappers.     │
│ PART-DOM-02     │ Browser  │ Slot-like/transparent roots preserve authored DOM on valid child.      │
│ PART-PROP-01    │ Browser  │ Preserves custom data-*, aria-*, className, and unrelated handlers.    │
│ PART-STYLE-01   │ Browser  │ Accepts token-aware StyleProps, css, colorMode, and baseline rhythm r. │
│ PART-REF-01     │ React    │ Attaches native element to object and callback refs across R17/18/19.  │
│ PART-REF-02     │ React    │ Composes internal + consumer refs without ref-driven render loops.     │
│ PART-EVENT-01   │ Browser  │ Runs user handlers first; honors preventDefault() at boundary.         │
│ PART-STATE-01   │ Browser  │ Behavior-owned data/ARIA states remain authoritative over overrides.   │
│ PART-ID-01      │ SSR      │ Generated IDs remain stable across SSR hydration and explicit id swap. │
│ PART-CONTROL-01 │ Browser  │ Controlled components do not mutate local DOM when parent rejects.     │
│ PART-DYNAMIC-01 │ Browser  │ Dynamic insert/remove/reorder discards stale state and listeners.      │
│ PART-DEFAULT-01 │ Unit     │ Omitted optional props resolve to deterministic documented defaults.   │
└─────────────────┴──────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 6. The 6-Phase Manufacturing Assembly Line

For your assigned component, execute this 6-phase assembly line in exact sequence:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Contract Ingestion & Invariant Review                         │
│ • Inspect <Component>.md, TESTS.md, components.md, and hooks.md        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 2: Headless State Machine Implementation                         │
│ • Implement internal Zustand store in src/core/hooks/ or local folder  │
│ • Verify transitions via pure Vitest unit tests                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 3: Component Parts & DOM Realization                             │
│ • Implement Root and static sub-parts in src/components/<Component>/   │
│ • Apply fixed host elements, StyleProps, ARIA, and data-* attributes   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 4: Matrix Fixture & Harness Construction                         │
│ • Author interactive test page in matrix/lib/src/<component>.tsx       │
│ • Expose observable verification affordances (data attributes / logs)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 5: Automated Proof & Conformance Execution                       │
│ • Execute Playwright E2E suites & cross-React compatibility tests      │
│ • Validate full TypeScript compilation and zero lint regressions       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 6: Sign-off, Contract Checklist & Handoff Delivery               │
│ • Mark verified cases in <Component>/TESTS.md (- [x] <PREFIX>-...)     │
│ • Generate standardized manufacturing completion report                │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Phase 1: Contract Ingestion & Invariant Review
1. Read `packages/reference-lib/src/components/<Component>/<Component>.md` for exact anatomy, part names, default props, and behavioral semantics.
2. Read `packages/reference-lib/src/components/<Component>/TESTS.md` for all freeze decisions, tagged behavior cases (`<PREFIX>-*`), and composition gates (`<PREFIX>-COMP-*`).
3. Identify all upstream dependencies from Tiers 0–3 and ensure they are satisfied.

#### Phase 2: Headless State Machine Implementation
1. If the component manages non-trivial state (transitions, draft sessions, collection indexing, range math, focus roving), implement an internal Zustand store or headless hook.
2. Document:
   - **Store Shape**: Exact state fields vs. controlled prop inputs.
   - **Actions**: Named mutation methods and the public callbacks they request.
   - **Selectors**: Granular selectors to minimize re-renders across sub-parts.
3. Write pure model unit tests under `matrix/lib/tests/unit/<component>.test.ts` (or `packages/reference-lib/src/`) and run via Vitest.

#### Phase 3: Component Parts & DOM Realization
1. Build the root component and all sub-parts in `packages/reference-lib/src/components/<Component>/`.
2. Attach the fixed native HTML host elements.
3. Implement the Part-Resolution Law for prop merging and ref composition.
4. Set authoritative data attributes (`data-state`, `data-disabled`, `data-orientation`, `data-open`, `data-editing`, etc.) and ARIA attributes (`role`, `aria-expanded`, `aria-controls`, `aria-selected`, `aria-valuenow`).
5. Export everything cleanly from `packages/reference-lib/src/index.ts`.

#### Phase 4: Matrix Fixture & Harness Construction
1. Create or update the fixture page at `matrix/lib/src/<component>.tsx`.
2. Register the route in `matrix/lib/src/app.tsx` if not already present.
3. Expose observable verification affordances (visible callback logs, controlled toggle switches, form submission displays) so browser tests can assert without internal inspection.

#### Phase 5: Automated Proof & Conformance Execution
1. Create or update Playwright specs at `matrix/lib/tests/e2e/<component>.spec.ts`.
2. Verify all tagged behavior cases (`<PREFIX>-*`), composition gates (`<PREFIX>-COMP-*`), and universal `PART-*` checks.
3. Run local typecheck and test commands (see Section 7).

#### Phase 6: Sign-off, Contract Checklist & Handoff Delivery
1. Update `packages/reference-lib/src/components/<Component>/TESTS.md` by marking verified items as `- [x] <PREFIX>-...`.
2. Compile and return the standardized completion report (see Section 9).

---

## 7. Execution Commands & Testing Protocol

Execute commands directly and locally inside their target package. **Do not run repo-wide pipeline wrappers (`pnpm pipeline test`, repo-root `pnpm test`)** as they lock and fan out unnecessarily.

### Type Checking
```bash
# Verify @reference-ui/lib types
pnpm --filter @reference-ui/lib run typecheck

# Verify matrix/lib test harness types
pnpm --filter @reference-ui/matrix-lib run typecheck
```

### Pure Model Unit Tests (Vitest)
```bash
# Run all unit tests in matrix/lib
cd matrix/lib && pnpm exec vitest run

# Run specific component unit tests
cd matrix/lib && pnpm exec vitest run tests/unit/<component>.test.ts

# Filter by test name
cd matrix/lib && pnpm exec vitest run -t "<PREFIX>-<CASE>"
```

### Browser E2E Tests (Playwright)
```bash
# Run all E2E tests for the component
cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts

# Run with specific browser or project
cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts --project=vite7

# Run filtered by case ID
cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts -g "<PREFIX>-<CASE>"
```

---

## 8. Defect Prevention & Edge-Case Playbook

| Edge Case / Hazard | Mechanism of Failure | Mandated Reference UI Defense |
| :--- | :--- | :--- |
| **StrictMode Double-Mount** | Store listener subscriptions or DOM measurements duplicate/leak on mount/unmount replay. | Ensure store subscriptions, DOM event listeners, and timers return explicit cleanup functions. Store instances must cleanly reset or withstand unmount-remount cycles. |
| **Ref Composition Loops** | Callback refs updating component state trigger continuous re-render cycles. | Use stable `useComposedRefs` adapters that assign `.current` directly and invoke callback refs without triggering synchronous state updates during the commit phase. |
| **SSR Hydration ID Mismatch** | Server-generated IDs diverge from client IDs, breaking ARIA links (`aria-controls`, `aria-labelledby`). | Use Reference UI's SSR-safe ID generation utility (`useId` wrapper). Explicit consumer-provided `id` props must always take absolute precedence. |
| **Pointer / Touch Collision** | Touch taps trigger synthetic mouse events, causing double activations or premature dismissals. | Use Pointer Events (`pointerdown`, `pointerup`) with explicit pointer-type discrimination (`event.pointerType === "touch"` vs `"mouse"`). Handle `pointercancel` cleanly. |
| **Nested Overlay Escape Stack** | Pressing Escape in a nested popup or dialog dismisses all ancestor overlays at once. | The top-most layer in the `Overlay` document stack handles Escape, requests dismissal, and calls `event.stopPropagation()` to prevent ancestor layers from closing. |
| **Dynamic Collection Reordering** | Items added, removed, or reordered retain stale indexes or broken roving focus targets. | Use DOM-order collection queries or keyed registries. When active item is removed, smoothly shift focus/active index to the nearest sibling or boundary item. |
| **Controlled Update Rejection** | Parent component ignores `onChange`/`onOpenChange` request; child optimistically mutates local DOM. | Never update internal visual state optimistically when controlled. The component must reflect exclusively the authoritative props passed from the parent (`PART-CONTROL-01`). |
| **IME Composition Sessions** | Caret jumping or premature commit while typing in Japanese/Chinese/Korean or virtual keyboards. | Listen to `compositionstart` and `compositionend`. Suppress intermediate parser formatting and change events until the IME composition session is complete. |

---

## 9. Agent Completion & Sign-off Schema

Upon completing your assigned component, return a structured sign-off report matching this exact schema:

```markdown
# Manufacturing Completion Report: <COMPONENT_NAME>

## 1. Manufactured Files
- `packages/reference-lib/src/components/<COMPONENT_NAME>/...`
- `matrix/lib/src/<component>.tsx`
- `matrix/lib/tests/e2e/<component>.spec.ts`
- `matrix/lib/tests/unit/<component>.test.ts` (if applicable)

## 2. Verification Summary
- **Typecheck**: `pnpm --filter @reference-ui/lib run typecheck` (PASSED)
- **Unit Tests**: `cd matrix/lib && pnpm exec vitest run tests/unit/<component>.test.ts` (<X> passed)
- **E2E Browser Tests**: `cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts` (<Y> passed)

## 3. Satisfied Test Contracts
- [x] `<PREFIX>-DOM-01` to `<PREFIX>-DOM-NN`
- [x] `<PREFIX>-KEY-01` to `<PREFIX>-KEY-NN`
- [x] `<PREFIX>-COMP-01` to `<PREFIX>-COMP-NN`
- [x] `PART-TYPE-01` through `PART-DEFAULT-01` (Universal Part Conformance)

## 4. Architectural Invariants Verified
- Fixed native host elements verified (`<Tag>`)
- Part-Resolution Law & prop precedence confirmed
- Internal Zustand state isolation validated under React StrictMode
- Zero public Context providers required

## 5. Downstream Integration Notes
- Notes on shared hooks or integration seams for downstream tier components consuming `<COMPONENT_NAME>`.
```
