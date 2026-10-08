---
date: 2026-09-24
cycle: night-r1
module: atlas/diagnostics
theories_spent: 1
verdict: break-found
---

# Included package scan failure drops silently (no diagnostic, components vanish)

## Hypothesis

Gap pursued: in `AtlasAnalyzer::analyze_detailed`, a package that
resolves but then fails discovery or read is skipped by two silent
`let Ok(..) else { continue; }` guards
(`modules/atlas/src/analyzer.rs:94-99`) — no warning, no error row,
while the package's components vanish from the inventory.

The red test (planted temporarily by the repro, run via
`pnpm agentrs v`, then deleted) lays out an app plus a sibling
`uilib/src` package containing one good component and one
permission-denied subdir, and calls
`analyzeDetailed(app, { include: ['@probe/uilib'] })`:
control (healthy package) indexes `Thing`; red asserts the
diagnostics name `@probe/uilib`. Control passes, red fails —
`diagnostics` is `[]` and `Thing` is gone. A sibling control shows
an included-but-unresolvable package *does* warn
(`ATL-W-UNRESOLVED-INCLUDE-PACKAGE`), so the lesser failure signals
while the worse one (resolved, explicitly requested, content
dropped) stays silent.

## Verdict

`break-found`. Repro: `/tmp/doom-r1-trio-atlas-pkg-silence.sh`
(run from the repo root; plants
`modules/atlas/tests/doom-r1-trio-red.test.ts`, runs it via
`pnpm agentrs v`, deletes it, verifies the touched path is clean;
exits 1 on the red assertion: 1 passed / 1 failed).

Violated contract:

- `analyzeDetailed` promises partial results "instead of forcing
  callers to infer failure modes from missing components"
  (`modules/atlas/js/analyzer.ts`), and the entry point sends
  "callers needing failure modes" to `analyzeDetailed`
  (`modules/atlas/js/index.ts`) — here the caller can only infer
  the package failure from `Thing`'s absence; the channel is empty.
- Same-condition divergence inside the module: local discovery or
  read failure mints `ATL-E-SCAN-FAILED` with empty components
  (`analyzer.rs:48-60`, `failed_result`); package discovery or
  read failure — the identical IO condition — mints nothing.
- In-mechanism inversion: an included package that resolves
  nowhere warns (`analyzer.rs:72-79`,
  `ATL-W-UNRESOLVED-INCLUDE-PACKAGE`); an included package that
  resolves but cannot be read warns nowhere.
- Registry row `ATL-E-SCAN-FAILED` ("file discovery or read
  failed", `REGISTRY.md`) covers exactly this condition, yet the
  package path emits no row of any code.

Severity: user-facing. An explicitly requested package's
components silently disappear from the inventory (permissions,
transient IO, unreadable subdir) with zero signal, so an author
debugging "why isn't my component indexed" finds nothing. The
refusal is not merely misshapen — it is absent where owed.

Doom-log note: history search
(`typegen styletrace atlas diagnostics`) shows atlas discovery
drops and atomic channel silence, but no report on package-level
diagnostic silence; this gap was unexplored. Carried but unpursued
(one-break protocol): styletrace's coded throws bury the code
under two prose prefixes
(`Styletrace analysis failed: StyleTrace: STT-E-SCAN-FAILED: …`
at the JS seam, via `native.rs` + `StyleTraceError` Display),
while tasty and typegen throw code-first
(`TST-E-SCAN-FAILED: …`, `TGN-E-INVALID-BASE-SYSTEM: …`) —
same "coded throw mirroring the tasty scan channel" contract
(`REGISTRY.md`), divergent wire shape.
