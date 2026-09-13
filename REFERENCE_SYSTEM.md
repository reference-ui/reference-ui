# Reference System: The Native Style Engine

> **The Mandate:** Complete vertical integration and architectural permanence.  
> **The Principle:** *"Be conservative in what you send, be liberal in what you accept"* (Postel's Law). If Reference UI offers style props, we support them with 100% robustness—including nested ternaries, composite shorthands, and sub-pixel rhythm units. No silent CSS dropouts. No external framework churn.

---

## Table of Contents

1. [Executive Summary & The Case for Permanence](#1-executive-summary--the-case-for-permanence)
2. [Forensic Autopsy of Panda v2 (Where It Fell Short)](#2-forensic-autopsy-of-panda-v2-where-it-fell-short)
3. [The Reference RS Benchmark: Systems Discipline in Practice](#3-the-reference-rs-benchmark-systems-discipline-in-practice)
4. [Styletrace as the Foundation of the Native Extractor](#4-styletrace-as-the-foundation-of-the-native-extractor)
5. [The Synthesis: What We Take from Panda vs. What We Do Better](#5-the-synthesis-what-we-take-from-panda-vs-what-we-do-better)
6. [The Component Triad: Recipes, Data Attributes, and Style Props](#6-the-component-triad-recipes-data-attributes-and-style-props)
7. [Eliminating the Virtual Filesystem Seam](#7-eliminating-the-virtual-filesystem-seam)
8. [The Matrix Safety Net: 26+ Suites of Ground Truth](#8-the-matrix-safety-net-26-suites-of-ground-truth)
9. [The Visual Decision Tree](#9-the-visual-decision-tree)
10. [Phased Implementation Roadmap](#10-phased-implementation-roadmap)
11. [Turnkey Implementation Prompt](#11-turnkey-implementation-prompt)

---

## 1. Executive Summary & The Case for Permanence

Reference UI was founded on enterprise stability, type safety, and zero-runtime friction.

For styling, we initially relied on external engines (Chakra UI, then Panda CSS). However, the history of this external lineage has been characterized by perpetual breaking churn across three generations:
- **Chakra v1 → Chakra v2:** Complete rewrite of theme contracts and style prop lifecycles.
- **Chakra v2 → Chakra v3:** Complete rewrite of components, dropping style props in favor of snippets and un-opinionated primitives.
- **Panda v1 → Panda v2:** Rewrite from Babel AST to native Rust, introducing a **split-brain architecture** where native Rust extraction and TypeScript runtime transforms fall out of sync, silently dropping styles for dynamic ternaries and composite shorthands.

### The Core Concept: Permanence
Enterprises do not rebuild their design systems every 18 months because an external open-source tool decided to reinvent its paradigm or chase social-media frontend trends.
- **Reference UI owns its parser (`reference-rs` / Tasty).**
- **Reference UI owns its component layer (`reference-lib`).**
- **Reference UI owns its design tokens (`atlas` / `tokens`).**

The remaining foreign body in the architecture is **Panda CSS** and the fragile **Virtual Filesystem Seam** (`.reference-ui/virtual/`) required to bridge it.

This document defines the blueprint for **`reference-system`**: a lean (~4,000–5,000 LOC), rock-solid atomic styling engine integrated directly into `packages/reference-rs`.

---

## 2. Forensic Autopsy of Panda v2 (Where It Fell Short)

We have Panda v2 cloned directly in `vendor/panda`. Across its 12 Rust crates, there are **61,399 lines of Rust source code** and **68,003 lines of tests** (129,402 LOC total).

A detailed forensic examination of their codebase reveals why Panda v2 exhibits severe edge cases and how its engineering approach fell short of industrial compiler standards.

### A. It Was an Expedient Transliteration of Node.js Hacks
Panda v2 was not designed from first principles as a native compiler; it was an expedient port of a legacy Babel/JavaScript AST visitor into Rust using OXC.

The comments in their own source code prove this:
```rust
// vendor/panda/crates/pandacss_extractor/src/literal.rs:300:
// PORT NOTE: folding is lenient per-member, matching the JS extractor.

// vendor/panda/crates/pandacss_extractor/src/literal.rs:681:
// Left didn't fold, so it's a dynamic condition, not a style alternative —
// the right operand is the only extractable style (node's
// `maybeResolveConditionalExpression` does the same).

// vendor/panda/crates/pandacss_extractor/src/literal.rs:701:
// Keep whatever folds, like node's `maybeResolveConditionalExpression`:
// both branches fold → Conditional (collapsed to one if equal);
// only one folds → that branch alone; neither folds → drop.
```

Instead of establishing a formal Intermediate Representation (IR), they copied the loose, dynamic, forgiving heuristics of JavaScript into Rust type systems.

### B. The Fatal Split-Brain Architecture
In Panda v1, both extraction and runtime execution ran in JavaScript, so plugins and transforms could execute in-memory. 

In Panda v2:
1. **The Extractor and Encoder are in Rust:** They run natively during build time using OXC. But the native crate cannot execute JavaScript callbacks.
2. **Custom Transforms are in TypeScript:** Shorthand decomposition (like `createShorthandUtility`) was written in TypeScript on the Node.js config side.
3. **The Runtime is a Dumb String Concatenator:** In the browser, `packages/reference-core/src/system/styled/css/css.js:36` only does:
   ```javascript
   transform(prop, value) {
     const key = resolveShorthand(prop)
     const propKey = classNameByProp.get(key) || hypenateProperty(key)
     return { className: `${propKey}_${withoutSpace(value)}` }
   }
   ```
   Runtime `css.js` knows **nothing** about custom transforms or shorthand decomposition!

#### The Consequence (The `borderBottom` Dropout in `Tabs.tsx`):
- **Build Time:** Reference Core configured `borderBottom: '3px solid'`. The JS config decomposed it into `borderBottomWidth: '3px'` and `borderBottomStyle: 'solid'`. The stylesheet compiler generated `.bd-b-w_3px` and `.bd-b-s_solid`.
- **Runtime:** React called `css({ borderBottom: '3px solid' })`. Runtime `css.js` generated `className="bd-b_3px_solid"`.
- **Result:** The browser applied `.bd-b_3px_solid`. Because that class **did not exist in `styles.css`**, the active underline vanished completely.

### C. The Failure on Ternary Expressions
Why did Panda v2 fail to map ternary statements to atomic classes?

```tsx
borderBottom={isLine && horizontal ? isSelected ? '3px solid' : '3px solid transparent' : undefined}
```

Panda tried to be "half-clever":
1. It attempted static constant evaluation on `c.test` in `literal.rs:687`.
2. When it hit runtime variables (`isLine`, `isSelected`), evaluation returned `None`.
3. For `undefined` alternates, `literal.rs:511` coerced `undefined` into `Some(Literal::Null)`.
4. In `style_tree.rs:242` (`finish_ternary`), because `alternate` was `Some(Literal::Null)` (instead of `None`), it created unflattened, invalid nested variants: `Conditional([Conditional([A, B]), Null])`.
5. The encoder couldn't resolve the nested conditional and silently dropped the style.

**The Fundamental Flaw:** A CSS compiler does **not** need to evaluate runtime boolean conditions. It does not care *when* `isSelected` is true. It only needs to collect every possible literal leaf across both branches so that all corresponding atomic classes are pre-emitted into the stylesheet!

### D. The Corporate / Bureaucracy Signal
Panda v2's git log on `origin/v2` shows a project with misaligned priorities:
- **3-person core team:** Segun Adebayo, Gabe Castro, and Lope.
- **Heavy investment in marketing & peripheral tools:** Building a "Spec Studio" web app, writing blog posts (*"Zero runtime, all the way down"*), and redesigning playgrounds.
- **Suppression of user issues:** Moving feature requests out of GitHub issues into GitHub Discussions (`chore: move feature requests to GitHub Discussions (#3774)`).
- **Multi-Framework Distraction:** Over 30,000 LOC dedicated to Vue SFC, Svelte runes, Solid JSX signals, and Astro frontmatter, while core React JSX extraction and runtime parity remained broken.

---

## 3. The Reference RS Benchmark: Systems Discipline in Practice

By contrast, `packages/reference-rs` represents **275 focused commits** over 6+ months of disciplined systems engineering.

### A. Formal, Typed Semantic IR (`model.rs`)
While Panda uses loose `Literal` enums with heuristic fallbacks, Reference RS defines a formal, closed model:
- `TypeRef` models 17 distinct variants (`Intrinsic`, `Literal`, `Union`, `Intersection`, `Tuple`, `Object`, `IndexedAccess`, etc.).
- **Fail-Closed Philosophy:** If an AST node is unsupported, it drops into `Raw { summary }` with the exact source text preserved. Nothing silently vanishes.

### B. Single Source of Truth (`ts-rs`)
In `reference-rs`, Rust structs use `ts-rs` to automatically generate TypeScript declarations under `js/tasty/generated/`. 
- If the Rust compiler and the TypeScript runtime diverge by a single field, it fails to compile.
- Zero serialization drift. Zero split-brain.

### C. Industrial-Grade Verification
- **Generative Property Fuzzing (`proptest`):** In `src/tasty/tests/type_ref_proptest.rs`, `proptest` generates randomized, deeply nested type trees to prove that recursion never overflows the stack and transformations are idempotent.
- **38 Matrix Fixture Suites (`tests/tasty/cases/`):** Real-world scenarios tested end-to-end with generated chunk assertion and perf metric tracking.
- **Criterion Benchmarks (`benches/scan_kitchen_sink.rs`):** Microsecond benchmarking on full-pipeline parsing.

This is the exact level of discipline we will bring to `reference-system`.

---

## 4. Styletrace as the Foundation of the Native Extractor

We do not need to write an AST extractor from scratch. We already built **`styletrace`** (`packages/reference-rs/src/styletrace`)!

### Why Was Styletrace Originally Built?
Styletrace was built in Rust with OXC to overcome another major limitation in Panda:
- By default, Panda only extracts style props from hardcoded primitive tags (`Box`, `styled.div`).
- If an author wrote a custom wrapper component:
  ```tsx
  const Card = ({ children, ...props }) => <Box p="4r" {...props}>{children}</Box>
  ```
  And then used `<Card bg="blue.500" />`, **Panda silently ignored the style props**!
- To fix this, `styletrace` was created to:
  1. Parse TSX files with OXC.
  2. Read `.reference-ui/react/types/style-props.d.mts` and expand the `StyleProps` type definition.
  3. Trace component boundaries and forwarding edges (`{...props}`) down to Reference primitives.
  4. Automatically feed discovered component names into Panda's config.

### Styletrace is Already 70% of an Atomic Extractor
`styletrace` already knows how to:
- Parse `.tsx` files at native speed with OXC.
- Identify which JSX elements carry style props.
- Resolve whether a component terminates in a Reference primitive.

To turn `styletrace` into the full `reference-system` extractor, we simply add a **Recursive Leaf Literal Collector** to scoop up style props from those elements.

---

## 5. The Synthesis: What We Take from Panda vs. What We Do Better

We are not throwing everything away; we are **synthesizing the best ideas and replacing the broken ones**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNTHESIS BLUEPRINT                             │
├───────────────────────────────────┬────────────────────────────────────┤
│   WHAT WE ADOPT FROM PANDA V2     │     WHAT WE DO DIFFERENTLY / BETTER│
├───────────────────────────────────┼────────────────────────────────────┤
│ • Atom Data Model:                │ • Unified Single-Engine Runtime:   │
│   (prop, value, conditions, hash) │   Same Rust algorithm runs at      │
│ • 5-Layer Cascade Ordering:       │   build time and in runtime css(). │
│   @layer reset, base, tokens,     │   Zero ghost classes.              │
│   recipes, utilities              │ • Recursive Leaf Literal Collector:│
│ • Condition Chains:               │   Scoops all ternary branches;     │
│   Nested @media & pseudo-selectors│   zero heuristic constant folding. │
│ • Slot Recipes (sva) & cva:       │ • Native Rhythm & Atlas Tokens:    │
│   Multi-part compound variants    │   r multipliers & OKLCH color math │
│ • String Utilities:               │   evaluated natively in Rust.      │
│   CSS escaping & hyphenation      │ • Elimination of Virtual FS:       │
│                                   │   Direct in-memory compilation;    │
│                                   │   deletes .reference-ui/virtual/.  │
│                                   │ • Laser-Focused on React:          │
│                                   │   Zero Vue/Svelte/Astro bloat.     │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 6. The Component Triad: Recipes, Data Attributes, and Style Props

A high-integrity design system must balance **architectural rigor** with **developer velocity**:

| Layer | Tool | Role | Example |
| :--- | :--- | :--- | :--- |
| **1. Component Anatomy** | **Recipes (`cva` / `sva`)** | Canonical design system engineering. Defines static variants and sizes at build time. | `variant: 'line' \| 'pill'` |
| **2. Interactive State** | **Data Attributes** | State transitions handled natively by CSS attribute selectors without JS class churn. | `&[data-state="active"]` |
| **3. Layout & Prototyping**| **Style Props** | Instant, fluid authoring. Lets developers compose layouts without naming a recipe. | `<Flex gap="4r" mt="2r" />` |

### The "Hell No" Linter + Resilient Extractor
We want both:
1. **Linter Discipline:** Because `styletrace` inspects JSX style props with OXC, it can emit a warning when developers write unreadable nested ternaries:
   > *"Warning: Avoid nested ternaries on style props. Prefer recipes or data-attribute selectors."*
2. **Compiler Resilience (Postel's Law):** If a developer *does* write a ternary, the compiler does not fail or drop styles. The recursive leaf collector extracts every branch, emits the classes, and the component works 100%.

---

## 7. Eliminating the Virtual Filesystem Seam

The **Reference ↔ Panda virtual filesystem seam** (`.reference-ui/virtual/`) is the single most complex, fragile subsystem in `reference-core` today.

### Current Pipeline (With Panda):
```
User Source Code (.tsx)
   │
   ▼
Parcel Watcher (@parcel/watcher)
   │
   ▼
Piscina Worker Thread Pool (Virtual Mirror)
   │
   ▼
Disk Write: .reference-ui/virtual/**/*.tsx (Rewritten by virtualrs)
   │
   ▼
Liquid Template Engine: Renders .reference-ui/panda.config.ts
   │
   ▼
Panda CLI / Worker: Scans .reference-ui/virtual on disk
   │
   ▼
Disk Write: .reference-ui/styled/*
   │
   ▼
Packager: Bundles and symlinks into node_modules/@reference-ui/*
```

### Future Pipeline (With `reference-system`):
```
User Source Code (.tsx)
   │
   ▼
In-Memory OXC AST Traversal (styletrace + extractor in Rust)
   │
   ▼
Direct Emission: .reference-ui/styled/styles.css
```

### What Gets Permanently Deleted:
1. `@parcel/watcher` dependency.
2. `Piscina` worker pools for virtual mirroring.
3. `panda.liquid` and generated `panda.config.ts`.
4. The entire `.reference-ui/virtual/` directory on disk.
5. Watcher race conditions and A/B file state desynchronizations during git branch switches.

Sync cold-start time drops from **3–5 seconds** down to **< 150 milliseconds**.

---

## 8. The Matrix Safety Net: 26+ Suites of Ground Truth

We have already codified the contracts of the entire design system under `matrix/`. Any PR or implementation of `reference-system` must pass this exact test suite:

| Matrix Package | Test Spec | What It Proves (Must Never Regress) |
| :--- | :--- | :--- |
| **`matrix/css`** | `tests/e2e/css-contract.spec.ts` | Atomic class generation, specificity, CSS class concatenation. |
| **`matrix/css-selectors`** | `tests/e2e/css-selectors-contract.spec.ts` | Complex pseudo-classes (`_hover`, `_focusVisible`), sibling and child selectors. |
| **`matrix/primitives`** | `tests/e2e/primitives-contract.spec.ts` | `<Box>`, `<Flex>`, `<Grid>`, style prop forwarding down component boundaries. |
| **`matrix/recipe`** | `tests/e2e/system-contract.spec.ts` | `cva()`, `sva()`, compound variants, high-level variant props on `styled()`. |
| **`matrix/spacing`** | `tests/e2e/system-contract.spec.ts` | Sub-pixel rhythm multiplier (`r` -> `px`), padding, margins, dimension shorthands. |
| **`matrix/responsive`** | `tests/e2e/system-contract.spec.ts`<br>`tests/e2e/viewport-contract.spec.ts` | Responsive container queries (`@container`), media queries, breakpoint arrays. |
| **`matrix/color-mode`** | `tests/e2e/system-contract.spec.ts` | Light/dark switching, semantic token resolution (`_dark`, `_light`). |
| **`matrix/tokens`** | `tests/e2e/system-contract.spec.ts` | OKLCH color space resolution, CSS variable generation (`--colors-*`). |
| **`matrix/system`** | `tests/e2e/system-contract.spec.ts`<br>`tests/e2e/system-font-contract.spec.ts` | Layer mounting (`@layer reset, base, tokens, recipes, utilities`), `globalCss`, `keyframes`. |
| **`matrix/chain/T1–T13`**| `tests/e2e/T1..T13-contract.spec.ts` | Multi-tier design system inheritance (`extends`), token overrides, layer isolation. |
| **`matrix/watch`** | `tests/e2e/watch-contract.spec.ts` | HMR and live atomic stylesheet regeneration during active editing. |

**Unit Test Baseline:**
- `packages/reference-core`: 656 passing unit tests.
- `packages/reference-lib`: 189 passing unit tests.
- `packages/reference-rs`: 144 Rust unit tests + generative proptests + Criterion benchmarks.

---

## 9. The Visual Decision Tree

```mermaid
graph TD
    Start["Current State: Main Branch Clean"] --> Phase1["Phase 1: Component Hardening on Lib"]
    
    Phase1 --> Step1A["Refactor Tabs & Lib Components to Recipes & Data-Attributes"]
    Step1A --> Step1B["Verify 100% CT Tests Pass (Zero Inline Style Hacks)"]
    
    Step1B --> Gate1{"Decision Gate 1:<br/>Is Panda v2 causing ongoing friction,<br/>split-brain bugs, or virtual FS lag?"}
    
    Gate1 -- "No: Stable for now" --> Hold["Keep Panda v2 temporarily;<br/>Components are safely decoupled"]
    Gate1 -- "Yes: Pull the Trigger" --> Phase2["Phase 2: Scaffold reference-system in reference-rs"]
    
    Phase2 --> Step2A["Setup Cargo Workspace:<br/>crates/tasty, crates/atlas, crates/system"]
    Step2A --> Step2B["Promote styletrace to Extractor<br/>(Recursive Leaf Literal Collector)"]
    Step2B --> Step2C["Implement Deterministic Atom Emitter<br/>(CSS @layer ordering, shorthands, rhythm)"]
    
    Step2C --> Gate2{"Decision Gate 2:<br/>Does reference-system pass the<br/>26+ Matrix E2E Test Suites?"}
    
    Gate2 -- "No: Parity gaps found" --> Iterate["Iterate in isolated branch until 100% parity"]
    Gate2 -- "Yes: 100% Matrix Parity" --> Phase3["Phase 3: The Cutover"]
    
    Phase3 --> Step3A["Delete @pandacss/* dependencies"]
    Phase3 --> Step3B["Delete .reference-ui/virtual/ & Parcel Mirror Worker"]
    Phase3 --> Step3C["Direct ref sync -> reference-system"]
    Phase3 --> Complete["PERMANENCE ACHIEVED:<br/>Single native binary, zero seams, instant sync"]
```

---

## 10. Phased Implementation Roadmap

### Phase 1: Clean Component Contracts (Immediate)
- Refactor `Tabs.tsx` and any internal library components away from unreadable runtime JSX ternaries to **Recipes (`cva`)** and DOM data attributes.
- Ensure all 117 Component Tests (CT) pass cleanly with zero inline `style={{ ... }}` hacks.
- This insulates `@reference-ui/lib` from Panda bugs immediately.

### Phase 2: Engine Scaffolding in `packages/reference-rs` (Isolated Branch)
- Restructure `packages/reference-rs` into a Cargo workspace with `crates/system`.
- Port `styletrace` into the core extraction pipeline.
- Implement the recursive leaf literal collector.
- Implement the token and rhythm resolver.
- Implement the atomic stylesheet emitter with `@layer` sorting.

### Phase 3: Matrix Validation & Pipeline Integration
- Wire `reference-core` sync events directly to `reference-system`.
- Run the full test suite via `pnpm agent test --packages=@matrix/css,primitives,recipe,spacing,responsive,system`.
- Iterate until all 26+ Playwright specs pass with 0 regressions.

### Phase 4: Deprecation & Cutover
- Delete `.reference-ui/virtual/` and remove `@parcel/watcher` and `piscina`.
- Remove `@pandacss/*` from `packages/reference-core/package.json`.
- Merge to `main`. Permanence achieved.

---

## 11. Turnkey Implementation Prompt

*When ready to execute Phase 2 and 3, copy and paste this prompt into an agent or development session:*

```markdown
# TASK: Build `reference-system` Native Styling Engine in `packages/reference-rs`

You are tasked with implementing `reference-system`, the native atomic CSS engine for Reference UI, replacing `@pandacss/*` and eliminating the `.reference-ui/virtual` filesystem seam.

### Context & Safety Net
1. Read `REFERENCE_SYSTEM.md` in the repository root for the full architectural specification.
2. The safety net is the matrix test suite under `matrix/` (26+ Playwright e2e specs covering CSS, primitives, recipes, spacing, responsive queries, and tokens across Vite and Webpack).
3. Do not break existing public APIs (`tokens()`, `font()`, `globalCss()`, `keyframes()`, `cva()`, `<Box>`, style props).

### Execution Steps

#### Step 1: Cargo Workspace Restructuring
1. Configure `packages/reference-rs/Cargo.toml` as a Cargo workspace with member crates:
   - `crates/tasty` (existing Tasty code)
   - `crates/atlas` (existing Atlas code)
   - `crates/system` (new styling engine)
2. Ensure `native/` builds the unified N-API binary exposing `@reference-ui/rust/system`.

#### Step 2: Engine Implementation (`crates/system`)
1. **Scanner (`extractor.rs`):**
   - Leverage `styletrace` (OXC-based) to identify style-bearing JSX tags and `css()` calls.
   - Implement `collect_leaf_literals` to recursively extract all string/numeric literals from nested ternaries and logical expressions without bailing.
2. **Resolver (`tokens.rs`, `rhythm.rs`, `shorthands.rs`):**
   - Port rhythm multiplier (`r` -> `px`), shorthands (`borderBottom` -> width, style, color), and token variable resolution (`ui.focus.ring` -> `var(--colors-ui-focus-ring)`).
3. **Emitter (`stylesheet.rs`):**
   - Emit atomic rules into `@layer reset, base, tokens, recipes, utilities`.
   - Implement deterministic class hashing/naming (`.bd-b_3px_solid` or short hashes).
   - Support responsive `@container` and `@media` queries.
4. **Runtime Helper:**
   - Export the exact same atom hashing algorithm to `@reference-ui/styled/css` so runtime `css()` and build-time CSS are 100% synchronized.

#### Step 3: Matrix Validation & Seam Removal
1. Update `packages/reference-core/src/sync` to invoke `reference-system` directly instead of spawning Panda Piscina workers.
2. Delete `.reference-ui/virtual/` generation and `@parcel/watcher` mirror logic.
3. Run `pnpm agent test --packages=@matrix/css,primitives,recipe,spacing,responsive,system`.
4. Iterate until all matrix tests pass 100%.
5. Remove `@pandacss/*` from `packages/reference-core/package.json`.
```
