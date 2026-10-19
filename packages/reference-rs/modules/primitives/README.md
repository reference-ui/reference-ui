# Primitives Module

One way to generate primitives. Canon owns the element roster, typegen owns
the prop names; this module joins the two authorities into committed artifacts
and adds zero new authority of its own. The only judgment it encodes is the
case family grouping, pinned by the golden test.

## Source

The element roster joins the canon TS overlay partition (HTML vs SVG)
with the generated Rust `ELEMENTS`/`PRIMITIVE_JSX` tables. The overlay
selects the namespace, the Rust tables supply the JSX spellings (including the
`Obj`/`Var` escapes), and the join fails closed on any drift between them.

Per the namespace law, the vocabulary carries exactly the 101
HTML-namespace elements: SVG children never emit, there is no deferred set,
and the camelCase column is moot — the generator verifies every tag spells
identically (`tag === tag.toLowerCase()`) rather than assuming it.

The prop vocabulary comes from the typegen napi: `primitivesVocabulary()` from
`@reference-ui/rust/typegen`, which reports typegen's own `PropDefs` names.
The generator cross-checks the named conditions against canon's
`NAMED_CONDITIONS` Rust table so a stale native binary fails loudly instead of
printing a skewed vocabulary.

## Generator

Regen command (canonical, printed by the header of the primitive types):

```bash
pnpm --filter @reference-ui/rust run primitives
```

The entry (canon-script precedent) collects both
sources, prints the three artifacts named below, scans tripwires, and writes the files. Bytes are
deterministic — sorted keys, fixed header, no timestamps — so running twice
and comparing with `cmp` must be silent. Any fail-closed violation (JSX
collision, alias resolving outside the prop set, breakpoint key in the
system-independent set, `Box`/`Flex`/`Grid` in the roster, forbidden surface
in the output) exits nonzero with the offending source named.

The roster module (`primitives`, the raw system-unbound component module) prints the
101-entry roster only: one thin `createPrimitive` call per tag plus the
single `configurePrimitives({ layerName, stylePropNames, css })` seam that
returns the bound roster. The generator never prints React runtime: the factory, splitter, and contexts are authored sources, moved
verbatim from Core's primitives runtime into the module's JS home,
with their suites beside them. The two homes meet only at the roster module's relative
import of the trio; the unbound exports never render (empty splitter, blank
layer, throwing css), so importing the roster module is side-effect free by construction.

## Consumers

The vocabulary is the machine contract: version, the 101
elements sorted by JSX name, the exact `stylePropNames` typegen prints,
named conditions plus the splitter's lexical rule, the alias map, reserved
keys, and the caption/menu element overrides. The primitive types are the raw types: `PrimitiveTag`, the exact `StylePropName` union, the
per-tag props + const declarations in today's react-types shape with the
per-world bake removed, the `PrimitiveProps<T>` generic, contexts, and
`useColorMode`. The `css`/`recipe` declarations are appended by Core, not printed here. The roster module is the runnable roster: 101 unbound
components plus the `configurePrimitives` seam, importing the authored trio
from the JS home. The vocabulary and the primitive types vendor into
reference-core's native tree (the vendor script); the roster module and the trio travel as live sources (typegen precedent —
bundled at sync time, never copied). Core's per-system emitter calls the seam
instead of string-building entries, and the PGEN case renders through the
bound roster. The committed outputs are their own goldens: the test suite
rebuilds all three artifacts in memory and fails on any byte drift.

> Up: @reference-ui/rust

> Search terms: primitive roster, vocabulary, configurePrimitives, factory, splitter, primitives/generator, rs:canon, rs:typegen
