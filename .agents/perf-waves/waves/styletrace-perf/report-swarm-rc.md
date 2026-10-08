# REPORT-STPERF-rc: Rc-shared ParsedModule cache kills the 4970-clone storm

One line: `load_module` cache hits returned a deep `ParsedModule` clone (4970 hits/sync, 257,814 decls rebuilt+freed); the cache now holds `Rc<ParsedModule>` and hits are pointer bumps. Whole-sync −647.5 ms (−35.25%), 8/8, stands ex-run-1.

Effect: base median 1837 → cand 1189.5, Δ −647.5 ms (−35.25%), 8/8
favor, ex-run-1 −646.0, paired-median −647.5. Compile-phase Δ −650
(accounts for the whole wall Δ; scan/publish unchanged).

## Base / binaries

- Base commit: `488bcfd7a6607f122533d9f21ecfc4ff7c9ce587` (mission
  worktree `/tmp/styletrace-perf-mission`, detached HEAD; `git status`
  clean except mission/flame records before any work).
- Base `.node` sha256:
  `5cbffe7898f2c2adc2aad2642e89ea01ea9f404a7a7fbb7fe2f6fac8a7ff7cd9`
  (`/tmp/stperf-base.node`, built in-tree from clean base via
  `pnpm agentrs b`, 0 styletrace-crate release warnings).
- Cand `.node` sha256:
  `485c395767d6734908067a6d103645dd8dafbb594698aa9cacfeb4256a70c2f9`
  (`/tmp/stperf-rc.node`, same recipe, 0 styletrace-crate warnings).
- Diet: `packages/reference-rs/modules/styletrace/src/resolver/tracer/context.rs`
  (+6/−5, `git diff` = `/tmp/stperf-rc-context.diff` exactly).
  Patch aside at `/tmp/stperf-rc-context.diff`.
- Binary discipline: sha-verified before AND after every one of 20
  timed runs + 7 identity runs + 16 scale runs (rig aborts on
  mismatch); arms swapped via `REFERENCE_UI_NATIVE_PATH` (never
  rebuilt mid-set; swap mechanism proven: instrumented aside via
  the same var emits the 499-session STPERF stream).
- `git status` at verify time: only the two diet files (rc+cow, as
  found) + mission/flame records. Tree restored byte-identical
  after per-arm builds (`diff` of restored vs as-found: empty);
  `dist/` binary restored to the as-found instrumented
  (`dffb9563…`); `benchmark/reports/latest` restored after bench runs.

## Mechanism counts (WAVE2-COUNTS, bit-identical ×4 syncs)

- `load_module` cache hits per sync: 4970 whole-`ParsedModule`
  clones, 257,814 decls summed across clones — every hit rebuilt
  the declarations/imports/reexports maps and dropped all but one
  declaration (`resolve_declaration` clones one decl out of it).
- Flames (`styletrace-lib1/2`, reconciled): compile bucket
  malloc-dominated (libsystem_malloc self 35–44%); `String::clone`
  high inclusive both captures. The clone storm is the malloc storm.
- Removed: all 4970 deep clones + paired frees per sync. Hits are
  now `Rc::clone` (refcount bump); misses still parse once and
  insert one `Rc`.

## 8-pair (lock-held, pin stream, warmups unscored)

Harness `/tmp/stperf-ab.mjs`: bench lock grab/release ×1 (clean
two-step; the release path was fixed mid-mission, see DX),
`taskpolicy -a -d default -t 0 -l 0` (mission recipe — the exact
`pnpm agent run` elevation; runner unusable here per WAVE2-COUNTS),
alternating order, no seed flags on the probe (pin stream by
construction). Load 2.1–2.7, uptime 21 days. Foreign procs
observed, never touched: user `dev:lib` (vite + `ref sync --watch`
on the main tree), playwright-mcp, Chrome helpers.

Warmups (unscored): base 1822, 1825; cand 1377, 1199.

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1834 | 1182 | −652 | B,C |
| 2 | 1838 | 1187 | −651 | C,B |
| 3 | 1861 | 1162 | −699 | B,C |
| 4 | 1843 | 1183 | −660 | C,B |
| 5 | 1836 | 1192 | −644 | B,C |
| 6 | 1833 | 1192 | −641 | C,B |
| 7 | 1850 | 1213 | −637 | B,C |
| 8 | 1833 | 1202 | −631 | C,B |

Base median 1837; cand median 1189.5; median Δ −647.5 ms
(−35.25%), 8/8 favor. Ex-run-1: −646.0 — stands.
Paired-median: −647.5. All three estimators agree. Both arms
tight (±2%); no noisy pairs, nothing discarded. Full log:
`/tmp/stperf-ab-rc.jsonl` (per-run compile/scan/publish + shas).

## Identity, determinism, order

- Scratch diet-surface identity (580 artifact files, base vs cand):
  `diff -r -q` exit 0, zero diffs. CSS sha
  `250fd623fda203a8ace6dffe83504d348589d4d7a0bfe5c99d75f214d8037c31`
  identical (both `styled/` and `react/` copies); warnings 3 = 3.
- Determinism: cand ×2 runs byte-identical (`diff -r -q` exit 0).
- 4-scale regression identity (bench:neo pin stream, `--runs 1`,
  env-swapped children), base vs cand:

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| small | `a084c7fe9dd4…` ✓ | `2bfcfe562e83…` ✓ |
| medium | `03d209594ff0…` ✓ | `83f848faad16…` ✓ |
| enterprise | `a46e3e334408…` ✓ | `3bee4d3578c3…` ✓ |
| churn | `b85bb7fa358a…` ✓ | `b77cdbb2521e…` ✓ |

  4/4 identical (full 64-char in `/tmp/stperf-scales.jsonl`).
  Vs 09-22 sealed pins: uniform +52 B CSS / +130 B data drift on
  the CLEAN BASE (8 days of landings since the pin; all arms share
  it) — pre-existing evolution, not diet-related.
- Order argument (sortshape): the diet changes only value sharing
  (`Rc` vs deep clone); every downstream read sees identical bytes
  (`resolve_declaration` is read-only over the module). All
  collected names flow through `BTreeSet`s whose iteration order is
  key order, independent of sharing. Zero emission-order changes by
  construction; 580/580 byte-identity confirms.

## Suites, quality

- `pnpm agentrs c styletrace`: 78 passed, 0 failed (base 78/78;
  delta zero). Note: the mission checkout initially failed 18/78
  on clean base — missing gitignored `fixtures/sync-root/
  .reference-ui/` artifacts (main tree is at the same commit, so
  its generated artifacts were copied over verbatim; all arms
  re-verified green after).
- `pnpm agentrs v styletrace`: 32 passed (3 files), 0 failed
  (base 32/32; delta zero).
- `pnpm agentrs q` on `context.rs`: 0 violations, 0 warnings.
  (`resolve.rs` untouched by this diet; its 4 warnings are
  pre-existing on HEAD, reproduced at base.)
- Release rustc warnings (styletrace crate): 0 base, 0 cand.

## Verdict

**LAND** (solo: −647.5 ms and −35.25% whole-sync; bar is ≥15 ms
AND ≥1.5% — clears by 40×/23×; phase floor N/A above the bar).
Fences: `context.rs::load_module` + `TraceSession::module_cache`
only. No overlap with alloc/cow (disjoint files/regions).

Captain commit-tick extras (not verifiable pre-landing, owed at
landing): committed timed bench:neo report on the landing tree,
LOG.md scoreboard row, flame refresh on the new tip,
`pnpm agentperf rebuild` after filing to `docs/PERF/waves/`.
Suggested scoreboard text:
`rc −647.5 ms (−35.25%) 8/8 | base 1837 → 1189.5 | 580/580 + 4-scale ✓`.

## DX appendix

- Broke: `lockRelease` in the A/B rig used `rmSync(dir)`
  (`ERR_FS_EISDIR`) — first rc set completed all 20 runs but the
  release crashed at step 2 (owner removed, dir left). Completed my
  own two-step by hand (`rmdir`), fixed the rig (`rmdirSync`),
  cow/alloc sets clean. Minutes lost: ~5. Fix proposal: none
  needed (scratch rig, already fixed).
- Broke: `REFERENCE_UI_NATIVE_PATH` pointing at
  `*.node.aside` fails with "Invalid or unexpected token"
  (node `require` sniffs load-by-extension). Workaround: copy to
  `*.node`. Minutes lost: ~5. Fix proposal: loader could
  `fs.copyFileSync` exe-paths… better: document that the override
  path must end in `.node`.
