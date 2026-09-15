# Container Queries

This note captures a direction decision for Reference UI:

- **container queries should be the primary responsive primitive**
- viewport-width breakpoints should **not** define the future-facing public styling surface

This is partly a product decision and partly a sanity check.

---

## The short version

Yes, this is a sane direction.

For a component-oriented system, container queries are usually the better abstraction:

- they scale with composition
- they respond to the actual space a component gets
- they avoid coupling a component to page-wide assumptions
- they make reusable components easier to reason about

So if your instinct is:

> "container queries are the way to go"

that is a defensible and, in many cases, forward-looking position.

---

## Why container queries feel more correct

Viewport queries answer:

> "How big is the screen?"

Container queries answer:

> "How much space does this component actually have?"

For a design system or component library, the second question is usually the right one.

Most reusable components do not really care about the full viewport. They care about:

- whether they are in a narrow rail
- whether they are inside a card grid
- whether they are rendered in a sidebar
- whether the parent layout only gives them 240px

That is exactly what container queries are good at.

Viewport breakpoints become awkward quickly because they encode page-level assumptions into component logic.

That tends to produce components that work well in one layout and get weird in another.

---

## Why this matters for Reference UI

Reference UI is trying to own the authored styling experience, not just the implementation underneath.

That means the public API should guide users toward the system Reference UI actually believes in.

If the long-term belief is:

- responsive behavior should be local
- composition should win over page-level assumptions
- reusable primitives should adapt to their container

then the public style types should reflect that.

In practice that means:

- container-query conditions should be first-class
- container-aware responsive objects should be first-class
- viewport breakpoint keys should not be treated as the main public model

Otherwise the public surface bakes in a direction the system does not want to preserve.

---

## Sanity check

The strongest version of your position is sound **for a component library**.

That said, there are a few important caveats.

### 1. Container queries are a great default, not magic

Container queries solve the "component in context" problem very well.
They do not automatically solve every responsive concern.

There are still cases where app-level layout decisions exist above the component boundary.

Examples:

- top-level shell changes
- route/layout swaps
- whole-page density changes
- navigation mode switches at the app frame level

Those are not arguments against container queries.
They just mean "component responsiveness" and "application layout decisions" are not the same thing.

### 2. Not all media features are bad

It is useful to separate:

- **viewport width breakpoints**

from:

- `prefers-reduced-motion`
- `prefers-contrast`
- `hover`
- `pointer`
- `forced-colors`
- color-scheme-like capabilities

Those are still valuable signals.

So the strong position should probably be:

- avoid viewport-width breakpoints as the primary responsive API
- keep other meaningful environment/media features where they make sense

### 3. Escape hatches may still be useful

Even if Reference UI is container-query-first, there may still be a case for:

- private/internal viewport helpers
- low-level escape hatches
- app-shell-level layout APIs outside the core component style object

The important distinction is:

- what is the **default public styling model**
- versus what is still technically possible somewhere lower in the stack

You do not need to make viewport queries a first-class userland abstraction in order to leave room for exceptional cases.

---

## Practical guidance

If Reference UI wants to commit to this direction, a good implementation strategy would be:

### Public API

- make container-query conditions the main responsive surface
- avoid exposing viewport breakpoint keys as first-class style-object keys
- shape `SystemStyleObject` around local/container responsiveness

### Documentation

- teach responsive styling through container examples, not viewport examples
- explain responsiveness in terms of available component space
- document viewport-width breakpoints, if at all, as an escape hatch rather than the core model

### Internals

- keep backend flexibility
- do not let Panda's current condition model dictate the long-term public contract
- treat container-query-first semantics as a Reference UI decision, not a backend artifact

---

## What this means for `SystemStyleObject`

If Reference UI really wants to futureproof the system, this should show up in the types.

That means `SystemStyleObject` should ideally:

- model container-query conditions directly
- model container-aware responsive object shapes directly
- avoid forcing users into `sm` / `md` / `lg` viewport-thinking if that is not the direction of the product

This matters because type surfaces are sticky.

If users learn:

- "responsive means viewport breakpoints"

then the product will be dragged back toward that model even if the internals evolve.

If users learn:

- "responsive means container context"

then the authored surface and the implementation direction stay aligned.

---

## Recommended position

The recommendation would be:

- **container-query-first** should be the official direction
- viewport-width breakpoints should **not** define the main public styling model
- other media/environment features can still exist where they solve real problems
- app-shell layout decisions should be treated separately from component responsiveness

That gives you a position that is opinionated without being naive.

---

## Final sanity check

If Reference UI is primarily building a future-facing component and styling system, then:

- yes, container queries are very likely the right long-term primitive
- yes, it makes sense to shape the public API around them
- no, this does not mean every media feature disappears
- no, this does not mean application-level layout stops existing

The clean version of the belief is:

> For reusable components, responsiveness should be based on container context, not viewport assumptions.

That is a strong and sensible design principle to build around.
