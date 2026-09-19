# READY ask 2 — Pins table verification (every cited spec read)

Verdict: **all rows confirmed**. Two rows carry a precise condition that
the mission design already states (trace-∅ emits zero diagnostics);
one row carries an ordering note (lib re-sync before matrix). No row is
marked against.

Method: read each spec file + its world inputs, and checked the
*structural* reason traced output is ∅ (or ⊂ configured) — no imports,
no style bindings, nothing exported — against the tracer decision rule
(`analyzer.rs:250-281`: `exposes_style_props` AND (`uses_style_pipeline`
OR an edge to a primitive/traced target)).

## Neo case pins

| Pin | Spec read | World read | Verdict |
|---|---|---|---|
| NEO-SYNC-04 (`compile-request.spec.ts:52-84`) | exact 6 keys, `jsxHosts` = config ∪ generated primitives, byte-equal request, exact `jsx-elements.json` | `theme/{tokens,wants}.ts` only; `wants.ts` is `export const brand = css(…)` — a const, not a component (factories come from function declarations, `parser/component.rs:46-75`) | **CONFIRM** — traced = ∅ structurally; request untouched by design; artifact exact |
| NEO-SYNC-10 (`extends.spec.ts:52-61`) | exact `{primitives:[], upstream:['UpstreamCard'], local:['LocalPanel'], merged:[…]}` | theme-only + `upstream.ts` is import-free data; `wants.ts` is `css()`/`recipe()` consts (`recipe()` const is not a factory) | **CONFIRM** — traced = ∅; `local` stays `['LocalPanel']` |
| NEO-SYNC-03 (`portable.spec.ts:99`) | `base.jsxElements == []`, runtime-equals-data | config has no `jsxElements`; `wants.ts` is a `css()` const | **CONFIRM** — configured ∅ + traced ∅ → `[]` |
| NEO-SITE-11 (`chart.spec.ts`) | `merged ∋ Chart`, exactly one utility, paint proof | `Chart` (`ChartProps{p?,id?}`, `{...props}` into imported `Div`) is configured; `Site` has no props | **CONFIRM, robust both ways** — `Chart` traces (spread bindings + primitive edge) to the same name it configures; even if it did not, union keeps `merged ∋ Chart`; `Site` cannot trace (no bindings) and renders no style props, so the utility count cannot move |
| NEO-SITE-12 antihost | no `fs_12px`/`c_red` ghosts, exactly the control utility, probes classless | `Random` (style-*shaped* props, renders bare `<div>`, **zero imports**) is not configured; `Site` has no props | **CONFIRM — highest-value pin** — `Random` is structurally untraceable (no import edge can exist; `id` read is not a style binding), so this pin *will* catch engine over-tracing. It is the one pin that exercises the new path rather than vacuity |
| NEO-SITE-16 (`member.spec.ts:16-49`) | exactly the 2 member utilities, twin silent + transparent | `const NS = { Panel: Div }`, `App` **not exported**, config `['NSPanel']` | **CONFIRM** — the tracer only visits `module.exports` (`analyzer.rs:135-140`); nothing exported → traced = ∅; concat matching is extractor-side, untouched |
| `sync.test.ts:113-120,198-203,249-256` | `local/merged == ['CardFrame']`; extends merge; `baseSystem.jsxElements == []` | `writeProject` worlds: `theme/*.ts` with `css()` consts only | **CONFIRM** — component-free worlds → traced = ∅ through the real `sync → compileNative` path |

## Engine station pins

| Pin | Spec read | Verdict |
|---|---|---|
| ATM-SITE-13 (exactly one diagnostic, text kept) | `spec.ts`: wants 0, classes {}, plans 0, **exactly 1 diagnostic** (`missing primitive graph`, `<Foo>`, `App.tsx:2:10`); inputs are disk files, `App`/`Plain` have no props/bindings; harness also re-runs with virtual `files:` (`helpers.ts:190-197`) | **CONFIRM, CONDITIONAL** — `App`/`Plain` cannot trace (no bindings) so the host set stays empty and `report_missing_graph` fires once (`extract/mod.rs:118-130`; gate: unknown tags under a *non-empty* graph stay silent, `extract/jsx/mod.rs:213-228`). Condition: slice #3 must emit **zero** diagnostics for "traced ∅, no error" (virtual-input and disk-input alike) — exactly what the mission design states ("empty entry set → nothing, silently"). Any new warning here = 2 diagnostics = red |
| ATM-SEAM-02 (frozen request; golden) | `frozen.stylesheet/diagnostics/classes/atomCount` equal legacy; `jsxHosts:['ConfiguredHost']` admits `mt_4r`; bad-version leg expects exactly 1 `schemaVersion` error, preamble sheet, 0 atoms | **CONFIRM** — input has no forwarding wrapper (`Host` renders but binds nothing; `calls.ts` is a `css()` const), so both shapes trace identically and every equality holds. Bad-version rejects in `native.rs:39` *before* compile, so no trace runs there |
| ATM-SCAN-01 (include scoping) | asserts **no-errors** (not exact counts) + wants/classes per scope; `missed` leg (include matches nothing) expects zero wants | **CONFIRM** — inputs are `css()` consts (no components) under every scope; the `missed` leg aligns with silent-empty |

## Contract / downstream / pixels pins

| Pin | Spec read | Verdict |
|---|---|---|
| `contracts.test.ts:114-138` | `satisfies` + `toContain` assertions (`PortableBaseSystem.jsxElements ∋ Box`, request `jsxHosts` fixtures) | **CONFIRM** — optional `tracedJsxHosts?` is additive; no exact-shape assertion on `CompileResult` exists to break. (Observed: the one-line seam is already in the working tree, uncommitted.) |
| `distro.test.tsx:703-729` (`MonoText` upstream) | `local == []`, `upstream/merged ∋ MonoText`, `primitives ∋ Div`; distro is **core-synced** (`ref sync`, `@reference-ui/core`) and consumes lib's *published* `baseSystem` | **CONFIRM, with ordering note** — `MonoText` ∈ lib's configured 53 (verified in `jsx-elements.json`) **and** traced (slice-1 evidence row 22: yes), so post-#5 `merged ∋ MonoText` holds. Note: lib must be re-synced before the matrix run consumes the new artifact |
| lib CT 343 / 28 baselines | Voyage log attests `343/343` + `28 PNGs` over 5 waves (2026-09-18 17:40 UTC). Recount: 344 `test(` hits minus 1 regex `.test(` = **343** real tests; zero `test.skip`/`fixme` | **CONFIRM source** — "unchanged" is the acceptance criterion itself, verified by running at slice #5; the numbers check out |

## Cross-cutting conditions for slice #3 (already in the design)

1. Trace-∅ with no error emits **no** diagnostic (SITE-13's `toHaveLength(1)` is the tripwire).
2. Virtual-input compiles trace in-memory or treat as silent-empty — never a "cannot trace" warning (SITE-13's `ATM-ORDER-06` reversed-files leg + `expectEqualArtifacts` compare full results).
3. `tracedJsxHosts` is deterministic (sorted, unique) — same legs compare across runs.
