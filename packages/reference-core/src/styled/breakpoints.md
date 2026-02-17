# Breakpoints vs container-responsive: design report

## The tension

We have (or plan) two ways to do “responsive” in the styled system:

1. **Viewport breakpoints** – Panda’s `sm`, `md`, `lg`, `xl`, `2xl` and a possible `breakpoints()` API to customize them. Styles key off *screen width* via `@media (min-width: …)`.
2. **Container queries** – The `container` prop plus the `r` prop. Styles key off *the element’s container width* via `@container (min-width: …)`.

Having both can feel like two overlapping API surfaces for “responsive.” This document lays out what each does, when each is appropriate, and whether we should add `breakpoints()` or double down on container-based responsiveness.

---

## What we have today

### Container + `r` (container queries)

- **`container`** (`props/container.ts`) – Marks the element as a query container: `container-type: inline-size`, optional `containerName` for named `@container sidebar (...)`.
- **`r`** (`props/r.ts`) – Accepts an object keyed by **numeric pixel widths**. Produces container conditions: `@container (min-width: 400px)` (or `@container sidebar (min-width: 400px)` when a name is set).

So `r` is **container-relative responsive**: “when *this* component’s container is this wide, apply these styles.” Same `r` definition can be used in a narrow sidebar or a wide main area; behavior follows the container, not the viewport.

### Viewport breakpoints (Panda built-in)

- Panda ships with five breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.
- Used via: `lg: { fontWeight: 'bold' }`, `fontWeight: { base: 'medium', lg: 'bold' }`, array syntax, `mdToXl`, `lgOnly`, etc.
- All of these generate `@media (min-width: …)` – i.e. **viewport**-based.

There is no `breakpoints()` API yet; we only have the plan to add one so apps can extend or override those defaults (e.g. add `3xl`, or change the px values).

---

## Viewport vs container: different axes

| | Viewport breakpoints | Container (`container` + `r`) |
|--|----------------------|-------------------------------|
| **Responds to** | Screen / viewport width | Width of the query container |
| **CSS mechanism** | `@media (min-width: …)` | `@container (min-width: …)` |
| **Scope** | Global (one “breakpoint set” per page) | Per component (each container has its own width) |
| **Good for** | Layout chrome (nav, sidebar in/out), page-level typography, max-width of main content, “mobile vs desktop” layout | Components that reflow by *their* size: cards, sidebars, modules that work in different column widths |
| **In our API** | Panda’s `lg:` etc.; possible `breakpoints()` to customize | `container` + `r` only |

So they are not two ways to do the same thing. One is “when the **screen** is this big”; the other is “when **this component’s container** is this big.”

---

## Why it still feels odd

- **Naming** – “Responsive” usually means “viewport breakpoints” to most people. So we have “responsive” (viewport) and “also responsive but by container” (`r`), which can sound like two competing strategies.
- **Two syntaxes** – Viewport: `lg: { … }` or `{ base: 'x', lg: 'y' }`. Container: `r: { 400: { … }, 600: { … } }`. Different shapes, different units (names vs raw px). No single “responsive prop” that works for both.
- **Philosophy** – If the design system wants to push “component-relative layout” and container queries as the default, viewport breakpoints can look like the old world we’re not supposed to lean on. Then adding a first-class `breakpoints()` API might feel like endorsing the thing we’re trying to move away from.

So the unease is real: not that the two mechanisms are technically redundant, but that we’re maintaining and possibly expanding *two* responsive surfaces instead of one clear story.

---

## Case for including `breakpoints()`

1. **Panda already has viewport breakpoints** – They’re there. Every `lg:`, `mdToXl`, responsive array, etc. uses them. A `breakpoints()` API doesn’t add a second system; it only lets apps **customize** that system (different values, extra names like `3xl`).
2. **Some decisions are inherently viewport-based** – “Show hamburger menu below 768px,” “max-width of main content at 1280px,” “root font size steps by viewport.” Those are about the window, not a random container. For those, container queries are the wrong tool (or require wrapping the whole viewport in a named container and then we’re just re-implementing viewport with more indirection).
3. **Low cost** – Same pattern as `keyframes()`: one small API that calls `extendPandaConfig({ theme: { extend: { breakpoints } } })`. No new concepts, no microbundle.
4. **Familiarity** – Teams expect to tune breakpoints. Not having a way to do it (or having to touch raw Panda config) is a gap.

So: viewport breakpoints are already part of the stack; `breakpoints()` is a thin, consistent way to own their values instead of leaving them as Panda’s defaults only.

---

## Case for *not* pushing breakpoints (or keeping them minimal)

1. **Container-first story** – We already have a clear, elegant story: `container` + `r`. “Responsive by container width, with numeric widths.” Adding a parallel “and here are viewport breakpoints” dilutes that. We could document viewport usage as “when you really need the viewport” and avoid a dedicated `breakpoints()` API so the default mental model stays “use `r` and containers.”
2. **Fewer knobs** – If we don’t add `breakpoints()`, apps that need custom viewport breakpoints can still set them in Panda config (or we document that once). That keeps our API surface smaller and one “responsive” path (container + `r`) more prominent.
3. **Avoid two canonical scales** – With `breakpoints()`, we risk defining a “design system viewport scale” (sm/md/lg/…) that lives alongside the numeric container widths in `r`. Then we have “which one do I use?” and “do I need both?” A single primary mechanism (container + `r`) avoids that.

So: we could treat viewport as an escape hatch, keep our first-class API surface focused on container + `r`, and not add `breakpoints()` unless we see real demand.

---

## Summary

- **Viewport breakpoints** and **container + `r`** answer different questions (screen size vs container size). They’re complementary, not duplicates.
- The “odd” part is having two responsive *surfaces* and two syntaxes, and the risk of unclear guidance (“use breakpoints for layout, use `r` for components” vs “prefer `r` everywhere”).
- **Including `breakpoints()`**: Acknowledges that viewport breakpoints are already in use and gives a single, consistent way to customize them. Small API, matches existing theme-extension pattern.
- **Skipping or downplaying `breakpoints()`**: Keeps the main story “container + `r`,” viewport as advanced/Panda-native. Simpler mental model and smaller surface; custom viewport breakpoints stay in config or one-off docs.

Recommendation is not decided here: both are coherent. The open choice is whether we want viewport breakpoints to be a **first-class tuned part of the system** (`breakpoints()` + docs) or an **available but secondary** path (Panda’s defaults + config when needed, with docs that steer people toward `container` + `r` for component-level responsive).
