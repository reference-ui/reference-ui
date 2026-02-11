# Reference UI
A compile-time, opinionated UI system with first-class documentation generation.

---

## Welcome
Orientation only. No deep API. No theory dumps.

### Introduction
- What Reference UI is
- What problems it solves
- What it intentionally does *not* try to solve
- Who this system is for

### Getting Started
- Installation
- First `reference sync`
- Minimal working example
- Mental model: compile-time first, no runtime magic

### Customisation
- Overriding tokens (conceptual)
- Opting in/out of the built-in design system
- Extending safely
- Boundaries of supported customisation
- Pointer to System + CLI docs for full details

---

## Reference
Operational, tooling, and lifecycle documentation.

### CLI
- What the Reference CLI is
- Mental model: compiler + orchestrator (not a dev server)
- Where configuration is read from
- What the CLI owns vs what it delegates
- Exit codes and failure modes

#### `reference sync`
- What it does
- When and why to run it
- Watch mode
- What gets generated
- What gets overwritten
- What is intentionally preserved

#### Other Commands
- Diagnostics / validation commands
- Future CLI surface (non-MVP)

### API Documentation
- How API docs are generated
- Static analysis model
- What is inferred vs authored
- Guarantees: no drift, deterministic output

### MCP Server
- What MCP is
- What it exposes
- Machine-consumable documentation
- IDE / tooling integration use cases

---

## System
The **programming model** exposed by Reference UI.

### Primitives
- Typed HTML primitives (`Div`, `A`, etc.)
- React-first API
- No `Box`, no `Text`, no `as`
- Why primitives exist
- Relationship to style props

### Style Props
- What style props are
- How they map to CSS
- Compile-time CSS generation
- Constraints and invariants
- Why some CSS features are intentionally unsupported

### Tokens
- Token categories
- How tokens resolve
- CSS variable output
- Overriding and theming strategy


### `css()`
- Low-level styling utility
- When it is appropriate
- When it is discouraged
- Relationship to style props


### Recipes
- What recipes are
- When to use recipes vs style props
- Variant discipline
- Design intent behind recipes

### Responsive Styles
- Responsive system overview
- Container-query-based model
- `r()` utility
- Supported responsive patterns
- What is intentionally unsupported


### Light & dark
- Single mechanism: class-based `.dark` / `.light` on a root (e.g. `<html>`); no `_osDark` / `_osLight` — drive theme from JS (e.g. read `prefers-color-scheme`, set class).
- `colorModeStyles()`: small helper that takes `{ base?, light?, dark? }` and returns one style object with `_dark` / `_light` set. Use the same helper in both `cva()` recipe base/variants and `css()` so adding or extending light/dark is consistent and minimal.
- Extending: spread the result and override or add keys as needed in your recipes and `css()` calls.

### Keyframes
- Why keyframes are system-level
- `keyframes()` API
- Naming and reuse rules
- Where keyframes should live

### Selectors & States
- Pseudo-selectors
- State selectors
- Supported selector patterns
- What is intentionally unsupported

> This section is a **one-stop shop**.  
> Users should never need to read Panda docs.

---

## Foundations
The visual and semantic base of the system.

### Colors
- Slate (the single neutral)
- Magenta (high-chroma accent)
- Any other provided colors
- Intended usage and constraints

### Design System
- Reference UI factory design system
- Default tokens
- Opinionated choices
- What can be overridden
- What is intentionally fixed

### Typography
- HTML-based typography
- Themed semantic tags
- Why there is no `Text` component
- Typography tokens

### Icons
- Icon philosophy
- Bundled icon sets
- Usage patterns
- Bringing your own icons

---

## Layout
The canvas on which systems are built.

### Row
- Horizontal flow
- Wrapping rules
- Alignment and spacing

### Stack
- Vertical flow
- Gap handling
- Responsive spacing using `r`

### Grid
- When to use grid
- Grid constraints
- Responsive grids with `r`

### Responsive Layout
- Applying responsive styles in layout
- Real-world patterns
- Teaching `r` through examples

---

## Inputs (Future)
Not part of MVP.

- Text input
- Checkbox
- Select
- Status and roadmap notes

---

## Appendix
Supporting material and long-term context.

### Design Principles
- Opinionated defaults
- Compile-time first
- Small surface area
- No runtime magic

### FAQ
- Common questions
- Common misconceptions

### Changelog
- Breaking changes
- Migration notes
