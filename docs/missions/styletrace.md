OPERATION: GO

# Mission: Full StyleTrace

Status: `done` — voyage opened 2026-09-18, closed 2026-09-19. All six slices landed; `jsxElements` hand-list deleted with zero drift; Book spot-checks are the one post-commit item (:5000 was down at acceptance).
Slice #1 landed in `535cf0eb2`. Plan rebuilt 2026-09-18 from the
three-crew probe (engine seam · Neo pins · gaps) and a root-trace probe.
Precursor to [Operation Overmatch](operation-overmatch.md): Overmatch
leaves `hosts.rs` untouched (§7.7) and states "hosts come from styletrace,
import-bound" (S18). This mission makes the first half of that sentence
true and hands the second half over with named rows.

Signal protocol (line 1 of this file): `OPERATION: READY` = the plan has
enough context for research agents to challenge it; `OPERATION: GO` = the
watcher starts implementation, slices in order. GO is written only after
the READY-phase asks below come back without a blocker.

## READY-phase asks (read-only; answer in `docs/evidence/`, then HQ flips GO)

1. **Challenge the design.** Can `StyleSurface::from_engine(base_system)`
   reproduce the disk surface exactly? Specifically: where do the spec's
   condition keys live on the Rust `BaseSystem` (breakpoints, named
   conditions, container queries) and do they match typegen's
   `StyleConditionKey` printer one-for-one? Answer with the two lists side
   by side on the `neo_decl_roots` fixture and on the real lib tree. A
   mismatch is not a blocker — it is the first red test of slice #3 — but
   name it now.
2. **Verify the pins table** by reading every cited spec (not the crew
   summary): confirm each "unchanged" verdict, or mark the row.
3. **D4 evidence.** Does `width`/`height` on `<KeyboardArrowDownIcon>` in
   `Collapsible.tsx` paint today (which atom, which site folds it)? Where
   exactly does the package chain stop for a lib re-export of an icon
   (package entry file, extension, or factory shape)? `/tmp` probe only.
4. **Confirm or override the defaults** below (D1 canon 125 · D2 no ·
   D3 (a) · D4 deferred). Silence = defaults.
5. **Naming pass** against `packages/reference-neo/docs/DOMAIN.md` and the
   styletrace README: `StyleSurface`, `TraceOutcome`, `ResolvedHosts`,
   `tracedJsxHosts` are proposals; better names welcome before code.

Blocker = anything that makes zero drift impossible at slice #5 or makes
the engine-owned surface narrower than the disk surface. Everything else
is a note for the slice that owns it.

## Standing rules for crews (from the landing doctrine)

- Lanes: slice #3 is `agent-rs` (`pnpm agentrs`); slice #4 is `agent-neo`
  (`pnpm agentneo`); slice #5 is the *only* lib edit and touches
  `ui.config.ts` only; lib CT runs through `pnpm agentct`. Uncharted lib
  edits: stop and report.
- No stashing. No snapshot rewrites without a per-pair attestation. No
  `--update-snapshots` sweeps. Probe scripts live in `/tmp`, never in the
  tree; evidence lives in `packages/reference-neo/docs/evidence/`.
- Quality gates are the reviewer: `pnpm agentrs q` zero errors (no
  `#[allow]`, files under 365/500, context structs over argument soup);
  `pnpm agentneo q` clean (no `any`, no suppressions, 2–6 sentence
  headers, no filename tables in READMEs).
- Every new case README is the index: first line is the claim, name the
  symbols, cite sibling ids (`ATM-SITE-13`, `NEO-SITE-12`, …), end with a
  `> Search terms:` line.
- A rebuilt binary is not picked up by `neo sync --watch`: restart
  `pnpm dev:lib` (check :5000 first) after `pnpm agentrs b`.
- One voyage-log line per merged slice, same format as the existing log.

## The idea

Engine gaps are scary because the capability boundary is tribal knowledge.
Doom agents will need that boundary as starting context — the rules of what
Reference can and can't do (Panda-like constraints, extended where we go
further). Before Doom, the boundary must become real instead of listed.

The concrete journey: bring StyleTrace fully up to speed until it is the
perception layer that makes hand-lists unnecessary.

## The claim

> Which JSX elements carry style props is discovered by the engine, per
> compile, from the code. `ui.config.jsxElements` is an escape hatch for
> shapes static tracing cannot infer — not a registry.

True when all four hold:

1. Neo-synced trees trace (slice #1 — done).
2. The traced set is computed **inside `compile()`** and returned on the
   compile result, with no dependency on files the sync has not written yet.
3. Neo publishes `configured ∪ traced` into `jsx-elements.json` and
   `baseSystem.jsxElements`, so downstream `extends` keep their fuel.
4. `packages/reference-lib/ui.config.ts` loses its 53-line `jsxElements`
   list with zero drift (defined below).

## Zero drift, defined

The witness set **W**, frozen in slice #2 before any engine change:

| Witness | Where | Pin |
|---|---|---|
| The sheet | `packages/reference-lib/.reference-ui/styled/styles.css` | byte-identical |
| Host artifact | `.reference-ui/system/jsx-elements.json` | byte-identical (`local` = the same 53) |
| Portable system | `.reference-ui/system/baseSystem.mjs` | byte-identical |
| Type surface | `.reference-ui/react/react.d.mts` | byte-identical |
| Component snapshots | lib Playwright CT (`src/components/*/__e2e__`, 343 tests, 28 attested baselines from landing) | 343/343, zero rewrites |
| Book | `pnpm capture` spot-check of routes whose components sit in the 53 | eyes, recorded |

Allowed deltas at acceptance — exactly two: `ui.config.ts` itself, and
`system/compile-request.json` `jsxHosts` shrinking to primitives only (the
53 are now *discovered*, not *requested*; the request records what the
author asked for). Anything else that moves is drift: stop, attribute,
decide. The landing oracle loop applies verbatim — a moved pin is analyzed
before it is re-pinned; "discovery working" (a wrapper that always should
have painted) is re-pinned with evidence; everything else is a tracer bug.

## State of play (probed 2026-09-18)

1. **Slice #1 holds.** Neo declaration roots resolve
   (`modules/styletrace/src/resolver/tracer/mod.rs:17-41`,
   `analysis/primitive_metadata.rs:12-25`). Root-trace probe
   (`/tmp/st-plan-root-probe.mjs`, read-only) against the current binary:

   | Root passed to `trace(root, <lib>)` | Count | vs 53 | Time |
   |---|---:|---|---:|
   | `<lib>` (what `hosts.rs` passes in production) | 53 | 0 missing · 0 extra | 1.5 s |
   | `<lib>/src` | 53 | 0 missing · 0 extra | 0.7 s |
   | `<lib>/book` | 0 | — | 4 ms |

   Book-local wrappers contribute nothing; the 3,857 icon re-exports in
   `packages/reference-lib/src/index.ts:53+` contribute nothing (same as
   core's 53). Deletion is byte-safe **once the traced set reaches the
   compile and the publish**.

2. **The production leg is still dead — for a different reason than the
   B7 comment says.** `sync()` wipes `.reference-ui/` first
   (`packages/reference-neo/src/sync/index.ts:55`), then compiles (`:77`).
   Atomic's `hosts::collect_hosts` traces `sourceRoot` with
   `declarationRoot` = the folder that was just deleted
   (`modules/atomic/src/hosts.rs:19-27`) → `Err("missing StyleProps
   declaration entrypoint")` → `HashSet::new()`, silently. Same under
   `neo sync --watch`. So today's extraction gate is exactly
   `configured ∪ primitives`, and the comment in `ui.config.ts:15-21`
   ("needs react/types/style-props … only in core's Panda typegen") is
   stale: slice #1 removed that reason; the order-of-operations reason and
   the missing result plumbing remain.

3. **Neo publish is config-only.** `resolveJsxElements(config)`
   (`src/sync/jsx-elements.ts:19-29`) never sees a traced name;
   `publish/system.ts:36-50,175-188` writes `jsx.merged` into
   `baseSystem.jsxElements` and the full artifact into
   `jsx-elements.json`. `CompileResult` has no host field
   (`packages/reference-rs/contracts/types.ts:92-99`). Delete the list
   today and `local: []` / `baseSystem.jsxElements: []` propagate through
   `extends` — `matrix/distro/tests/unit/distro.test.tsx:703-729`
   (`MonoText` upstream) goes red and every matrix package loses hosts.

4. **StyleTrace has no in-memory surface.**
   `analysis/analyzer.rs:55-58` always reads style-prop names and
   primitive names from disk. The engine already owns both truths:
   `runtime::get_style_prop_names()` (873 names: canon properties +
   aliases + `r`/`size`/`weight`, `modules/atomic/src/runtime/plan.rs:81-97`)
   and canon `PRIMITIVE_JSX` (125 names incl. SVG children,
   `modules/canon/src/html.rs`). Two deltas to respect: the published
   `StyleProps` is those 873 **plus `StyleConditionKey`** (≈79 condition
   keys, `src/sync/publish/types-bundle.ts:47-56`) — the disk surface sees
   conditions, the runtime list alone does not; and Neo publishes 101
   primitives (`src/primitives/tags.ts`, no SVG children) against canon's
   125.

5. **Two silent skips.** `hosts.rs:24-27` maps any trace error to ∅ with
   no diagnostic, and one unparsable file fails the whole trace
   (`analyzer.rs:61-69`). Both are the fail-open failure mode Overmatch
   forbids ("No silence"). They get fixed here, before Overmatch starts.

6. **Gaps, re-characterized** (survey numbering kept):

   | Gap | Survey said | Probe found | Owner |
   |---|---|---|---|
   | #0 decl roots | unresolvable | fixed (slice #1) | done |
   | #1 Neo never calls trace | wire a TS call | wrong fix — trace runs in the engine but reads a wiped folder; the fix is an engine-owned surface + a result field (slice #3/#4) | this mission |
   | #2 `ToastHost` | vestigial? | traced **by value flow**: destructures `gap` and passes `gap={gap}` into `<Div>` (`ToastSystem.tsx:873-874, :974`), though `ToastHostProps` carries no `StyleProps`. It is live paint — the use site `<ToastHost gap>` is the only place the value can fold. Keep. Record for Overmatch: the host rule is "a value that reaches a primitive style prop", not "a type that extends `StyleProps`" | classified |
   | #3 primitive alias | `export const PrimitiveJsxMarker = Div` | it is a **non-exported** file-local alias (`matrix/primitives/src/index.tsx:7`); StyleTrace only emits exported components (`parser/component.rs:165-166` ignores identifiers) and must not turn a file-local name into a project-wide host (that is a name bag). Correct home: extractor resolves the tag through its binding | Overmatch row (handoff) |
   | #4 member spellings | `NS.Panel` ↔ `NSPanel` | `const NS = { Panel: Div }` (NEO-SITE-16); object-literal namespaces are not modeled; lib's own `Overlay.Content = OverlayContent` works through the concat rule because `OverlayContent` traces | HQ decision D3 |
   | #5 dangling doc | `PLAN.md` | fixed (slice #1) | done |

## Design: surface in, hosts out

One analyzer path. The **surface** (which prop names are style props, which
imported names are primitives) is an input, built two ways:

- `StyleSurface::from_declaration_root(root)` — today's disk path
  (`react/types/**`, Neo `react.d.mts`, `styled/types/*`). Stays for core's
  `trace()` N-API and for the canaries that prove the round-trip.
- `StyleSurface::from_engine(base_system)` — `get_style_prop_names()` ∪ the
  spec's condition keys (breakpoints, named conditions — the same set
  typegen prints as `StyleConditionKey`) ∪ canon `PRIMITIVE_JSX`. No file
  read. This is what `compile()` uses.

Then:

- **Entry set** = the include-scoped source set atomic already collects
  for extraction (`sources::collect` / `IncludeScope`, ATM-SCAN-01). A host
  is a component *the project compiles*; imports are still followed
  anywhere (relative, packages, `node_modules`) as edges. Lib: `src/**` +
  `book/**` — identical result to the root probe (53), ~half the time.
- **Failure is a diagnostic.** Unparsable file → one located warning, the
  file contributes no hosts, siblings trace. Empty entry set → nothing,
  silently (genuinely empty is not a skip). Any other trace error → one
  warning; configured hosts and primitives still gate extraction. No
  path returns ∅ without a message.
- **`compile()` returns what it found.** `hosts::resolve(request)` yields
  `{ traced, configured }`; the gate stays `traced ∪ configured` (as
  `hosts.rs` does now); `CompileResult` gains `tracedJsxHosts: string[]`
  (sorted, unique, PascalCase component names). Request shape is
  unchanged — `jsxHosts`, `sourceRoot`, `declarationRoot` (now purely the
  package-resolution root), `include`.
- **Neo publishes the union.** `resolveJsxElements(config, traced)`:
  `local = configured ∪ traced`, `merged = upstream ∪ local`,
  `primitives: []` as today. The request Neo sends is unchanged
  (`configured ∪ upstream ∪ primitives`), so `compile-request.json` keeps
  its frozen six keys.
- **Config becomes an escape hatch.** `ReferenceUIConfig.jsxElements`
  doc (`src/config/types.ts:41-45`) already says it: "generated surfaces
  static tracing cannot infer". Add: member spellings (D3). Validation is
  unchanged (`validate.ts:57-64`, optional today).
- **ATM-SITE-13 is untouched.** Its input has no wrappers and no imports:
  engine-surface trace yields ∅, `jsxHosts` is absent, the host set is
  empty, the message "no StyleProps hosts resolvable (missing primitive
  graph); skipped styles on <Foo>" still fires exactly once. Text kept.

Rejected: **reorder `sync()`** to publish `react.d.mts` and the types
bundle before `compileNative` so the disk path resolves. It works, but it
makes write order load-bearing in `sync` and `--watch`, keeps the engine
reading its own output to learn what it already knows, and leaves hermetic
stations unable to trace without fixture declarations. The engine is the
source of truth for both sets; parsing `.d.mts` to rediscover them is
circular. The disk path survives only as the round-trip witness.

Also rejected: feeding traced names back into the *request* `jsxHosts`.
That would move NEO-SYNC-04's exact `jsxHosts` pin and blur "asked for"
with "discovered".

## Slices

Smallest-first, each with its proof, gates and lane. Slices #3 and #4 can
run as two crews once the contract field name is committed (a one-line
`contracts/types.ts` PR is the seam).

### Slice #1 — Neo decl-root resolution (gap #0, #5) — DONE

Landed in `535cf0eb2`. Evidence:
[`styletrace-slice1-traced-vs-53.md`](../../packages/reference-neo/docs/evidence/styletrace-slice1-traced-vs-53.md)
(53 = 53), canary `prop_resolution::loads_real_reference_core_style_props`
green, styletrace README re-pointed at this file.

### Slice #2 — Witness baseline + discovery ledger (read-only)

Scope: no source changes. Freeze W and classify every name.

1. Re-sync lib with the current binary and config
   (`pnpm --filter @reference-ui/lib sync`; the Book watcher on :5000 may
   be running — this only rewrites the gitignored folder it already
   watches). Copy W's four artifacts + `compile-request.json` to
   `packages/reference-neo/docs/evidence/styletrace-baseline/` with a
   README (same shape as `landing-baseline-core/`). Record binary
   provenance (`dist/native/*.node` mtime vs newest `.rs`).
2. Confirm CT green pre-change: `pnpm agentct` on the landing top-5
   witnesses (button-variants vitest, Tabs vitest, Portal theme contract,
   Toast CT, Button+Primitives CT), then the full CT run (343).
3. **Ledger** (`docs/evidence/styletrace-ledger.md`): for each of the 53,
   how it traces (boundary type shape · forwarding shape · primitive
   import), using the crew table as the seed (`MonoText` `StyleProps & …`
   + rest into `Code`; `Field` `Omit<PrimitiveProps<'div'>,…>` + rest into
   `Div`; `Tab`/`SliderThumb` `PrimitiveProps<'…'>` + rest; `ToastHost`
   by value flow). Mark the 37 names with zero styled call sites in
   lib+book as *vestigial-at-use-site* — information only, not a deletion
   list: they are still boundaries.
4. **Not-traced witnesses**, each with a verdict *refusal-by-design* or
   *tracer gap* and, for gaps, a pixel question ("does this prop paint
   today?"): the 3,857 icon re-exports (`src/index.ts:53+`; `createIcon` →
   `IconShell` → `Div` with rest spread is the `icon_factory` shape, so why
   does the package chain stop? likely the package entry resolves to a
   `.mjs`/`.d.ts` that `source_files.rs:62-69` refuses); `Popover.Content`,
   `Menu.Trigger`, root `Overlay` used with style-looking attributes in
   Book (`PopoverContent`/`MenuTrigger` are not in the 53 — boundary does
   not expose style props, or gap?); the name-collision set (`isolation`,
   `container`, `offset`, `size`) as a caution list.
5. Feed D4 (package re-exports) to HQ with that evidence. Nothing in this
   slice changes behaviour.

Proof: baseline folder on disk; ledger published; CT 343/343; voyage-log
line.

### Slice #3 — Engine: surface in, hosts out (agent-rs lane)

Scope: `modules/styletrace`, `modules/atomic/src/hosts.rs`,
`modules/atomic/native.rs`, `contracts/`. No Neo, no lib.

Build:

- `styletrace::StyleSurface { style_props: BTreeSet<String>, primitives: BTreeSet<String> }`
  in a new `analysis/surface.rs`; `from_declaration_root` moves the
  existing resolver/primitive-metadata calls behind it;
  `trace_style_bindings_with_surface(entries: &[PathBuf], source_root, package_root, &surface) -> TraceOutcome { bindings, diagnostics }`.
  `analyzer.rs` (375 lines, already past the 365 soft line) splits:
  surface acquisition out, entry-set handling out, the walker stays.
- `from_engine` lives in atomic (it needs canon + `BaseSystem`):
  `hosts.rs` builds the surface, computes the include-scoped entry set
  from the same source list extraction uses, calls the trace, converts
  `TraceOutcome.diagnostics` into compile warnings, returns
  `ResolvedHosts { traced, configured }`. `hosts.rs` stays small; if it
  passes ~150 lines, `hosts/` becomes a folder with a README.
- `CompileResult.traced_jsx_hosts: Vec<String>` (serde
  `tracedJsxHosts`), threaded through `native.rs`; `contracts/types.ts`
  `CompileResult.tracedJsxHosts?: string[]`, fixture `compile-result.json`
  updated, `contracts.test.ts` pin added.
- N-API `analyzeStyletrace` / `analyzeStyletraceBindings` unchanged (core
  keeps the disk path). Optional: `analyzeStyletraceWithSurface` is *not*
  added — Neo gets hosts from the compile result, not from a second call.

Stations (IDs deconflicted against Overmatch's minted ranges
`ATM-SITE-24..55`, `ATM-SEAM-04`, `ATM-SCAN-01` landed):

| Station | Claim |
|---|---|
| `ATM-SITE-56` `[seam]` | Zero-config discovery: a local `Card` forwarding `StyleProps` into `Div` (imported from `@reference-ui/react`) makes `<Card mt="4r">` in a sibling file extract with `jsxHosts` absent and no declarations on disk; `tracedJsxHosts == ['Card']`. Negatives in the same input: `Random` → bare `<div>` and `Label` with no style props at its boundary are **not** traced and `<Random color>` stays silent (SITE-12's antihost, now at the engine). |
| `ATM-SITE-57` `[seam]` | Failure is a located warning: one unparsable file under `include` yields exactly one warning naming the file; siblings still trace; configured hosts still gate; no error, no empty-set silence. |
| `ATM-SCAN-02` `[seam]` | Discovery entry set is include-scoped: a forwarding wrapper defined outside `include` is not a host even if a file inside `include` renders it — unless that file imports it (then it is an edge target, and the *importing* wrapper's own name is what traces). Twin of ATM-SCAN-01. |
| `ATM-SEAM-05` `[seam]` | Result carries `tracedJsxHosts`; request shape unchanged; the ATM-SEAM-02 golden is byte-identical (its input has no forwarding wrapper). |

Rust tests: `src/tests/surface.rs` — **the round-trip**:
`from_engine(fixture spec)` equals `from_declaration_root(neo fixture)`
on style props ∪ conditions (the `neo_decl_roots` fixture's eight names),
and `from_engine.primitives ⊇` every `declare const` in `react.d.mts`
(the 24 SVG-only canon names are the documented superset). The
`loads_real_reference_core_style_props` canary is extended to assert the
same equality on the real lib tree, so a future typegen/canon drift
surfaces as a red test, not as silent host loss. Styletrace TS cases:
`entry_scope`, `parse_failure_isolated` (folder + README + spec + golden
`components.json`, same shape as `direct_wrapper`).

Proof and gates: `pnpm agentrs b` → `pnpm agentrs c styletrace` /
`c atomic` → `pnpm agentrs v styletrace` / `v atomic` → `pnpm agentrs q`
(zero errors; `analyzer.rs` back under 365). Full atomic station suite:
any golden that moves is listed and attributed — a station input whose
wrapper now correctly traces is "discovery working" (re-bless with the
diff shown); anything else is a bug. Expected: zero moves (every station
input that wanted a host declared it). Timing recorded: lib root trace
≤ 1 s inside `compile()`. Full Neo suite (`pnpm agentneo run`, 151) still
green with the new binary — case worlds with forwarding wrappers all
configure them, so no sheet moves; verify, don't assume. **Restart
`pnpm dev:lib` afterwards** — the watcher does not reload a rebuilt
binary.

### Slice #4 — Neo publishes discovery (agent-neo lane)

Scope: `packages/reference-neo/src/sync/{index,jsx-elements,native}.ts`,
`src/config/types.ts` doc comment, one new case, docs. No Rust, no lib.

Build:

- `NativeCompileResult.tracedJsxHosts?: string[]` in the seam
  (`src/sync/native.ts`); `resolveJsxElements(config, traced)` with
  `local = uniqueSorted([...configured, ...traced])`; `sync()` calls it
  *after* `compileNative` with `result.tracedJsxHosts ?? []`. The request
  is built as today. Publish is unchanged in shape.
- `jsxElements` doc comment → escape-hatch wording (generated surfaces,
  member spellings). `docs/DOMAIN.md` gains the three words this mission
  makes load-bearing: **host** (a JSX name whose style props extract),
  **traced** (discovered by StyleTrace), **configured** (from
  `jsxElements`).

Case `NEO-SYNC-15` (next free; `sync: true`): zero-config world with
`Card` (forwards `StyleProps` into `Div`), `Random` (bare `<div>`),
`Label` (no style props), and `<Card p="1r">` at a use site. Asserts:
`jsx-elements.json == { primitives: [], upstream: [], local: ['Card'], merged: ['Card'] }`;
`baseSystem.jsxElements == ['Card']`; `compile-request.json.jsxHosts` =
primitives only (discovery is not in the request); sheet has exactly the
Card-site utility; paint proof on `#card`; a second sync is byte-equal
(determinism). README first line is the claim; row appended to
`tests/cases/sync/TESTS.md` after SYNC-14.

Proof and gates: `pnpm agentneo run NEO-SYNC-15`; full `pnpm agentneo run`
(152) — the pins in the table below must not move; `pnpm agentneo q`
clean; `src/sync/sync.test.ts` unchanged and green.

### Slice #5 — Delete `jsxElements` from lib (acceptance)

Scope: `packages/reference-lib/ui.config.ts` only.

1. Delete the 53 names and the B7 comment; leave a one-line note that
   hosts are discovered and `jsxElements` is the escape hatch.
2. Re-sync lib. Diff every W artifact against the slice #2 baseline:
   `styles.css`, `jsx-elements.json`, `baseSystem.mjs`, `react.d.mts`
   byte-identical; `compile-request.json` differs only in `jsxHosts`
   (the 53 gone). Anything else → stop, oracle loop, no re-pin without
   attribution.
3. Full lib CT (343/343, zero rewrites). Book spot-check captures for
   Toast, Menu (`<Overlay.Content minW>` through the concat rule), Field,
   Slider, Tabs.
4. Voyage-log line + mission status → `done` candidate; file moves to
   `completed/` after HQ word.

### Slice #6 — Tail (bounded, mostly handoff)

- `matrix/primitives` `jsxElements: ['PrimitiveJsxMarker']` **stays**: the
  package is core-synced (`defineConfig` from `@reference-ui/core`) and
  the shape is an extractor binding question (gap #3 → Overmatch row).
  Its e2e pin (`primitives-contract.spec.ts:176-193`) is untouched by this
  mission.
- `packages/reference-icons` `ICON_JSX_NAMES` **stays**: core-synced, no
  in-repo `extends` consumer, core's own traced leg is out of scope (core
  is frozen). The day icons move to Neo, `ATM-SITE-56` + the
  `icon_factory` station are the zero-config proof to run.
- `NEO-SITE-16` stays config-spelled until D3 is decided.
- Doc sweep for "jsxElements" wording (`docs/REFERENCE_UI.md`,
  `matrix/CHAIN_RULES.md`, Neo README) → escape hatch, not requirement.
- Update `styletrace-survey.md` §2 consumer table with the new C-row
  (`CompileResult.tracedJsxHosts` → Neo publish) and strike C7's "the only
  traced leg".

## Pins that must not move

| Pin | What it holds | Expected after #3/#4/#5 |
|---|---|---|
| `NEO-SYNC-04` `compile-request.spec.ts:52-84` | exact `jsxHosts` = config ∪ primitives; exactly six request keys; byte-equal rebuild; exact `jsx-elements.json` | unchanged — world has no components, traced = ∅, request untouched by design |
| `NEO-SYNC-10` `extends.spec.ts:52-61` | exact `{ upstream:['UpstreamCard'], local:['LocalPanel'], merged:[…] }` | unchanged — world is theme + `css()`/`recipe()` only |
| `NEO-SYNC-03` `portable.spec.ts:99` | `baseSystem.jsxElements == []` | unchanged — world is `theme/` only (tokens + `css()` wants, no components) |
| `NEO-SITE-11` `chart.spec.ts` | `merged ∋ Chart`; exactly one utility | unchanged — `Chart` traces to the same name it configures |
| `NEO-SITE-12` antihost | `Random` (bare `div`) never paints | unchanged — definition-based discovery never guesses from PascalCase; this is the negative that matters |
| `NEO-SITE-16` `member.spec.ts:16-49` | `NSPanel` config spelling admits `<NS.Panel>` | unchanged (D3) |
| `sync.test.ts:113-120,198-203,249-256` | artifact content from config | unchanged (test worlds have no wrappers) |
| `ATM-SITE-13` | fail-closed missing-graph error, exactly one diagnostic | unchanged, text kept |
| `ATM-SEAM-02`, `ATM-SCAN-01` | frozen request; include scoping | unchanged goldens |
| `contracts.test.ts:114-138` | `PortableBaseSystem.jsxElements ∋ Box`; request `jsxHosts` fixtures | unchanged; one added pin for `tracedJsxHosts` |
| `distro.test.tsx:703-729` | `MonoText` upstream via `extends` | unchanged — `MonoText` traces; matrix runs against lib's published `baseSystem` |
| lib CT 343 / 28 baselines | pixels | 343/343, zero rewrites |

## Decisions for HQ

Defaults, so no crew is blocked: **D1 canon 125 · D2 no · D3 (a) · D4
deferred to its own wave after slice #5.** Crews proceed on these unless
HQ overrides in this file.

- **D1 — primitive universe for the engine surface.** Recommend canon
  `PRIMITIVE_JSX` (125). It is the engine's truth, a strict superset of
  what Neo exports (101), and the 24 SVG-only names cannot produce a false
  host (a wrapper importing `Path` from `@reference-ui/react` is already a
  broken import). Follow-up, not this mission: derive Neo's `TAGS` from
  canon so the "Neo-owned copy" comment in `tags.ts` retires.
- **D2 — provenance in the artifact.** Should `jsx-elements.json` gain a
  `traced` array beside `local`? Useful for Doom/test-index (which hosts
  are discovered vs declared). Cost: NEO-SYNC-04 and NEO-SYNC-10 pin the
  exact object and would be re-pinned. Recommend **no** inside this
  mission (zero drift is the point); revisit when the index wants it.
- **D3 — member spellings (gap #4).** Three options: (a) keep
  `jsxElements` as the escape hatch for `const NS = { Panel: Div }`
  (recommended now; costs nothing; lib does not need it); (b) StyleTrace
  emits object-literal namespace members whose values resolve to
  primitives or traced wrappers as *dotted* hosts (`NS.Panel`) — `allows_jsx_tag`
  (`extract/mod.rs:102-114`) already matches the dotted name before the
  concat fallback, so no extractor change; (c) Overmatch's binding walk
  resolves `<NS.Panel>` through `NS` → object literal → `Div` → import,
  needing no host name at all. (c) is the principled end state and is
  filed as a handoff row; (b) is available if a real consumer needs it
  before Overmatch Ph4.
- **D4 — package re-exports as hosts.** Lib re-exports 3,857 icons; none
  trace today; core's 53 agreed. Parity says keep refusing; correctness
  says `<KeyboardArrowDownIcon width height>` inside `Collapsible.tsx`
  should paint through the icon's `IconShell → Div` chain. This *will*
  move pixels (chevrons already carried AA footnotes in the landing
  waves), so it is its own attested wave with its own oracle loop —
  **after** slice #5, never folded into it. Slice #2 brings the evidence
  (does the width paint today; where does the package chain stop).

## Handoff to Overmatch

What Overmatch inherits when it opens, and the rows this mission files
into its catalog (IDs minted by the Overmatch cataloger; described here so
nothing is lost):

- `hosts.rs` settled: engine-owned surface, include-scoped entry set,
  diagnostics instead of silence, `tracedJsxHosts` on the result. Overmatch
  §7.7 "untouched except `Span` plumbing" holds; the styletrace warnings
  are ready to take a `DiagnosticCode` when §7.4 lands.
- **Row (SPEC-V2 candidate): JSX tag resolves through a file-local alias
  of an imported primitive** — `const Marker = Div; <Marker mt="4r">`
  extracts by binding, no host name involved. Panda contrast: v2 resolves
  identifiers through scope (`scope.rs`). Witness: `matrix/primitives`
  (`jsxElements: ['PrimitiveJsxMarker']` retires when this lands).
- **Row (SPEC-V2 candidate): member tag resolves through an object-literal
  namespace binding** — `const NS = { Panel: Div }; <NS.Panel p="sm">`
  extracts by binding; the concat spelling stays as the legacy config
  path. Witness: NEO-SITE-16 without `jsxElements`.
- **Boundary rule note for the cross-file resolver (Ph4):** a host is a
  component through which a value reaches a primitive style prop
  (`ToastHost`'s `gap`), not one whose props type extends `StyleProps`.
  StyleTrace's destructure-name rule is load-bearing for lib paint; a
  type-only rule would drop it.
- StyleTrace's entry-set rule (definitions the project compiles) is the
  same line Overmatch draws for sites: `include` decides what is
  extracted; imports decide what is *resolved*.

### Slice #6 tail record (handoff note, 2026-09-18)

Three stays, confirmed:

1. `matrix/primitives` `jsxElements: ['PrimitiveJsxMarker']` stays, and its
   e2e pin (`primitives-contract.spec.ts:176-193`) is untouched — the shape
   is an extractor binding question, now filed as gap #3 below.
2. `packages/reference-icons` `ICON_JSX_NAMES` stays (core-synced, no
   in-repo `extends` consumer, core's traced leg out of scope). The day
   icons move to Neo, `ATM-SITE-56` + the `icon_factory` station are the
   zero-config proof to run.
3. `NEO-SITE-16` stays config-spelled per D3 (recommended (a): `jsxElements`
   as the escape hatch for `const NS = { Panel: Div }`; end state (c) is an
   Overmatch binding row).

Gap #3 filed into [Operation Overmatch](operation-overmatch.md) §4
OUT-OF-AXIS table ("JSX tag through a file-local alias", StyleTrace
handoff): the Overmatch mission did not already cover the
extractor-binding question (nearest rows are S12 site-identity-through-
re-export and the §4 `matchTag` host-guessing row — neither resolves a
JSX tag through a file-local alias), so a new row was added; its SPEC-V2
ID is minted by the Overmatch cataloger.

## Captain's notes (not planned, just recorded)

- This is the oracle loop applied to perception: snapshots pin behavior,
  the engine change must not move a pixel. The root probe says it will
  not — the traced 53 *are* the configured 53. The work is the plumbing
  that lets the engine's own answer reach the compile and the publish.
- The `jsxElements` deletion is the acceptance gate, not the work — the
  work is whatever StyleTrace gaps the snapshots reveal along the way.
  Two revealed themselves without moving a pixel: the wiped-folder
  ordering and the swallowed error.
- "Fails closed" was doing two jobs — refusing to guess, and hiding a
  broken leg. After this mission it does only the first.
- Feeds the [test index](test-index.md) (discovered capabilities become
  searchable: the new station READMEs are the index) and the
  [Doom agent](doom-agent.md) (the boundary becomes Doom's starting
  context: *hosts are discovered; config is the exception list*). The
  three missions compose.

## Evidence

- [`styletrace-survey.md`](../../packages/reference-neo/docs/evidence/styletrace-survey.md)
  — the 16-consumer table, gap list, snapshot pins (2026-09-18).
- [`styletrace-slice1-traced-vs-53.md`](../../packages/reference-neo/docs/evidence/styletrace-slice1-traced-vs-53.md)
  — per-name proof that Neo trees trace.
- `styletrace-baseline/` and `styletrace-ledger.md` — produced by slice #2.
- Probe scripts (re-runnable, `/tmp` only, no tree writes):
  `/tmp/styletrace-survey-probe.mjs`, `/tmp/st-slice1-diff.mjs`,
  `/tmp/st-plan-root-probe.mjs`.
- Engine binary at plan time: `packages/reference-rs/dist/native/virtual-native.darwin-x64.node`,
  newer than every `.rs` under `modules/` (checked 2026-09-18).
