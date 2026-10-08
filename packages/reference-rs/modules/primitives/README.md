# Primitives Module

One way to generate primitives. Canon owns the element roster, typegen owns
the prop names; this module joins the two authorities into committed artifacts
and adds zero new authority of its own. The only judgment it encodes is the
station family grouping from the NIGHT-5 spec, pinned by the golden test.

## Source

The element roster joins the canon TS overlay partition (HTML vs SVG,
`modules/canon/generate/overlay/primitives.ts`) with the generated Rust
`ELEMENTS`/`PRIMITIVE_JSX` tables (`modules/canon/src/html.rs`). The overlay
selects the namespace, the Rust tables supply the JSX spellings (including the
`Obj`/`Var` escapes), and the join fails closed on any drift between them.

Per HQ namespace law (PLAN §3.9) the vocabulary carries exactly the 101
HTML-namespace elements: SVG children never emit, there is no deferred set,
and the F1 camelCase column is moot — the generator verifies every tag spells
identically (`tag === tag.toLowerCase()`) rather than assuming it.

The prop vocabulary is the landed W0 napi: `primitivesVocabulary()` from
`@reference-ui/rust/typegen`, which reports typegen's own `PropDefs` names.
The generator cross-checks the named conditions against canon's
`NAMED_CONDITIONS` Rust table so a stale native binary fails loudly instead of
printing a skewed vocabulary.

## Generator

Regen command (canonical, printed by the E4 header):

```bash
pnpm --filter @reference-ui/rust run primitives
```

The entry (`generate/generate.ts`, canon-script precedent) collects both
sources, prints E1 + E2 + E4, scans tripwires, and writes the files. Bytes are
deterministic — sorted keys, fixed header, no timestamps — so running twice
and comparing with `cmp` must be silent. Any fail-closed violation (JSX
collision, alias resolving outside the prop set, breakpoint key in the
system-independent set, `Box`/`Flex`/`Grid` in the roster, forbidden surface
in the output) exits nonzero with the offending source named.

E2 (`primitives.mjs`, the raw system-unbound component module) prints the
101-entry roster only: one thin `createPrimitive` call per tag plus the
single `configurePrimitives({ layerName, stylePropNames, css })` seam that
returns the bound roster. The generator never prints React runtime (PLAN
§3.4) — the factory, splitter, and contexts are authored sources, moved
verbatim from Neo's `primitives/runtime/` into the module's `js/` home (E3),
with their suites beside them. The two homes meet only at E2's relative
import of the trio; the unbound exports never render (empty splitter, blank
layer, throwing css), so importing E2 is side-effect free by construction.

## Consumers

`generated/vocabulary.json` (E1) is the machine contract: version, the 101
elements sorted by JSX name, the exact `stylePropNames` typegen prints,
named conditions plus the splitter's lexical rule, the alias map, reserved
keys, and the caption/menu element overrides. `generated/primitives.d.ts`
(E4) is the raw types: `PrimitiveTag`, the exact `StylePropName` union, the
per-tag props + const declarations in today's react-types shape with the
per-world bake removed, the `PrimitiveProps<T>` generic, contexts, and
`useColorMode`. The `css`/`recipe` declarations stay Neo-appended at the W4
cutover. `generated/primitives.mjs` (E2) is the runnable roster: 101 unbound
components plus the `configurePrimitives` seam, importing the authored trio
from the `js/` home. E1 and E4 vendor to `native/generated/primitives/`
(W3 tool); E2 and the trio travel as live sources (typegen precedent —
bundled at sync time, never copied). Neo's per-system emitter calls the seam
instead of string-building entries, and the PGEN station renders through the
bound roster. The committed outputs are their own goldens: the test suite
rebuilds all three artifacts in memory and fails on any byte drift.
