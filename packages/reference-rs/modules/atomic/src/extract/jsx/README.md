# Extract / jsx

Finds StyleProps on JSX opening tags and hands each value to
`extract/expressions`.

```tsx
import { Div } from '@reference-ui/react'
<Div mt="2r" bg={on ? 'n300' : 'n100'} _hover={{ color: 'red' }} />
```

String attrs, expression containers, boolean props, spreads, `r={{…}}`,
and a `css={…}` attr are all JSX. Tags extract when they are in the
styletrace name set or imported from `@reference-ui/react` /
`@reference-ui/styled`. An empty host set admits nothing: style-bearing
JSX with no hosts resolvable is a missing-graph error (ATM-SITE-13),
once per file. Once any host is known, other tags (including local
`<Foo mt="2r" />`) are skipped silently.

A name imported from a package that ships its own runtime
(`@reference-ui/lib`, its `/primitives`, `@reference-ui/icons`) is never
an own host, even when it spells a primitive: `<Button>` from lib mints
lib's class, so it takes the external path like any capitalized non-host.

## Must not

- Choose values (expressions).
- Guess primitives by PascalCase or a config name array.
- Reimplement wrapper tracing — that is styletrace.
