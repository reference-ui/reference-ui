# Reference system finalization report

Date: 2026-10-07. For the agent wave.

## Finalization state

Landed and verified (uncommitted, in tree):

- Font-weight divergence fix: bare `weight` resolves against the active
  family (`resolve/font/scope.rs` + extract-time wraps; wants-only).
  `pnpm agentrs t` green, 0 violations; `ATM-COND-05` / `ATM-LAYER-15`
  goldens extended.
- System docs section: `system.mdx` + beginner Fonts guide (`fonts.mdx`,
  `fonts-sections.tsx` workaround) registered in
  `collections/runtime.ts`; docs build green, `/fonts` verified on :5174.
- MDX fragment exclusion: fragment matches gated to JS-bundleable
  extensions (`collect/constants.ts`, `scanner.ts` `scanFlagsOf`);
  `ref sync` on docs passes with the new `font-weight_*` utilities.

Diagnosed, fix NOT landed (this report's body):

- `ref sync` 15s: tasty drain on the one-shot critical path (Arcs 1–2).
- Native MDX support via `mdx-rs` port (Arc 3).

## TL;DR

`ref sync` one-shot on the tiny docs app reports `ready in 15454 ms`.
The timer is accurate. ~11s of it is the **tasty phase** (`types/tasty`
manifest build), which the one-shot CLI **awaits** before printing ready.
The atomic path (scan → eval → compile → publish: the actual codegen + CSS
critical path) is fine at ~1s. Inside tasty, the time burns in
`resolve_external_import` with **zero memoization**: 8,067 resolutions,
7,922 `find_installed_declaration_provider` fallbacks, 242,578
`package.json` re-reads — for **19 distinct specifiers**.

Two independent fixes, landable in either order:

1. **Diet** (30 lines, byte-identical): memoize external resolution per
   scan, including negatives. Predicted −11s on docs.
2. **Isolation**: stop awaiting the tasty drain in one-shot `ref sync`
   (make it background / incremental / skippable). Tasty is not consumed
   by anything in the dev loop.

## Symptom (exact repro)

```bash
pnpm --filter @reference-ui/reference-docs exec ref sync
# REF v0.0.0 ready in 15454 ms — CSS: 299.4 KB — Warnings: 1
```

Same world under `ref sync --watch`: resync one-liner reports **134 ms**.
Corpus: 11 documents. Nothing in the docs changed between the two runs.

## The timer is accurate (not a measurement artifact)

One-shot reporting lives in
`packages/reference-neo/src/cli/sync.ts`:

- `:41` stamps `started = Date.now()`
- `:42` awaits `sync()` — the atomic path
- `:43–44` awaits `flushReferenceBuild(cwd)` — **the tasty drain**
- `:89` prints `elapsedMs: Date.now() - started` — covers **both**

So "ready in 15s" = atomic sync + tasty drain. No clock skew, no double
count. The watch resync path does not flush, hence 134 ms.

## Root-cause chain (with evidence)

1. `sync()` itself is already correct. End of
   `packages/reference-neo/src/sync/index.ts:283-288` schedules the tasty
   phase via `scheduleReferenceTastyPhase` and never awaits it ("perf law
   holds by signature"). Atomic returns in ~1s.
2. The one-shot CLI then blocks on the drain
   (`cli/sync.ts:43-44`, `flushReferenceBuild` from
   `reference/bridge/init.ts`). This is the only thing standing between a
   1s sync and the 15s report.
3. The drain runs tasty `scanAndEmitModules` → `resolve_external_import`
   (`packages/reference-rs/modules/tasty/src/scanner/packages.rs`) →
   `find_installed_declaration_provider` fallback
   (`scanner/packages/package_entry.rs`) → `read_package_json`
   (`scanner/packages/package_json.rs`) with no cache — every fallback
   re-walks the disk.
4. Measured with temporary Rust counters (since reverted), `sample`, and
   a Node cpuprofile, all agreeing:

| Counter | Value |
| --- | --- |
| `resolve_external_import` calls | 8,067 |
| `find_installed_declaration_provider` fallbacks | 7,922 |
| `read_package_json` reads | 242,578 |
| Distinct specifiers behind all of it | 19 |
| Tasty share of one-shot wall | ~11s of ~13–15s |

## Why scale tests missed it, and why watch is fast

- Cost scales with **distinct external specifiers × fallback cost**, not
  corpus size. 19 specifiers × ~8k uncached resolutions × ~30
  package.json reads each = 11s on an 11-document app. repos stress-tested
  against "massive systems" never isolated this axis.
- Watch is fast because of the once-guard: the tasty manifest persists in
  `.reference-ui/` (preserved across staged commits,
  `sync/index.ts:224-225`) and the refresh only fires when the manifest
  never landed at all — cold worlds and killed runs. Every warm resync
  skips tasty entirely.

## Proposed arcs for agents

### Arc 1 — Memoize external resolution (diet, `agent-perf`)

Where: `packages/reference-rs/modules/tasty/src/scanner/packages.rs`
(+ `package_entry.rs`, `package_json.rs` as needed).

What: per-scan memo of `resolve_external_import` results keyed by
specifier **including negative / fallback outcomes**. Same inputs →
same manifest bytes, so output must be byte-identical.

Bar: counters show ≤ ~19 resolutions and ~19 package.json reads on the
docs repro; `ref sync` one-shot drops by ~11s; tasty + neo suites green;
`pnpm agentrs q` clean. Take the bench lock per `agent-perf` protocol.

### Arc 2 — Tasty off the one-shot critical path (isolation, `agent-neo` + `agent-rs`)

Where: `packages/reference-neo/src/cli/sync.ts:43-44`,
`reference/bridge/{init,tasty-build,run}.ts`.

What (pick one; all beat the drain):

- (a) Don't await the drain in one-shot: print ready after atomic, let
  the background landing report on its own line (the `foldRefDiagnostics`
  plumbing already anticipates undrained callers).
- (b) Incremental manifest: skip the rebuild when no input changed
  (stronger than the current landed-or-not once-guard).
- (c) `--skip-tasty` / `--no-ref` flag for the dev loop.

Bar: cold one-shot `ref sync` on docs reports ≤ ~2s; manifest still lands
(and a later sync retries a failed background build, per the existing
contract in `sync/index.ts:64-72`); `ref sync --json` diagnostics stay
parseable; neo suite green; `pnpm agentneo q` clean.

### Arc 3 — Native MDX support (separate; `mdx-rs`, measured)

Context, not cause: MDX-to-JS on the real 11-file corpus costs
**12.6 ms/pass** (`@mdx-js/mdx`) vs **2.9 ms/pass** (`@rspress/mdx-rs`).
Either is noise next to 15s — MDX transform choice never mattered here.
When porting the legacy `mdx-to-jsx` preprocess into Neo sync, use
`mdx-rs` (4× cheaper, Rust-side, scales). MDX sources are currently
excluded from fragment bundling
(`collect/constants.ts` `FRAGMENT_EXTENSIONS` + gated matches in
`collect/lib/scan/scanner.ts`); the port needs a proving case plus
`bench:neo` before/after.

## Provenance and tree state

- Counters were temporary and **reverted**; `grep` for
  `eprintln|dbg!|PROBE_` in `modules/tasty/src` shows only a pre-existing
  `eprintln!` in the untouched `src/tests/extract.rs:433`.
- Native binding rebuilt clean during diagnosis; bench lock held then
  released (`/tmp/swarm-bench-lock` free).
- Uncommitted tree at report time is intended, verified work only:
  font-weight fix (22 files, `scope.rs` + goldens), MDX fragment
  exclusion (neo collect), System docs section (untracked
  `packages/reference-docs/src/content/docs/system/`). Nothing reverted.
- Untracked `pipeline/src/registry/lock.*` and
  `pipeline/src/testing/matrix/runner/paths.test.ts` predate this session
  (mtime 14:03 vs session files 17:13+) — not mine, untouched.
- Pre-existing failures agents should ignore, all confirmed at HEAD:
  `bin/ref.test.ts` verbose-wording drift; flaky `clean-repro` /
  `session-repro` lock-kill tests (vary run to run).
- Related: `docs/bugs/FONT_WEIGHT_RESOLUTION.md` (the weight fix);
  `packages/reference-neo/src/sync/phases.ts` (`REFERENCE_UI_PHASES_OUT`
  phase recorder — use it to re-confirm the atomic/tasty split).
