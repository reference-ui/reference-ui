# CORE-DIAG — every code is a findable repro

One indexed case per live diagnostic code, code in the name, reproducing
it through the whole compiler — so `agentcore search <CODE>` lands on
the repro. The world carries the registry's minimal fixture
(byte-identical to the shared repro-suite row); the spec compiles the
world through the real engine and asserts code plus severity plus
non-blank message. A red case means the engine stopped emitting the code
it promises. All specs are node-side (`sync: false` everywhere):
warning and error fixtures compile by design, so each spec drives its
own compile and assertions never touch the browser.

Drivers per namespace: the 40 `ATM-*` row codes compile the case world
and assert on the row's channel; the 5 `ATM-E-*` request codes mutate a
base project per the registry-documented request and compile native; the
6 `TST-*` build a `src/` workspace (the scan refusal asserts a coded
throw); the 4 `ATL-*` analyze a `src/` app; the 3 `STT-*` trace a
`decl/` root plus `src/` (both refusals assert coded throws); the 8
`TGN-*` print a spec (the spec refusal asserts a coded throw). The
refusals throw coded instead of riding a payload, mirroring their module
channels.

Typecheck policy: worlds typecheck under the package gate, so fixtures
that are valid compiler input but invalid TS carry a `// @ts-nocheck`
first line (the native parsers never see comments). Fixtures that do not
parse at all are committed as sibling `.txt` files and materialized to
the live path by the spec around the compile, removed in a `finally`
with a defensive pre-clean, so the tree never keeps a red file behind.

Approved absences: `ATM-W-TOKEN-CATEGORY-MISMATCH` is retired, never
emitted, kept for wire stability. `ATM-W-UNREALIZABLE-EXTENSION` is
retired the same way (canon ships no extension without a lowering), and
CORE-DIAG-22 retired with it. `ATM-I-*` is module-local telemetry on
the legacy/native channel only, pinned by RS cases (ATM-DIAG-07,
ATM-ATOM-06, harvest-census). `RS-W-EXAMPLE-*` / `RS-E-EXAMPLE-*` are
template tests and docs only, never emitted by shipped code. `CAN` /
`BSS` / `MGP` are reserved, unminted.

Out of scope: rendered frame quality (judged by review, never by these
cases), byte snapshots of pretty output (forbidden: they punish style
improvement), and codes without a shared-suite repro (a code earns its
case by earning its row first).

The contract lives here; the cases below are the ledger.

> Search terms: diagnostic codes, findable repro, repro rows, code plus severity, node-side specs, coded throws, ts-nocheck fixtures, approved absences
