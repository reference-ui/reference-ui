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
sources, prints E1 + E4, scans tripwires, and writes the files. Bytes are
deterministic — sorted keys, fixed header, no timestamps — so running twice
and comparing with `cmp` must be silent. Any fail-closed violation (JSX
collision, alias resolving outside the prop set, breakpoint key in the
system-independent set, `Box`/`Flex`/`Grid` in the roster, forbidden surface
in the output) exits nonzero with the offending source named.

E2 (`primitives.mjs`, the raw system-unbound component module) is flagged for
W2, not emitted here: it calls `createPrimitive` against the runtime trio that
still lives Neo-side, so emitting it now would import across the cut or stub
the runtime. W2 moves the runtime home (E3) and emits E2 against it.

## Consumers

`generated/vocabulary.json` (E1) is the machine contract: version, the 101
elements sorted by JSX name, the exact `stylePropNames` typegen prints,
named conditions plus the splitter's lexical rule, the alias map, reserved
keys, and the caption/menu element overrides. `generated/primitives.d.ts`
(E4) is the raw types: `PrimitiveTag`, the exact `StylePropName` union, the
per-tag props + const declarations in today's react-types shape with the
per-world bake removed, the `PrimitiveProps<T>` generic, contexts, and
`useColorMode`. The `css`/`recipe` declarations stay Neo-appended at the W4
cutover. Both files vendor to `native/generated/primitives/` (W3 tool); Neo's
per-system emitter and the PGEN station read the vendored copies, never Rust
tables directly. The committed outputs are their own goldens: the test suite
rebuilds both artifacts in memory and fails on any byte drift.
