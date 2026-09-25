# Diagnostics Code Registry

Living document for every diagnostic code the native compiler can emit.
A code is always present, always documented, and always traceable here —
that traceability is the whole return on the diagnostics platform.

## Code shape

```abnf
code      = namespace "-" tag "-" name
namespace = ALPHA [ALNUM] [ALNUM [ALNUM]]   ; 2-4 chars, e.g. ATM, ATL, RS
tag       = "W" / "E"                        ; warning or error
name      = segment *("-" segment)           ; kebab, e.g. UNKNOWN-PROPERTY
segment   = 1*(UPPER / DIGIT)
```

Valid: `ATM-W-UNKNOWN-PROPERTY`, `ATL-W-UNRESOLVED-PROPS-TYPE`, `RS-E-EXAMPLE-BOOM`.
Invalid: `ATM-W-` (empty name), `ATM-X-NAME` (bad tag), `ATM-I-NAME`
(reserved tag), `atm-W-NAME` (lowercase), `ATM-W-name` (lowercase name).

The template validates shape in code (`parseCode` / `DiagnosticCode::parse`)
and stays shape-open: a well-shaped code from a newer module parses even here.
Deliberateness lives in this document, not in a compile-time allowlist, so
consumers never break on codes minted after they shipped.

## Namespaces

| Namespace | Owner       | Status                                                 |
| --------- | ----------- | ------------------------------------------------------ |
| `RS`      | template    | Self: `RS-W-EXAMPLE-*` / `RS-E-EXAMPLE-*` for tests and docs only; never emitted by shipped code |
| `ATM`     | atomic      | Live: 50-code table in `modules/atomic/src/diagnostics/codes.rs`, aligned onto the template (wire-identical, tag-matched); `-I-` telemetry stays module-local |
| `ATL`     | atlas       | Live: 5-code table in `modules/atlas/src/diagnostics/codes.rs`; props warnings plus the scan refusal |
| `TST`     | tasty       | Live: 6-code table in `modules/tasty/src/diagnostics/codes.rs`; scanner, merge, star, and manifest warnings plus the scan refusal |
| `STT`     | styletrace  | Live: 3-code table in `modules/styletrace/src/diagnostics/codes.rs`; per-file skips plus the scan and surface refusals |
| `TGN`     | typegen     | Live: 9-code table in `modules/typegen/src/diagnostics/codes.rs`; printer skips plus the spec refusal |
| `CAN`     | canon       | Reserved, unminted                                     |
| `BSS`     | base-system | Reserved, unminted                                     |
| `VRS`     | virtualrs   | Reserved, unminted                                     |
| `MGP`     | module-graph| Reserved, unminted                                     |

Rules:

- Namespaces are disjoint. A module mints only under its own namespace;
  the template mints only under `RS`. No two agents can collide because
  no two agents share a namespace.
- New namespaces are added here first, in a reviewed change, before any
  code mints under them. The `REGISTERED_NAMESPACES` constants in Rust
  and js mirror this table for advisory checks.
- `RS-*-EXAMPLE-*` is the only reservation inside `RS`. Template tests,
  doc examples, and cross-language goldens use it; shipped code never emits it.

## Assignment convention (for per-module agents)

1. **Check this table.** Confirm your module's namespace and pick a kebab
   name that says what went wrong (`UNKNOWN-TOKEN-PATH`, not `ERR-12`).
2. **Match the tag to the emission.** `-W-` means compile continues with a
   fallback (skipped, guessed, degraded); `-E-` means the request or artifact
   is refused, in whole or in the affected part. Constructors and decoders
   reject a code whose tag disagrees with its severity.
3. **Mint once, in your module's codes table.** Keep the per-module pattern
   atomic established: a stable enum/table mapping variants to wire strings,
   with one row per failure class. The template's `Diagnostic` carries the
   wire string; your enum stays the producer-side vocabulary.
4. **Register the row here.** Append to the inventory below: code, one-line
   meaning, and the file that raises it. A code with no row is unshipped.
5. **Pin it in a golden.** Every code needs a committed test that asserts its
   exact wire bytes (Rust transport test or station golden), so renames break loudly.
6. **Never rename or remove.** Pinned codes are wire contract. Retired failure
   classes keep their row marked retired, exactly like
   `ATM-W-TOKEN-CATEGORY-MISMATCH` today.

## Severity and the reserved tag

The template carries warnings and errors only. `-I-` is reserved for a future
revision and rejected by every parser today. Atomic's existing `ATM-I-*`
telemetry (harvest sinks, lookup expectations, dynamic slots) stays
module-local: it must not cross the shared transport until the template grows
an info level, at which point this section gets a migration procedure.

## Message pattern (summary)

Messages are a canvas, not a schema: the only structural demands are the code
and a non-blank message. The codebase pattern is subject-first — line one names
the subject in backticks and says what happened; later lines suggest
(`did you mean ...?`) or guide (`hint: ...`). Helpers live in
`src/message.rs` and the js mirror; worked examples live in their test suites.
Follow the pattern; nothing enforces it at the boundary. The one enforced
style rule is the suggestion gate: `suggest_for_code` fires only for the
`SUGGESTION_CODES` allowlist (unknown property, breakpoint, condition, token
path, color, token reference, token category, strict category) — every other
code stays silent, and new unknown-X codes join the list in a reviewed change
with their registry row.

## Inventory

Atomic rows are the aligned `ATM` vocabulary: every warn/err code parses in
the template and pins a whole-compiler repro in Neo's `repro.test.ts`; the
four `-I-` rows stay module-local until the template grows an info level.

| Code | Meaning | Raised in |
| ---- | ------- | --------- |
| `ATM-W-DYNAMIC-EXPRESSION` | Dynamic expression in value position; the position is skipped, siblings kept | `modules/atomic/src/extract/expressions/walk/call.rs` |
| `ATM-W-DYNAMIC-MEMBER` | Unresolvable member expression in value position | `modules/atomic/src/extract/expressions/walk/member.rs` |
| `ATM-W-DYNAMIC-IDENTIFIER` | Unresolvable free identifier in value position | `modules/atomic/src/extract/expressions/walk/leaf.rs` |
| `ATM-W-MUTATED-BINDING` | Binding used after a tracked write | `modules/atomic/src/extract/expressions/walk/leaf.rs` |
| `ATM-W-DYNAMIC-TEMPLATE` | Interpolated template over unfoldable parts | `modules/atomic/src/extract/expressions/literal.rs` |
| `ATM-W-DYNAMIC-UNARY` | Operator or operand the unary fold refused | `modules/atomic/src/extract/expressions/walk/leaf.rs` |
| `ATM-W-UNFOLDABLE-KEY` | Computed key that does not fold | `modules/atomic/src/extract/expressions/object/mod.rs` |
| `ATM-W-UNKNOWN-PROPERTY` | Unknown style prop | `modules/atomic/src/resolve/mod.rs` |
| `ATM-W-UNKNOWN-BREAKPOINT` | Unknown breakpoint name in an `r` prop object | `modules/atomic/src/extract/expressions/object/keys.rs` |
| `ATM-W-NON-OBJECT-CONDITION` | Condition key whose value is not an object | `modules/atomic/src/extract/expressions/object/condition.rs` |
| `ATM-W-UNFOLDABLE-SPREAD` | Unresolvable object spread; siblings kept | `modules/atomic/src/extract/expressions/object/spread.rs` |
| `ATM-W-UNKNOWN-CONDITION` | Unknown condition or conditional key | `modules/atomic/src/resolve/mod.rs` |
| `ATM-W-MISSING-CONTAINER-ROOT` | `@container` atoms without a container root | `modules/atomic/src/resolve/conditions/mod.rs` |
| `ATM-W-NON-CANONICAL-NUMERIC` | Octal, hex, binary, `Infinity`, or `NaN` numeric spelling | `modules/atomic/src/resolve/unit.rs` |
| `ATM-W-INVALID-CSS-VALUE` | Boolean or null where CSS needs a value | `modules/atomic/src/resolve/unit.rs` |
| `ATM-W-MALFORMED-OPACITY` | Malformed `/opacity` modifier on a token path | `modules/atomic/src/resolve/tokens/mod.rs` |
| `ATM-W-UNKNOWN-TOKEN-PATH` | Dotted path that names no token | `modules/atomic/src/resolve/tokens/mod.rs` |
| `ATM-W-TOKEN-CATEGORY-MISMATCH` | Retired: never emitted, kept for wire stability | — (retired, see `codes.rs`) |
| `ATM-W-UNTERMINATED-BRACE` | Unterminated `{` inside a value | `modules/atomic/src/resolve/tokens/interpolate.rs` |
| `ATM-W-STATIC-WILDCARD` | Wildcard on a prop with no token category | `modules/atomic/src/static_css.rs` |
| `ATM-W-EMPTY-AT-RULE` | At-rule key with an empty query | `modules/atomic/src/stylesheet/global/walker.rs` |
| `ATM-W-UNSUPPORTED-GLOBAL-VALUE` | List or nested value under a conditional key | `modules/atomic/src/stylesheet/global/walker.rs` |
| `ATM-W-TRACE-SKIPPED` | A StyleTrace file skipped with its siblings kept | `modules/atomic/src/hosts/diagnostics.rs` |
| `ATM-E-MISSING-HOST-GRAPH` | Style-bearing JSX with no resolvable host graph | `modules/atomic/src/extract/jsx/mod.rs` |
| `ATM-E-RECIPE-ARG-SHAPE` | `recipe(...)` first arg is not an inline object | `modules/atomic/src/extract/recipes/mod.rs` |
| `ATM-E-RECIPE-SPREAD` | Spread inside a `recipe(...)` object literal | `modules/atomic/src/extract/recipes/mod.rs` |
| `ATM-E-RECIPE-CLASSNAME` | Missing or dynamic recipe className | `modules/atomic/src/extract/recipes/mod.rs` |
| `ATM-E-PARSE` | The source failed to parse; compile continues | `modules/atomic/src/stream.rs` |
| `ATM-E-DUPLICATE-RECIPE` | Two recipes claim one className within a system | `modules/atomic/src/assembly.rs` |
| `ATM-E-UNKNOWN-TOKEN` | Explicit `{path}` reference that names no token | `modules/atomic/src/resolve/tokens/mod.rs` |
| `ATM-E-INVALID-BASE-SYSTEM` | The baseSystem spec failed contract validation | `modules/atomic/native.rs` |
| `ATM-W-NON-OBJECT-CSS-ARG` | A `css()` argument, merge-list element, or conditional arm is not a static style object | `modules/atomic/src/extract/css/mod.rs` |
| `ATM-W-NON-OBJECT-JSX-STYLE` | A `css` / `r` / condition prop value is not a static style object | `modules/atomic/src/extract/jsx/mod.rs` |
| `ATM-W-RESPONSIVE-ARRAY-SPREAD` | A spread inside a value array refuses the whole array | `modules/atomic/src/extract/expressions/responsive.rs` |
| `ATM-W-TAGGED-TEMPLATE-SITE` | A tagged template on a live `css` binding | `modules/atomic/src/extract/mod.rs` |
| `ATM-W-UNFOLDABLE-OBJECT-PROP` | A recorded const-object prop with no static style value | `modules/atomic/src/extract/expressions/object/entries.rs` |
| `ATM-W-PARTIAL-OBJECT-PROP` | A const-object prop that kept static leaves while dropping a dynamic arm | `modules/atomic/src/extract/expressions/object/entries.rs` |
| `ATM-W-DYNAMIC-BINARY` | Operator or pair the binary fold refused | `modules/atomic/src/extract/expressions/walk/leaf.rs` |
| `ATM-I-DEAD-BRANCH` | Module-local: a ternary arm eliminated by a folded test | `modules/atomic/src/extract/expressions/walk/branch.rs` |
| `ATM-W-TOKEN-CALL-REFUSED` | A `token()` shape the call surface refused | `modules/atomic/src/extract/fold/token.rs` |
| `ATM-W-UNKNOWN-COLOR` | Bare value on a color prop that is neither a color token nor a CSS color | `modules/atomic/src/resolve/tokens/mod.rs` |
| `ATM-I-HARVEST-SINK` | Module-local: one info per harvest sink | `modules/atomic/src/extract/harvest/mint/mod.rs` |
| `ATM-W-MISSING-STYLE-PLAN` | An exact runtime lookup the final plan omits with no resolver cause | `modules/atomic/src/diagnostics/proof/render.rs` |
| `ATM-I-EXPECTED-LOOKUP` | Module-local: an exact runtime lookup expectation | `modules/atomic/src/diagnostics/policy/analysis.rs` |
| `ATM-I-DYNAMIC-SLOT` | Module-local: a dynamic slot observation | `modules/atomic/src/diagnostics/policy/analysis.rs` |
| `ATM-W-RESPONSIVE-LEAF-IMPORTANT` | A `!` marker on a responsive-object leaf, refused at the extraction boundary | `modules/atomic/src/extract/expressions/responsive.rs` |
| `ATM-W-UNREALIZABLE-EXTENSION` | A dialect extension whose served `css` form is fictional per live webref | `modules/atomic/src/resolve/mod.rs` |
| `ATM-E-CONFLICTING-SCAN-INPUTS` | A compile request carrying both `files` and a `retentionToken` | `modules/atomic/src/sources.rs` |
| `ATM-E-UNKNOWN-RETENTION-TOKEN` | A `retentionToken` that names no live retention | `modules/atomic/src/sources.rs` |
| `ATM-E-DRAINED-RETENTION-TOKEN` | A `retentionToken` drained by an earlier compile | `modules/atomic/src/sources.rs` |
| `RS-W-EXAMPLE-TOKEN` | Template test/doc placeholder; never shipped | `modules/diagnostics` tests |
| `RS-E-EXAMPLE-BOOM` | Template test/doc placeholder; never shipped | `modules/diagnostics` tests |
| `TST-W-PARSE-ERROR` | A file failed to parse; extraction keeps the recoverable shells | `modules/tasty/src/ast/extract/pipeline.rs` |
| `TST-W-DUPLICATE-DECLARATION` | Same-file alias/mixed same-name group keeps the last shell | `modules/tasty/src/ast/resolve/merge.rs` |
| `TST-W-DUPLICATE-MEMBER` | Merged interfaces declare one member twice; keeps the first | `modules/tasty/src/ast/resolve/merge.rs` |
| `TST-W-STAR-AMBIGUITY` | `export *` name from two targets is excluded from the barrel | `modules/tasty/src/ast/resolve/index.rs` |
| `TST-W-DUPLICATE-SYMBOL-NAME` | One name indexes several symbols; disambiguate by id or scope | `modules/tasty/src/generator/bundle/modules/manifest.rs` |
| `TST-E-SCAN-FAILED` | Scan walk, glob, path, or file read failed; the request is refused as a coded throw | `modules/tasty/src/scanner/workspace/**` |
| `ATL-W-UNRESOLVED-PROPS-TYPE` | Named props type resolves nowhere; a partial component is kept with empty props | `modules/atlas/src/resolver.rs` |
| `ATL-W-UNSUPPORTED-PROPS-ANNOTATION` | Inline props object annotation; the component is omitted from the inventory | `modules/atlas/src/resolver.rs` |
| `ATL-W-UNRESOLVED-INCLUDE-PACKAGE` | Included package resolves nowhere; the package is skipped | `modules/atlas/src/analyzer.rs` |
| `ATL-E-SCAN-FAILED` | File discovery or read failed; the analysis is refused with empty components | `modules/atlas/src/analyzer.rs` |
| `ATL-W-PACKAGE-SCAN-FAILED` | A resolved package's discovery or read failed; the package is skipped, siblings kept | `modules/atlas/src/analyzer.rs` |
| `STT-W-SKIPPED-FILE` | An entry or edge file failed to parse or read; the file is skipped, siblings kept | `modules/styletrace/src/analysis/surface.rs`, `modules/styletrace/src/analysis/analyzer.rs` |
| `STT-E-SCAN-FAILED` | Source discovery or read failed; the trace is refused as a coded throw | `modules/styletrace/src/analysis/source_files.rs` |
| `STT-E-UNRESOLVED-SURFACE` | No sync root, StyleProps entrypoint, or primitives surface; the trace is refused as a coded throw | `modules/styletrace/src/resolver/sync_root.rs`, `modules/styletrace/src/analysis/surface.rs` |
| `TGN-W-UNKNOWN-TOKEN-CATEGORY` | A dump token category with no printed union; its tokens are omitted | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-INVALID-RECIPE-NAME` | A recipe name that cannot PascalCase to a TypeScript identifier; the recipe is omitted | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-EMPTY-RECIPE` | A recipe with no printable variant axes, or one empty axis; skipped at the reported scope | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-INVALID-COMPOUND-VARIANT` | A compound row naming an unknown axis or value; the row is skipped | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-UNKNOWN-STRICT-CATEGORY` | A strict name outside colors/radii/spacing; skipped with a near-match nudge | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-ABSENT-STRICT-CATEGORY` | A known strict category with no tokens in this system; no wrapper is printed | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-W-EMPTY-FONT-FAMILY` | A font family declaring no weights; omitted from the registry | `modules/typegen/src/diagnostics/collect.rs` |
| `TGN-E-INVALID-BASE-SYSTEM` | The baseSystem spec failed contract validation; the request is refused as a coded throw | `modules/typegen/native.rs` |
| `TGN-W-DUPLICATE-RECIPE-STEM` | A recipe whose PascalCase stem collides with an earlier recipe; the loser is omitted | `modules/typegen/src/diagnostics/collect.rs` |

Tasty emit invariants (emitted-id hashing, artifact serialization) throw
plain internal errors without codes: they are unreachable failure classes
with no user trigger, so no whole-compiler repro can pin them. If one ever
fires, mint a `TST-E-*` row here with its repro in the same change.

Styletrace outcome diagnostics are warnings-only; both `STT-E-*` refusals
throw coded instead of riding a payload, mirroring the tasty scan channel.
The skip sentence preserves the legacy `StyleTrace: …` prose byte-identical,
pinned by the `ATM-SITE-57`, `ATM-DIAG-03`, and `ATM-DIAG-14` goldens.

Typegen warnings ride `DetailedEmit.diagnostics` while `emit_dts` keeps
returning the bare string; the `TGN-E-INVALID-BASE-SYSTEM` refusal throws
coded, mirroring the tasty scan channel. Duplicate strict names stay silent:
the first occurrence wins, exactly as the printer runs.
