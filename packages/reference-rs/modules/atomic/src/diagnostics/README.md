# Diagnostics

Compiler diagnostics are proof, not suspicion. This subsystem owns every
non-fatal `ATM-*` diagnostic the Atomic compiler emits: producers report
typed facts, policy renders the prose, and the proof join decides the
audience. **Not** a fallback evaluator — phases never construct final
user messages, and no producer chooses an audience.

## Audiences

Two audiences, two result fields, one switch:

- **Userspace** (`CompileResult.diagnostics`, always present): existing
  fatal `ATM-E-*` unchanged, plus non-fatal warnings only when the
  compiler proves an exact runtime style lookup will have no plan if
  execution reaches that site — the full
  `(system, when, prop, value, important)` key is known and absent from
  the final `RuntimeStylePlan` set.
- **Compiler** (`CompileResult.compilerDiagnostics`, present only when
  `logs: ['compiler']` is requested): everything true and useful that
  does not clear that bar — dynamic refusals, partial assembly, spreads,
  harvest telemetry, dead branches, coverage observations, analysis
  limits. Unknown channel names are ignored so channels evolve
  additively; `debug: true` never enables this channel.

Silence is a valid result: no exact absent key, no userspace warning.
An exact key emitted because of another file, site, or harvest still
counts as present (incidental-coverage rule) — runtime paints, so
diagnostics stays silent. Neo prints userspace warnings as one collapsed
`[neo] sync warning …` call and the opt-in list as `[neo] compiler …`.

## How a compile flows

1. `atomic::compile` parses each input once and builds a
   `DiagnosticsSession` plus the borrowed `AnalysisInput` (programs,
   host surface, constants, system name) after host resolution.
2. `analysis/` walks the borrowed programs independently: for each
   runtime style slot it records an `ExactLookupExpected` (every key
   component statically known) or a `DynamicSlot`, never inferring
   success from extraction's wants. Holes (`null`/`undefined`/`false`
   in leaf position) record nothing — runtime queries nothing there.
3. Extract, harvest, resolve, and hosts report typed `DiagnosticFact`
   values through the `adapters/` (producers send data, never prose).
4. Assembly hands over the final emitted-key set; `proof/` joins
   expected exacts against it. Absent + resolver-explained rewrites the
   legacy line into a proof warning (same code and site, names the
   declaration, keeps the legacy reason); absent + unexplained appends
   `ATM-W-MISSING-STYLE-PLAN`; covered sinks drop their funnel + sink
   lines from the default.
5. `channels/` partitions: compiler-classified facts leave the default
   and, only when requested, render onto `compilerDiagnostics`.

## Map

- `mod.rs` — subsystem seam (`Diagnostic`, re-exports).
- `codes.rs` — stable wire codes, append-only (45 entries; `ATM-W-…`
  warnings, `ATM-E-…` errors, `ATM-I-…` infos; `TokenCategoryMismatch`
  retired but kept for wire stability).
- `render.rs` — shared `{file}:{line}:{col} {code} {message}` rendering.
- `site.rs` — `SourceId`/`SourceSite`, owned locations, UTF-16
  `line_col` (columns count UTF-16 units, matching editor carets).
- `facts.rs` — `DiagnosticFact` vocabulary, `OwnedLookupKey` (built and
  serialized by the one runtime-key authority — no second
  canonicalizer), `DiagnosticSink`.
- `session.rs` — compile-long fact and expectation store (owns data,
  never AST references).
- `policy/` — proof-to-verdict table + per-family render arms.
- `channels/` — userspace/compiler partition + opt-in renders.
- `analysis/` — independent AST expectations (`css`, `jsx`, object
  walkers, conditions, values, const/imports/gate helpers).
- `adapters/` — extract/harvest/resolve/hosts producer adapters.
- `proof/` — expected-key vs final-plan-key join + line surgery.

Positions: located diagnostics carry `file:line:col`; span-less global
fragments honestly report their fragment source at 1:1; static-CSS
warnings stay unlocated (the `BaseSystem` carries no source identity).
Proof stations: `ATM-DIAG-01`–`14` (`tests/cases/`); emitter verdicts:
`docs/MISSIONS/ERROR_CORRECT_LEDGER.md`.

## ERROR CODES

Every code the compiler can emit, with the channel that carries it and the
minimal authored shape that raises it. `default` is `CompileResult.diagnostics`;
`compiler` is the opt-in `compilerDiagnostics` backchannel (`logs: ['compiler']`).
The shared registry (`modules/diagnostics/REGISTRY.md`) is the deliberate home
for meanings and raise sites; Neo's `repro.test.ts` pins one whole-compiler
repro per warn/err row. Codes are wire contract: never rename, never remove.

| Code | Channel | Trigger |
| ---- | ------- | ------- |
| `ATM-W-DYNAMIC-EXPRESSION` | compiler | `css({ color: maybeColor() })` |
| `ATM-W-DYNAMIC-MEMBER` | compiler | `css({ width: props.w })` |
| `ATM-W-DYNAMIC-IDENTIFIER` | compiler | `css({ color: themeColor })` (unresolvable) |
| `ATM-W-MUTATED-BINDING` | compiler | `css({ color: tint })` after `tint = …` |
| `ATM-W-DYNAMIC-TEMPLATE` | compiler | `` css({ margin: `${gap}px` }) `` (unfoldable) |
| `ATM-W-DYNAMIC-UNARY` | compiler | `css({ order: typeof x })` |
| `ATM-W-UNFOLDABLE-KEY` | compiler | `css({ [dynamicKey]: '10px' })` |
| `ATM-W-UNKNOWN-PROPERTY` | default | `css({ frobnicate: 'x' })` |
| `ATM-W-UNKNOWN-BREAKPOINT` | compiler | `css({ r: { wat: { p: '1r' } } })` |
| `ATM-W-NON-OBJECT-CONDITION` | compiler | `css({ _hover: 'red' })` |
| `ATM-W-UNFOLDABLE-SPREAD` | compiler | `css({ ...overrides })` (unresolvable) |
| `ATM-W-UNKNOWN-CONDITION` | default | `css({ _hovr: { color: 'red' } })` |
| `ATM-W-MISSING-CONTAINER-ROOT` | default | `r:` container query with globals but no container root |
| `ATM-W-NON-CANONICAL-NUMERIC` | default | `css({ width: '0x10' })` |
| `ATM-W-INVALID-CSS-VALUE` | default | `css({ display: true })` |
| `ATM-W-MALFORMED-OPACITY` | default | `css({ color: 'red.500/' })` |
| `ATM-W-UNKNOWN-TOKEN-PATH` | default | `css({ caretColor: 'ui.missing.path' })` |
| `ATM-W-TOKEN-CATEGORY-MISMATCH` | — | Retired: never emitted, kept for wire stability |
| `ATM-W-UNTERMINATED-BRACE` | default | `css({ content: '"{oops"' })` |
| `ATM-W-STATIC-WILDCARD` | default | `staticCss: { display: ['*'] }` |
| `ATM-W-EMPTY-AT-RULE` | default | `globalCss({ '@supports': { … } })` |
| `ATM-W-UNSUPPORTED-GLOBAL-VALUE` | default | `globalCss({ body: { color: { sm: […] } } })` |
| `ATM-W-TRACE-SKIPPED` | default | Unparsable sibling beside traced files |
| `ATM-E-MISSING-HOST-GRAPH` | default | Style-bearing JSX with empty `jsxHosts` |
| `ATM-E-RECIPE-ARG-SHAPE` | default | `recipe('nope')` |
| `ATM-E-RECIPE-SPREAD` | default | `recipe({ className: 'x', ...rest })` |
| `ATM-E-RECIPE-CLASSNAME` | default | `recipe({ base: … })` with no `className` |
| `ATM-E-PARSE` | default | `export function Broken( {` |
| `ATM-E-DUPLICATE-RECIPE` | default | Two `recipe({ className: 'dup', … })` |
| `ATM-E-UNKNOWN-TOKEN` | default | `css({ color: '{colors.nope}' })` |
| `ATM-E-INVALID-BASE-SYSTEM` | default | Spec that fails contract validation |
| `ATM-W-NON-OBJECT-CSS-ARG` | compiler | `css(fn())` |
| `ATM-W-NON-OBJECT-JSX-STYLE` | compiler | `<Div css={cond && { … }} />` |
| `ATM-W-RESPONSIVE-ARRAY-SPREAD` | compiler | `css({ padding: ['8px', ...dyn] })` |
| `ATM-W-TAGGED-TEMPLATE-SITE` | compiler | `` css`color: red` `` |
| `ATM-W-UNFOLDABLE-OBJECT-PROP` | compiler | `css({ ...dyn })` over `{ color: pick() }` |
| `ATM-W-PARTIAL-OBJECT-PROP` | compiler | `css({ ...part })` over `{ color: flag ? 'white' : run() }` |
| `ATM-W-DYNAMIC-BINARY` | compiler | `css({ order: 1 / 0 })` |
| `ATM-I-DEAD-BRANCH` | module-local | Folded ternary drops an arm (never crosses the transport) |
| `ATM-W-TOKEN-CALL-REFUSED` | compiler | `css({ color: token() })` |
| `ATM-W-UNKNOWN-COLOR` | default | `css({ color: 'notacolor-xyz' })` |
| `ATM-I-HARVEST-SINK` | module-local | One info per harvest sink (never crosses the transport) |
| `ATM-W-MISSING-STYLE-PLAN` | default | Exact lookup with no plan beside a fatal drop |
| `ATM-I-EXPECTED-LOOKUP` | module-local | Exact-lookup telemetry (never crosses the transport) |
| `ATM-I-DYNAMIC-SLOT` | module-local | Dynamic-slot telemetry (never crosses the transport) |
| `ATM-W-RESPONSIVE-LEAF-IMPORTANT` | default | `css({ width: { base: '50px!' } })` |
| `ATM-W-UNREALIZABLE-EXTENSION` | default | `css({ translateX: '10px' })` |
| `ATM-E-CONFLICTING-SCAN-INPUTS` | default | Request with both `files` and `retentionToken` |
| `ATM-E-UNKNOWN-RETENTION-TOKEN` | default | Request with a never-minted token |
| `ATM-E-DRAINED-RETENTION-TOKEN` | default | Request reusing a drained token |

## Must not

- Let a producer construct prose or choose an audience — facts only.
- Warn on the default channel without an exact absent-key proof
  (fatals and adjudicated staying lines excepted — see the ledger).
- Re-parse a source (`analysis` borrows `&parsed`; the StyleTrace
  dependency-boundary parse is grandfathered, not a second parse).
- Share extraction success/wants as evidence a plan exists.
- Rename a code once a golden pins it; extend the table instead.
- Emit a diagnostic without a code; the constructors require one.
- Alias `debug: true` to the compiler channel.
