# DIAG — every code is a findable repro

Purpose: one indexed reference-neo case per live diagnostic code, code in
the name, reproducing it through the whole compiler — so
`agentneo search <CODE>` lands on the repro and agents (human or
otherwise) can audit the suite trivially. The case index from
DIAGNOSTICS.md, made real.

## Contract

- One leaf case per live code: `NEO-DIAG-NN`, name `<CODE> repro: …`.
- The world carries the registry's minimal fixture (byte-identical to the
  shared repro-suite row); the spec compiles the world through the real
  engine and asserts code + severity + non-blank message. A red case means
  the engine stopped emitting the code it promises in the registry.
- All specs are node-side (`sync: false` everywhere): warning and error
  fixtures compile by design, so the sync hook stays off and each spec
  drives its own compile. The served page is a never-styled probe the
  runner requires; assertions never touch the browser.

## Drivers per namespace

| Codes | World | Spec drives |
| --- | --- | --- |
| `ATM-*` row codes (40) | `ui.config.ts` + `theme/` fixture | `compileWorld` on the case world, assert on the row's channel |
| `ATM-E-*` request codes (5) | base project (`ui.config.ts` + `theme/tokens.ts`, host file where needed) | `prepareDiagWorld` + the registry-documented request mutation + `compileNative` |
| `TST-*` (6) | `src/` workspace | `buildTasty` (output to temp); the scan refusal asserts a coded throw |
| `ATL-*` (4) | `src/` app (+ analyzer config in the spec where needed) | `analyzeAtlasDetailed` |
| `STT-*` (3) | `decl/` root + `src/` | `traceDetailed`; both refusals assert coded throws |
| `TGN-*` (8) | `spec.json` (+ `strict.json` where needed) | `emitDtsDetailed`; the spec refusal asserts a coded throw |

The tasty scan, styletrace, and typegen refusals throw coded instead of
riding a payload, mirroring their module channels; their specs assert the
throw names the code.

## Typecheck policy

Worlds typecheck under the package gate (`agentneo run` refuses on red
types), so fixtures that are valid compiler input but invalid TS carry a
`// @ts-nocheck` first line (undeclared names, refused call shapes,
missing modules — all comments the native parsers never see). Fixtures
that do not parse at all (the broken-file rows) are committed as sibling
`.txt` and materialized to the live path by the spec around the compile,
removed in a `finally` with a defensive pre-clean, so the tree never keeps
a red file behind.

## Approved absences

- `ATM-W-TOKEN-CATEGORY-MISMATCH` — retired, never emitted, kept for wire
  stability. No repro, no case.
- `ATM-I-*` (4 rows) — module-local telemetry on the legacy/native
  compiler channel only, no typed transport; the template carries
  warnings and errors only. Pinned by RS stations (ATM-DIAG-07,
  ATM-ATOM-06, harvest-census), no case.
- `RS-W-EXAMPLE-*` / `RS-E-EXAMPLE-*` — template tests and docs only,
  never emitted by shipped code. No case.
- `CAN` / `BSS` / `MGP` — reserved, unminted. Nothing to index.

## Out of scope

| Feature | Reason |
| --- | --- |
| Rendered frame quality (spans, gutters, suggestions) | Judged by playtest agents against the rubric, never by these cases |
| Byte snapshots of pretty output | Forbidden: they punish style improvement |
| Codes without a shared-suite repro | The repro suite is the living side of the registry; a code earns its case by earning its row first |
