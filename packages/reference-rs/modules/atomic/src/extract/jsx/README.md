# Extract / jsx

Finds StyleProps on JSX opening tags and hands each value to
`extract::expressions`.

```tsx
import { Div } from '@reference-ui/react'
<Div mt="2r" bg={on ? 'n300' : 'n100'} _hover={{ color: 'red' }} />
```

String attrs, expression containers, boolean props, spreads, `r={{…}}`,
and a `css={…}` attr are all JSX. Lowercase tags that are not hosts are
skipped silently. An empty host set admits nothing: style-bearing JSX with
no hosts resolvable is a missing-graph error (ATM-SITE-13), once per file.

## Which system a tag lowers under

The class belongs to the runtime that renders the tag, so the tag root's
provenance decides, never its name. The extract readme describes how an import
is followed to where it lands on disk.

- **Own host**: a component imported from `@reference-ui/react` /
  `@reference-ui/styled`, or a name the host roster admits (styletrace's
  traced wrappers). Its wants lower under this compile's system.
- **Package tag**: a root whose import ends at a package that published a
  system, directly or through project barrels, `tsconfig` aliases and
  same-file `const` aliases. `<Button>` from `@reference-ui/lib` or
  `acme-ui` renders through that package's bundled runtime, which mints
  the class under the package's own system, so it is never an own host,
  even when it spells a primitive. Its wants back under the systems the
  package renders through (its published `streams`) that this compile
  composes, and under no other.
- **Not a Reference component**: a root whose import ends at a package
  with no published system and no path to this compile's runtime, such as
  `<LucideIcon color="red" />`. Nothing lowers and nothing warns.
- **Anything else**: a project import, a same-file declaration or an
  unbound name the roster does not admit. An unbound name that a composed
  upstream publishes (`upstreamHosts`) backs under that upstream; the rest
  back under own, which is what they render if they forward at all.

The same gate decides whether a same-file wrapper threads its `css` prop
into a host. The analysis mirror (`diagnostics::analysis::jsx`) asks the same
`Composed`, so its expected keys name the systems extraction lowers under.

## ATM-W-EXTERNAL-UNBACKED

A package tag whose systems this compile does not compose cannot paint: the
package's runtime mints `acme__c_blue`, and nothing in this compile's sheet
backs it. Composing some other system does not help. The tag lowers under no
system and warns once, at the tag, with the package, its system and the fix:

```text
message: style props on <AcmeCard> will not paint: 'acme-ui' renders through its own system 'acme', and no system in `extends` or `layers` backs it
help:    add 'acme-ui/baseSystem' to `extends` or `layers` in ui.config
```

The package name drops any subpath (`@reference-ui/lib/primitives` names
`@reference-ui/lib`) and follows same-file `const` aliases. A published
system that cannot be read warns too, naming the package and why. A
same-file wrapper whose `css` prop forwards into a package tag warns at
each call site that sets `css`. Own, project and unbound tags never warn,
and neither does a tag whose props its owner keeps or a package not built
on Reference UI.

The warning is decided here, where the tag's span and the composed systems
both are; assembly passes it through.

## Must not

- Choose values (expressions).
- Guess primitives by PascalCase or a config name array.
- Reimplement wrapper tracing — that is styletrace.
