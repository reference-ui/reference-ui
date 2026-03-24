# Style surface: design direction and architecture

This document captures agreed direction for Reference UI’s **styling surface**: one vocabulary for `css()`, recipes (`cva` / `recipe`), and style-related props on primitives (`Div`, etc.).

## Goals

1. **Single conceptual type** — One public name for the **style object** Reference UI authors use everywhere. Long term, a separate user-facing **`SystemStyleObject`** need not exist; Panda may still generate a low-level type internally (today that role is partly filled by codegen’d `SystemStyleObject`), but the **authoring type** should be singular.

2. **Same surface everywhere** — What you pass into **`css()`**, **`cva` / `recipe`** (base, variants, compound variants), and **JSX primitives** should use the **same** style keys and semantics. No “Panda shape for `css`” vs “Reference shape for components.”

3. **`colorMode` is separate from this surface** — It is not a styling key; it **selects theme scope at a DOM boundary** (where the subtree is interpreted as light/dark/etc.). It lives on **components** as its own prop, **not** inside `css({ ... })`, recipe bodies, or the unified style object. That keeps **pure styling** (the object you pass to `css` / recipes / `Div`) one coherent thing, and **theme boundary** a distinct concern.

## Naming: `StyleProps` vs `StyleObject`

There is **no strong reason** not to use **`StyleObject`** (or **`ReferenceStyleObject`** if you want a fully qualified public name) as the exported type for that unified shape:

- **`StyleObject`** matches what it is: a **plain object** passed to `css({ ... })`, `cva({ ... })`, and style spreads — the same “style object” language Panda and styled-system docs use.
- **`StyleProps`** reads well for JSX (`<Div padding="4" />`) because those are component **props**, but for **`css()`** the value is not a “prop” in the React sense; **`StyleObject`** is slightly more accurate for the whole API surface.

Reasons you might keep **`StyleProps`** anyway: existing exports and docs, or emphasis on “the props object accepted by primitives.” Either name works; pick one and use it consistently. Internal codegen may retain something like **`SystemStyleObject`** as the Panda-backed layer until the public type fully subsumes it.

## How features map today (and where they’re going)

| Concern | Direction |
|--------|-----------|
| **`container`**, **`font`**, **`weight`** | Strong candidates for **Panda utilities** (or equivalent first-class config): config-driven, token-aligned, shared by **`css()`** and JSX. |
| **`r`** (responsive / container-query nesting) | **Trickier** — not a single atomic utility; treat as **sugar** that **lowers** to Panda’s approved style shape (e.g. conditions, nested objects). Likely a **transform** (see below) plus runtime alignment with existing box-pattern semantics. |

## Pipeline boundaries

### `system/panda` (config + codegen)

- Owns **Panda config** (fragments, tokens, themes, **box pattern** extensions, etc.).
- Today, **`r`**, **`container`**, **`font`**, **`weight`** are implemented partly via **pattern extensions** (`extendPatterns`) for the box pattern.
- Moving **`container`** and **font/weight** toward **utilities** should unify typings with the public **style object** type and reduce the need for **`Omit<…>`** + parallel **`ReferenceProps`** for those keys.

### `system/css` (post-Panda stylesheet)

- Owns **post-Panda** CSS: portable layers, token rescoping, `[data-layer]`, assembly with upstream CSS.
- **Does not** interpret style object keys like **`r`** or **`font`**; changes there follow **emitted CSS shape**, not author object shape.

### Virtual postprocessing (`reference-rs` / `virtualrs`)

- Today: **import rewrites** only (e.g. `css` / `cva` imports from `@reference-ui/react` → canonical styled-system paths), using **Oxc** in Rust; see `packages/reference-rs/src/virtualrs/README.md`.
- **Future**: optional **lowering of `css({ ... })` bodies** so Panda’s extractor sees **idiomatic, statically understandable** style objects. Same semantic rules as the box pattern; **virtual** is a reasonable place to ensure **Panda sees what it needs** before codegen/extraction.

**Why Rust here:** colocated with the N-API layer, fast Oxc-based parse/rewrite, Rust-first unit tests. Heavier **`r`** lowering could stay in Rust or move to TS depending on reuse and team constraints; the **contract** is “output Panda can extract,” not the language per se.

## Extraction constraint

Panda’s static pipeline must see style expressions it can resolve. **Runtime-only** wrappers that hide structure from the AST will **not** replace **transform-time** or **config-time** clarity for extraction. The unified **style object** story must keep **authoring**, **types**, **runtime**, and **extractor** aligned.

## Related source (pointers)

- `packages/reference-core/src/types/style-props.ts` — current `StyleProps` definition (candidate rename to `StyleObject` or similar per above).
- `packages/reference-core/src/types/system-style-object.ts` — Panda `SystemStyleObject` + strict colors.
- `packages/reference-core/src/types/props.ts` — `ReferenceProps` (`container`, `r`, font / weight); `ColorModeProps` (`colorMode`) is defined separately for DOM theme boundaries.
- `packages/reference-core/src/system/panda/config/extensions/` — pattern extensions (`r`, `container`, font helpers).
- `packages/reference-core/src/system/css/public.ts` — public `css` delegate and types.
- `packages/reference-rs/src/virtualrs/` — virtual import rewrites.

---

*This file is a design snapshot; implementation order should follow tickets and tests (including `reference-unit` and extractor smoke tests) as the surface converges.*
