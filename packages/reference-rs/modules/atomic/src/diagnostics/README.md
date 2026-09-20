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
`docs/missions/error-correct-ledger.md`.

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
