# Atlas Diagnostics

Atlas diagnostics are typed facts, not string guesses. This submodule owns every
`ATL-*` diagnostic the analyzer emits: producers mint codes from the stable table,
construct template values with subject-first messages, and the analyzer sorts and
dedupes them into the result payload. **Not** a fallback resolver — phases never
guess a missing type or package, and no producer invents a code outside the table.

## How an analysis flows

1. `AtlasAnalyzer::analyze_detailed` discovers local files and parses them; a
   discovery or read failure returns `ATL-E-SCAN-FAILED` with empty components.
2. Referenced and included packages resolve through `resolve_package_src`; an
   unresolvable include emits `ATL-W-UNRESOLVED-INCLUDE-PACKAGE` and skips on.
   A resolved package whose discovery or read fails emits
   `ATL-W-PACKAGE-SCAN-FAILED` and skips on.
3. `build_component_template` maps each component to its props interface: named
   types that resolve nowhere keep a partial component plus
   `ATL-W-UNRESOLVED-PROPS-TYPE`, while inline object annotations omit the
   component plus `ATL-W-UNSUPPORTED-PROPS-ANNOTATION`.
4. `normalize_diagnostics` sorts by code, file, and message, then dedupes
   identical rows so station goldens stay deterministic.

Positions: component diagnostics carry the display source as `file` (e.g.
`./components/BrokenCard.tsx`); package and scan failures are request-level and
carry no file. Proof stations: `ATL-PROP-01`, `ATL-TYPE-01`, `ATL-BAR-01`
(`tests/cases/`); whole-compiler repros: Neo's `repro.test.ts` atlas suite.

## ERROR CODES

Every code the analyzer can emit, with the minimal authored shape that raises
it. All four ride `AtlasAnalysisResult.diagnostics` (warnings continue with a
fallback, the error refuses the analysis). The shared registry
(`modules/diagnostics/REGISTRY.md`) is the deliberate home for meanings and
raise sites; Neo's `repro.test.ts` pins one whole-compiler repro per row.
Codes are wire contract: never rename, never remove.

| Code | Severity | Trigger |
| ---- | -------- | ------- |
| `ATL-W-UNRESOLVED-PROPS-TYPE` | warning | `export function BrokenCard(props: MissingProps)` with no `MissingProps` in scope |
| `ATL-W-UNSUPPORTED-PROPS-ANNOTATION` | warning | `export function InlineBadge(props: { label: string })` (inline object) |
| `ATL-W-UNRESOLVED-INCLUDE-PACKAGE` | warning | `analyze(app, { include: ['@fixtures/missing-ui'] })` with no such package |
| `ATL-E-SCAN-FAILED` | error | `analyze(app, { exclude: ['['] })` (invalid glob refuses discovery) |
| `ATL-W-PACKAGE-SCAN-FAILED` | warning | `analyze(app, { include: ['@probe/uilib'] })` with an unreadable package dir (siblings kept) |

## Must not

- Emit a diagnostic without a code; the constructors require one.
- Rename a code once a golden pins it; extend the table instead.
- Guess a missing props type or package; report it and keep siblings.
- Carry component or interface names outside the message; the template owns
  the envelope (`file`), and the message names subjects in backticks.
