# Responsive

## Research Summary

- `r` is already implemented as a public responsive API.
- It is container-first, not viewport-first.
- It is wired through the box pattern / primitive layer.
- It supports named containers via the companion `container` prop.
- It is covered by end-to-end tests for anonymous and named containers.

## Current Behavior

The current `r` shape is:

```tsx
<Box
	r={{
		320: { padding: '2' },
		768: { padding: '4' },
	}}
/>
```

`r` transforms numeric keys into container queries:

```css
@container (min-width: 320px) { ... }
@container (min-width: 768px) { ... }
```

Named containers are also supported:

```tsx
<Box container="sidebar">
	<Box r={{ 240: { padding: '3', bg: 'blue.600' } }} />
</Box>
```

That becomes a named container query against `sidebar`.

## Where `r` Works Today

`r` is part of the higher-level Reference UI prop surface used by primitives.

It also exists on the generated box pattern surface.

That means the current implementation is best described as:

- supported on primitives
- supported on box-pattern styling
- not part of the raw `css()` style-object surface today

## Answer To The Main Question

`r` does not look like a generic `css()` utility today.

The current implementation is a pattern-level transform, not a base style-object utility. So if the goal is to make this work in `css({ ... })` directly, that would be a new extension path rather than just reusing the current one.

## Recommendation

Keep `r` as the standard responsive surface for primitives and box-pattern usage.

If we also want this to work in `css()`, treat that as a separate feature:

- current feature: pattern prop that emits container queries
- possible future feature: style-object utility that allows `css({ r: ... })`

That separation matters because the current implementation is already coherent and tested.

## Open Design Questions

- Do we actually need `css({ r: ... })`, or is primitive / box coverage enough for the intended authoring flow?
- If we add `r` to `css()`, should it share exactly the same object shape and transform rules?
- Should `css({ r: ... })` stay container-first only, or also support named presets later?
- Is numeric inline width the canonical form, with any future preset support layered on top?

