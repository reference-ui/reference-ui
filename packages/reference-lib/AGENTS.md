# @reference-ui/lib Component Manufacturing & Architecture Rules

Master engineering standards and strict architectural invariants for all 24 components in `@reference-ui/lib`.

---

## 1. Dev Server & Local Environment Policy

> [!IMPORTANT]
> **DO NOT launch background `pnpm dev:lib` or long-running `cosmos` dev server processes.**
> The developer prefers running `pnpm dev:lib` locally in their own terminal to monitor logs and prevent port/process conflicts.
> If port 5000 (Cosmos) or port 5050 (Vite renderer) is not reachable, politely prompt the developer to run `pnpm dev:lib` in their terminal before proceeding with browser fixture verification.

---

## 2. The 7 Immutable Architectural Laws

### Law 1: Deterministic Host Elements & Zero Polymorphism
- Every public rendered part has a fixed, statically-typed native HTML host element.
- **No polymorphic `as` props** or runtime element switching.
- Public parts are typed with `ReferencePartProps<Tag>` or `ReferenceSlotPartProps`.
- *Explicit Dual-Host Exception*: `DateField` childless `<DateField />` resolves directly to `input[type=text]`; compound `<DateField>` with children renders the canonical `Field` bezel (`div[data-reference-field]`).

### Law 2: The Part-Resolution Law & Prop Precedence
All prop resolution must strictly follow Reference UI's deterministic order:
```ts
finalProps = merge(inputDefaults, rootInputProps, explicitInputProps, managedMachineProps)
```
- **Defaults:** Lowest precedence.
- **Root Shorthands:** Seed implicit child parts.
- **Explicit Part Props:** Author overrides on specific sub-parts.
- **Managed Machine Props:** Highest precedence for authoritative attributes (`aria-expanded`, `aria-controls`, `data-state`, `data-disabled`, `role`).
- **Classes & Styles:** Merged cleanly using token-aware utilities; never overwrite user classes or inline styles.
- **Refs:** Composed into a single stable callback ref that updates both internal machinery and consumer ref.

### Law 3: Headless State & Internal Zustand Substrate
- Multi-part and cross-tree state coordination uses internal Zustand stores (`src/core/hooks/` or component-local state machine).
- **Zero Public Providers**: Applications are **never** required to wrap component trees in a `<Provider>`.
- Stores remain private implementation details; consumers interact exclusively via JSX parts, props, and documented public domain actions.
- **Store Lifecycles**: Isolated per component instance; torn down on unmount; resilient to React StrictMode double-mounting.
- **Native React Context Policy**: Used *only* for private parent-to-child subtree relationship resolution.

### Law 4: Event Chaining & Prevention Boundaries
- Consumer-authored event handlers (`onClick`, `onKeyDown`, `onPointerDown`, etc.) **always execute before** internal state machine transitions.
- If the consumer calls `event.preventDefault()`, the internal default action is canceled only if documented as cancelable.
- Native browser behaviors unrelated to the component contract must not be suppressed or intercepted.

### Law 5: Strict Public API & Type Boundary
- All public components, sub-parts, types, and domain hooks must be exported directly from `@reference-ui/lib` (`src/index.ts`).
- Public part interfaces extend `ReferencePartProps<Tag>` with managed machine properties omitted before defining controlled callbacks.
- Every style-bearing part inherits token-aware `StyleProps`, `css`, responsive baseline rhythm (`r`), and `colorMode`.

### Law 6: Separation of Testing Concerns
- **Model / Unit Tests (`vitest`)**: Execute in pure, deterministic environments (`matrix/lib/tests/unit/`). Test pure state machines, date/math algorithms, string parsing/formatting, and token merging. **Never** use synthetic JSDOM component mocks.
- **Browser Contract Tests (`playwright`)**: Execute in real browsers (`matrix/lib/tests/e2e/`). Test actual DOM hierarchies, focus management, pointer/touch physics, keyboard traps, APG interactions, animations, and accessibility trees (`role`, `aria-*`, `data-*`).

### Law 7: Accessibility & Platform Primacy
- Conformance with W3C WAI-ARIA Authoring Practices (APG) is mandatory.
- Generate stable, unique IDs using SSR-safe utilities (`useId`).
- Hidden inputs (`input[type=hidden]`) must participate in HTML `<form>` submissions with canonical serialized values when `name` is provided.
- Do not use `setCustomValidity` or break native form validation constraints unless explicitly required by spec.

---

## 3. Verification Protocol

Run targeted verification locally:
```bash
# Typecheck
pnpm --filter @reference-ui/lib run typecheck

# Unit tests (Vitest)
cd matrix/lib && pnpm exec vitest run tests/unit/<component>.test.ts

# Browser E2E tests (Playwright)
cd matrix/lib && pnpm exec playwright test tests/e2e/<component>.spec.ts
```
