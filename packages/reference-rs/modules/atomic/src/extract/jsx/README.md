# Extract / jsx

Finds StyleProps on JSX opening tags and hands each value to
`extract/expressions`.

```tsx
import { Div } from '@reference-ui/react'
<Div mt="2r" bg={on ? 'n300' : 'n100'} _hover={{ color: 'red' }} />
```

String attrs, expression containers, boolean props, spreads, `r={{…}}`,
and a `css={…}` attr are all JSX. A tag lowers one of three ways. An own
host (a styletrace name, or a component imported from
`@reference-ui/react` / `@reference-ui/styled`) lowers its wants under
the app's system. Any other capitalized tag, a local `<Foo mt="2r" />`
or a package's `<Button>`, is an external component: its wants lower
with `external: true` and the consumer backs them under every composed
system. Lowercase tags that are not hosts are skipped silently. An empty
host set admits nothing: style-bearing JSX with no hosts resolvable is a
missing-graph error (ATM-SITE-13), once per file.

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

A package's classes paint only when the consumer composes that package's
system (`extends` / `layers`): each composed upstream becomes a qualifier
the external wants fan out under. With none composed, nothing can back
them, so a package-bound tag that lowers a style want reports
`ATM-W-EXTERNAL-UNBACKED` once, at the tag, naming the package (subpath
dropped, `const` aliases followed) and the fix: compose its baseSystem.
A same-file wrapper whose `css` prop forwards into a package-bound tag
reports it at each call site that sets `css`. Extraction cannot see the
composed systems, so assembly keeps the line only when there is no
foreign qualifier. Own, project and unbound tags never report it, and
neither does a tag whose props its owner keeps.

## Must not

- Choose values (expressions).
- Guess primitives by PascalCase or a config name array.
- Reimplement wrapper tracing — that is styletrace.
