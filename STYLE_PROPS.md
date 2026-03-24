# StyleProps: design direction and architecture

This document captures agreed direction for Reference UI’s **styling surface**: one vocabulary for `css()`, recipes (`cva` / `recipe`), and style-related props on primitives (`Div`, etc.).

## Goals

1. **Single conceptual type** — Prefer **`StyleProps`** as the name that describes Reference UI’s style object in one place. Long term, **`StyleProps` and a separate `SystemStyleObject` need not remain distinct public concepts**; Panda may still generate a low-level type internally, but authors should think in terms of **`StyleProps`** only.

2. **Same surface everywhere** — What you pass into **`css()`**, **`cva` / `recipe`** (base, variants, compound variants), and **JSX primitives** should use the **same** style keys and semantics. No “Panda shape for `css`” vs “Reference shape for components.”

3. **`colorMode` is out of scope for that rule** — It exists to define a **theme boundary at a DOM node**. It is **not** a CSS declaration and does **not** belong inside `css({ ... })` or recipe style objects. Keep it as a **component-level prop** separate from the unified style object.

## How features map today (and where they’re going)

| Concern | Direction |
|--------|-----------|
| **`container`**, **`font`**, **`weight`** | Strong candidates for **Panda utilities** (or equivalent first-class config): config-driven, token-aligned, shared by **`css()`** and JSX. |
| **`r`** (responsive / container-query nesting) | **Trickier** — not a single atomic utility; treat as **sugar** that **lowers** to Panda’s approved style shape (e.g. conditions, nested objects). Likely a **transform** (see below) plus runtime alignment with existing box-pattern semantics. |

## Pipeline boundaries

### `system/panda` (config + codegen)

- Owns **Panda config** (fragments, tokens, themes, **box pattern** extensions, etc.).
- Today, **`r`**, **`container`**, **`font`**, **`weight`** are implemented partly via **pattern extensions** (`extendPatterns`) for the box pattern.
- Moving **`container`** and **font/weight** toward **utilities** should unify typings with **`StyleProps`** and reduce the need for **`Omit<…>`** + parallel **`ReferenceProps`** for those keys.

### `system/css` (post-Panda stylesheet)

- Owns **post-Panda** CSS: portable layers, token rescoping, `[data-layer]`, assembly with upstream CSS.
- **Does not** interpret style object keys like **`r`** or **`font`**; changes there follow **emitted CSS shape**, not author object shape.

### Virtual postprocessing (`reference-rs` / `virtualrs`)

- Today: **import rewrites** only (e.g. `css` / `cva` imports from `@reference-ui/react` → canonical styled-system paths), using **Oxc** in Rust; see `packages/reference-rs/src/virtualrs/README.md`.
- **Future**: optional **lowering of `css({ ... })` bodies** so Panda’s extractor sees **idiomatic, statically understandable** style objects. Same semantic rules as the box pattern; **virtual** is a reasonable place to ensure **Panda sees what it needs** before codegen/extraction.

**Why Rust here:** colocated with the N-API layer, fast Oxc-based parse/rewrite, Rust-first unit tests. Heavier **`r`** lowering could stay in Rust or move to TS depending on reuse and team constraints; the **contract** is “output Panda can extract,” not the language per se.

## Extraction constraint

Panda’s static pipeline must see style expressions it can resolve. **Runtime-only** wrappers that hide structure from the AST will **not** replace **transform-time** or **config-time** clarity for extraction. Any unified **`StyleProps`** story must keep **authoring**, **types**, **runtime**, and **extractor** aligned.

## Related source (pointers)

- `packages/reference-core/src/types/style-props.ts` — current `StyleProps` definition.
- `packages/reference-core/src/types/system-style-object.ts` — Panda `SystemStyleObject` + strict colors.
- `packages/reference-core/src/types/props.ts` — `ReferenceProps` (includes `colorMode` separately from pure style keys in spirit).
- `packages/reference-core/src/system/panda/config/extensions/` — pattern extensions (`r`, `container`, font helpers).
- `packages/reference-core/src/system/css/public.ts` — public `css` delegate and types.
- `packages/reference-rs/src/virtualrs/` — virtual import rewrites.

---

*This file is a design snapshot; implementation order should follow tickets and tests (including `reference-unit` and extractor smoke tests) as the surface converges.*
