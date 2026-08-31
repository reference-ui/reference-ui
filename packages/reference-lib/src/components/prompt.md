# Reference UI Component Manufacturing Orchestration Prompt

Use this prompt to orchestrate multi-agent manufacturing of all 24 components across `@reference-ui/lib`.

---

## Agent Objective

You are manufacturing a designated component in `@reference-ui/lib`. Your goal is to produce a production-ready, fully-typed, accessible React 19 implementation that satisfies 100% of its design specification (`<Component>.md`) and passes all tagged behavior cases and composition gates in its test contract (`TESTS.md`).

---

## Assignment Template

```markdown
Continue manufacturing `<COMPONENT_NAME>` for `@reference-ui/lib`.

Assigned component: `packages/reference-lib/src/components/<COMPONENT_NAME>/`
Design specification: `packages/reference-lib/src/components/<COMPONENT_NAME>/<COMPONENT_NAME>.md`
Test contract: `packages/reference-lib/src/components/<COMPONENT_NAME>/TESTS.md`
Global design architecture: `packages/reference-lib/src/components/components.md`
Core hooks & Zustand substrate: `packages/reference-lib/src/core/hooks/hooks.md`
Test harness: `matrix/lib/`
```

---

## Manufacturing Tiers & Dependency Order

Agents can work in parallel within each tier. Upstream dependencies must be satisfied before downstream components consume them:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 0: Authoring & Runtime Foundations                                │
│ Slot • Presence • Portal • FocusLock • RovingFocus • ReferenceLibrary  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 1: Overlays, Popups & Visual Substrate                            │
│ Overlay • Popover • Tooltip • Toast • Field                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 2: Atomic Controls & Disclosures                                  │
│ Switch • Collapsible • Accordion • Tabs • Slider • Splitter            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 3: Composite Selection & Navigation Widgets                       │
│ Listbox • Combobox • Menu • Tree                                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ TIER 4: High-Precision Editors & Grid Engines                          │
│ NumberField • DateField • Calendar                                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Laws & Invariants

Every manufactured component must strictly conform to Reference UI core principles:

1. **Fixed Native Host Elements**:
   - Every public part renders a definite, predictable native HTML tag.
   - No polymorphic `as` props or runtime element switching.
   - *(Exception: `DateField` dual-host contract—childless `<DateField />` renders `input[type=text]`; compound `<DateField>` renders `div[data-reference-field]`)*.

2. **Deterministic Part-Resolution Law**:
   - `finalInputProps = merge(inputDefaults, rootInputProps, explicitInputProps, managedMachineProps)`.
   - Classes, styles, and refs merge cleanly using Reference UI's standard merge utilities.
   - User-authored event handlers run before internal state machine actions; `event.preventDefault()` cancels internal actions where documented.

3. **Headless State & Internal Zustand Substrate**:
   - Multi-part coordination uses lightweight internal Zustand stores (`src/core/hooks/`).
   - No public `<Provider>` components wrapping consumer trees.
   - Stores are isolated per instance; no default singletons or cross-tree state leaks.

4. **Public API Boundary**:
   - All components, parts, hooks, and types must be cleanly exported from `@reference-ui/lib`.
   - Public part types extend `ReferencePartProps<"tag">` with managed properties omitted.
   - `matrix/lib` imports strictly from `@reference-ui/lib`, never from internal paths.

5. **Testing Separation**:
   - **Unit Tests (`vitest`)**: Test pure state machines, date/math algorithms, string parsing/formatting, and token merging. Never use synthetic, fragile JSDOM component mocks.
   - **E2E Tests (`playwright`)**: Test real browser execution, pointer/keyboard interactions, focus cycles, DOM hierarchy, and accessibility tree attributes (`role`, `aria-*`, `data-*`).

---

## Standard Manufacturing Workflow

For your assigned component, execute these steps systematically:

### 1. Invariant Analysis
- Read `<Component>.md` for exact anatomy, default props, managed properties, and behavioral requirements.
- Read `TESTS.md` for all freeze decisions, tagged behavior cases (`<PREFIX>-*`), and composition gates (`<PREFIX>-COMP-*`).
- If headless state or cross-component coordination is involved, check `src/core/hooks/hooks.md`.

### 2. State Engine Implementation
- If the component requires a state machine or draft transaction (e.g. `useDateRange`, `useRovingFocus`, `usePresence`), implement the headless store / hook in `src/core/hooks/` or `src/components/<Component>/`.
- Write/run pure unit tests via Vitest to verify state transitions and edge cases.

### 3. Component & Part Implementation
- Implement the component root and static sub-parts in `src/components/<Component>/`.
- Ensure exact data attributes (`data-state`, `data-disabled`, `data-editing`, `data-orientation`, etc.) and ARIA attributes match the specification.
- Ensure stable refs, unique IDs, and SSR-safe rendering.

### 4. Package Export & Type Check
- Export the component, sub-parts, and prop interfaces from `src/index.ts`.
- Run typecheck:
  ```bash
  pnpm --filter @reference-ui/lib run typecheck
  ```

### 5. Verification & Test Execution
- Run unit tests:
  ```bash
  pnpm --filter @reference-ui/lib exec vitest run
  ```
- Run Playwright E2E browser tests:
  ```bash
  cd matrix/lib && pnpm exec playwright test tests/e2e/<component-name>.spec.ts
  ```

### 6. Sign-off & Contract Checklist
- Update `<Component>/TESTS.md` to check off completed test cases `- [x] <PREFIX>-...`.
- If any real issue is discovered that requires an architectural amendment, document it clearly before marking complete.

---

## Agent Output Requirements

Upon finishing your assigned component slice, return a concise report containing:
1. **Manufactured Files**: List of created/modified source files.
2. **Commands Executed**: Exact test commands run and their pass/fail results.
3. **Contracts Satisfied**: Summary of verified `TESTS.md` case IDs.
4. **Open Items / Handoffs**: Any cross-component notes for downstream tier components.
