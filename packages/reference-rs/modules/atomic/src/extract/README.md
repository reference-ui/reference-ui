# Extract

Finds style-bearing source and inserts **wants**.

Find the host, then walk the expression. Mixing those is how you
accidentally write a JS evaluator.

1. **jsx / css / recipes** — *where*: StyleProps on tags, `css()`,
   `recipe()`. Styletrace answers which tags keep StyleProps; the tag
   root's import provenance answers which runtime renders them. `css()`
   and `recipe()` extract only when the callee is the Reference import.
2. **expressions** — *what’s inside*: each literal is a want. Both
   branches of a ternary are two wants. `undefined` is none. Do not
   eval `isSelected`.

`constants` is a lookup index for file-top `const` literals, not a
fourth host.

Does not print CSS. Does not name classes. Does not hash a whole object.

## Whose class

The class belongs to the runtime that renders the tag; the value belongs to
the file that writes it. Every want resolves in this compile's vocabulary,
and each carries a **backing**: own, or the systems a package's runtime
mints its class under.

`bindings` records every import's provenance, so extract can fail closed
on shadowed `css` and untraced JSX. A bare specifier is followed to where it
lands on disk, as Node would: `tsconfig` paths, then each ancestor
`node_modules`, canonicalised through symlinks. Where it lands decides what
it is:

- **This compile's sources**: project code, and the identity walk continues
  through it. A workspace package that one sync spans is the app's own,
  even when it is imported by its package name, unless that package
  published a system of its own.
- **A package that published a system** (`exports["./baseSystem"]`, else
  `.reference-ui/system/baseSystem.mjs`): that package, rendering through
  its system. `package_system` reads the system's `name` and
  `streams[].name` and nothing else, on first demand, once per file and
  mtime.
- **A linked workspace directory that is Reference code for this app**:
  project code, since it renders the same runtime. It is Reference code when
  this compile's include set reaches into it, or when it uses
  `@reference-ui/react` (its manifest depends on it, or a root entry imports
  it) and that specifier, climbing from the directory, lands where this sync
  links its runtime. The landing is read without the generated runtime, so
  the first sync agrees with every later one; a linked package that never
  uses the runtime (a plain icon or utils package) is not Reference code
  however the specifier would resolve from it (`own_runtime`).
- **Anywhere else, or nowhere**: a package not built on Reference UI.

Resolutions memoize per importing directory and specifier. `provenance`
turns the answer into the one host gate the JSX walk and the
`css`-threading pre-pass share, and `backing` decides what a styled tag
no host admits lowers under:

| The tag root ends at | Backing |
| --- | --- |
| A Reference import, or a name the host roster admits | Own |
| A package that published a system | The package's stream names this compile composes (`extends`, `layers`). None composed: no system, and `ATM-W-EXTERNAL-UNBACKED` at the tag (see the `jsx` pass) |
| A package not built on Reference UI | Nothing, and no diagnostic |
| An unbound name a composed upstream publishes (`upstreamHosts`) | That upstream |
| Any other project or unbound name | Own |

A package's stream names, not just its name, are the backing because a
package can render another's runtime: lib re-exports icons, so a lib tag
backs under `reference-ui` and `reference-icons`. Composing some other
system never backs a package tag; only the package's own systems do.

## Example (Panda)

Panda's JSX, call, and matcher modules are their “where”. Ours are named after the author API.
Their evaluator is the one to walk like, not fold like. See PANDA.

## Must not

- Emit CSS or evaluate user code.
- Decide a tag's backing by its spelling. A package import is external
  even when it spells a primitive or an upstream's published wrapper, and
  a workspace package this compile spans is own even under a package name.
- Back a package tag under a system the package does not render through.
- Build a TypeRef-shaped tree.
- Group wants into a hashed rule because they sat on one host.
