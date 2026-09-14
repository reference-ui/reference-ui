# Resolve / r

The `r` prop: numeric or named keys become `@container (min-width: Npx)`
wrappers around nested styles.

```tsx
<Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />
```

Numeric keys are language. Named widths (`md` → 768) are utterances from
`tokens({ breakpoints })`, ingested in `config/breakpoints.rs`. Defaults
exist only as a CSS-generic starting table (`sm` → 640px).

Extract walks the object and asks this module for the query string.
Conditions ask the same function when a condition token is a
breakpoint key. This folder does not own `_hover` or `@media`.

## Must not

- Copy a rem viewport dictionary next to canon.
- Treat unknown names as passthrough. Fail closed (diagnostic / None).
