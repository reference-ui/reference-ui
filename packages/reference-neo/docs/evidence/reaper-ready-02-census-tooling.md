# Reaper READY ask 2 — census tooling: what the compiler exposes today

Date: 2026-09-20. Author: Reaper Phase R1 crew (read-only).
Mission: `docs/missions/operation-reaper.md` READY ask 2.

## Verdict: sink census yes (backchannel), pool census no (Rust-side test reader), gross no (same reader). No compile option, no new fact needed for Slice 1 research.

## Sink census `(prop, when, kind)` — EXPOSED via the compiler backchannel

Each minted sink emits one `ATM-I-HARVEST-SINK` info: `mint()` pushes the legacy line
into `diagnostics` and reports the `HarvestOutcome` fact into the session
(`extract/harvest/mint/mod.rs:92-94`); end-of-compile partition strips
compiler-classified lines from default and re-renders them into `compiler_diagnostics`
**only when requested** (`lib.rs:141`, `channels/mod.rs:55-85`; `HarvestOutcome →
Audience::Compiler` at `policy/mod.rs:48`). So:

- `compile({ files, baseSystem, logs: ['compiler'] })` → `result.compiler_diagnostics`
  carries one info per sink: `"{prop} under [{when}]: {n} harvested {value|values} minted"`
  (`policy/harvest.rs:12-24`) — `prop` + `when` exact, `minted` = net-new (Forge's
  infos count net-new: twin-skipped pairs never increment `minted`, `mint/mod.rs:60`).
- `kind` is NOT in the message. Derive it per sink with the compiler's own rule —
  first channel the prop accepts, Color → Transform → Url → Length else Keyword
  (`sinks.rs::sink_kind_for_prop`, `sinks.rs:97-109`) — by re-implementing that
  four-probe order over `canon::prop_accepts`… which TS cannot call. Two honest options:
  (a) the Rust reader (below) reports kinds; (b) the TS reader hardcodes the sink→kind
  map for the fixture's ~29 known sinks and asserts the info list equals the map
  (closed world, no drift surface — the fixture is fixed). Recommend (b) for the
  committed test, (a) for the evidence cross-check.
- Silently skipped sinks (unlowerable `when`) report no fact and no info
  (`mint/mod.rs:54-57`) — the census counts minting sinks only. Correct per the mission
  (a sink that mints nothing moves no bytes), but say so in the evidence.

## Pool census by kind — NOT exposed over N-API; Rust test reader

`HarvestPool` is internal to `compile()` (`lib.rs:120`): collected, minted from, dropped.
The per-sink `offered` lists (kind-accepted values, pre-twin-skip) exist only inside
`HarvestOutcome` facts, and facts do not cross N-API — the rendered info drops them
(`policy/harvest.rs` renders prop/when/minted only). Consequences:

- Gross per sink (`offered.len()`) and gross total are **Rust-side only**.
- Net-new is available both sides: Σ `minted` over infos, and
  `result.wants.filter(w => w.origin === 'harvest').length` (`Want.origin` serializes,
  `atom/want.rs:13-18`, harvest signs `HARVEST_ORIGIN`, `mint/mod.rs:34`).
- Class count: `result.stylePlans.length` (net, post-`AtomSet` dedupe) beside a
  stylesheet rule count.

Recommended Slice 1 reader for pool-by-kind + offered/gross: a `#[cfg(test)]` helper
that calls `collect_pool` + `classify_harvest_value` over the **committed fixture files**
(read from `tests/fixtures/harvest-enterprise/`, not inlined — no duplication, R3
reproducible) and prints/asserts the kind table. Runs under `pnpm agentrs c atomic`.
No API change, no compile option, no new fact.

Explicitly excluded: re-implementing `classify_harvest_value` in TS for the census —
a second implementation of a classifier with a fence (`classify.rs`, the §9 alphabet
fence) is FORBID-03-spirited drift bait for a research number. The Rust reader *is*
the classifier.

## What Slice 1 still needs — the shape of it

| Need | Form | Touches prod code? |
|---|---|---|
| Sink census + net-new | Test-only TS reader over `CompileResult` (`tests/harvest-census.test.ts`, ask 1) | No |
| Pool by kind + gross/offered | Test-only Rust reader over the fixture dir (`#[cfg(test)]`) | No |
| Leaf-only vs unbound bound | Join of the two (ask 3) | No |

Not a compile option, not a diagnostics fact. If HQ later wants gross/net-new in CI
long-term, that is a structured census fact — explicitly NOT Slice 1, which commits
evidence, not API.

## Pointers for the Slice 1 cook

- Backchannel request: `CompileRequest.logs = ['compiler']` (`types.rs:40-54`,
  `CompileResult.compiler_diagnostics`, `types.rs:81-83`).
- In-test compile precedent: `tests/cases/ATM-SEAM-07/spec.ts` (synthetic files,
  `compile()` from `js/index.js`, sheet regex counting, runtime byte-compare).
- System spec: `LIB_SYSTEM_SPEC` (`tests/helpers.ts:49`).
