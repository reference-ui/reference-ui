# Breakpoints Presets

## Research Summary

- There is no `breakpoints()` fragment collector in source today.
- `r` is currently implemented as a container-query pattern prop that turns inline numeric keys into `@container (min-width: Npx)` rules.
- The generated styled system does already contain breakpoint tokens and keys such as `sm`, `md`, `lg`, `xl`, and `2xl`.
- Those breakpoint tokens appear to be used by the styled-system breakpoint utilities such as `hideBelow` and `hideFrom`, not by `r`.

## Current Behavior

Today the `r` API expects inline container widths, not named presets:

```tsx
<Box
    r={{
        320: { padding: '2' },
        768: { padding: '4' },
    }}
/>
```

This compiles to container queries, not viewport media queries.

Named breakpoint tokens exist elsewhere in the system:

```ts
breakpoints.sm
breakpoints.md
breakpoints.lg
breakpoints.xl
breakpoints.2xl
```

The default generated values are currently:

- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`
- `2xl`: `1536px`

## What This Means

The proposed shape below is not implemented today:

```ts
r: {
    sm: {},
    md: {},
    xl: {},
}
```

Adding it would be a new aliasing layer on top of the existing `r` transform.

## Recommendation

If we add breakpoint presets, they should be treated as a convenience layer, not the primary responsive model.

Reasons:

- Reference UI's main responsive story is container-first, not viewport-breakpoint-first.
- `r` currently works because it is explicit and local to the component.
- Reusing named breakpoint presets inside `r` would need a clear rule for where those names come from and whether they are viewport tokens, container tokens, or simple width aliases.

## Open Design Questions

- Should preset names for `r` come from `tokens({ breakpoints: ... })`, or from a separate `breakpoints()` collector?
- Should `r.sm` mean `640px` exactly, or just alias whatever the project config maps `sm` to?
- Should these presets also power `hideBelow` and `hideFrom`, or stay separate from container-query behavior?
- Do we want named presets only as sugar, while keeping numeric widths as the canonical form?