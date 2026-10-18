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

Ownership comes from the tag root's provenance, not its name. A root
whose import ends at an installed package (directly, or through project
barrels and `tsconfig` aliases) is never an own host, even when it spells
a primitive or an upstream's published wrapper: `<Button>` from
`@reference-ui/lib`, `acme-ui` or any other package renders through that
package's bundled runtime and mints its class, so it takes the external
path like any capitalized non-host. Reference imports are own by proof;
project imports, same-file declarations and unbound names keep the host
roster match. The same gate decides whether a same-file wrapper threads
its `css` prop into a host.

## Must not

- Choose values (expressions).
- Guess primitives by PascalCase or a config name array.
- Reimplement wrapper tracing — that is styletrace.
