# F1 Implementer Report — B″ native single-read scan + C3-in-reverse retention

**Verdict: LAND.** COUNT ✓ · IDENTITY ✓ zero drift · CAPTURE −52.38 ms / −5.68% median (8/8, ex-run-1 stands).

Base pin `0939615d5c2730eb56bae5af47384d077266a78c` verified first act; DESIGN.md
(24,617 B, md5 `2674e444e1b7256061a14eab2d822923`) verified before reading. The whole
document (§§2–4, both halves) is implemented; test plan §6.8 runs all 20 plus 4 extras.
No second hypothesis, no commits, no pushes, no LOG.md. Zero match-loop prize claimed:
T1's `splitScan` is byte-untouched (5 `export` keywords, 359 lines before and after)
and the native path confirms hits through that same function.

## COUNT (pass — fail ⇒ CUT)

Interpose census (`libf1read.dylib`, M1's shim) on the 1,198-file M1 tree:

| workload | open | read n (zero/short/full) | bytes | fstat |
|---|---|---|---|---|
| node readFileSync loop | 1199 | 2426 (1198/1196/32) | 818900 | 0 |
| native scan | 1199 | 1202 (2/1196/4) | 818900 | 0 |
| scan + compile(token), full retention | 1200 | 1202 (2/1196/4) | 818900 | 0 |
| scan + compile(token), 3 files unlisted | 1200 | 1205 | 818900 | 3 |

- reads/file == 1: 1202/1198, exactly M1's filed big-shape (1196 short + 4 full + 2
  zero); the +4 are structural multi-chunk reads (exact-64K/big files). fstat 0.
- backfill reads == 0: full-retention compile == scan-only (1202/1202 reads; the +1
  open is the kept walk's dir traversal, zero file opens).
- Walk kept, not deleted: the partial control backfills exactly the 3 unlisted files
  (fstat 3, backfill's 6 `read_to_string` reads; bytes identical all three runs).
- crossings == 2 steady-state: X2a mocks prove scan×1 + compile×1 + release×0 on the
  happy path with the token (never bytes) in the request; X2b proves release×1 on
  the compile-error path only.

## IDENTITY (pass — zero drift or CUT, no negotiation)

- (14) 4-scale goldens sealed on this tip **before** the diet, reproduced bit-exactly:
  matches, manifestSha, stylesheet/runtime/diagnostics shas, tracedJsxHosts, plus ×3
  scan determinism per scale. Regen fidelity re-proves first (TS sourcesSha), so
  generator drift cannot masquerade as diet drift.
- (1)–(9): matches/manifest/content parity on the tricky tree, M1e u8 battery (9/9),
  unnormalized spellings (rel-form == node `relative()` strings), out-of-cwd,
  chmod-000 drop, 0B/64K/70K sizes, symlinks (dir descend, file bytes, dangling drop).
- (10)–(13): release idempotent, unknown-token errors (never silent: wants [] on a
  tree whose disk holds red), files+token rejects *before* the drain (token still
  compiles after), retain:false planner parity in both discovery modes.
- Rust (15)–(20): needle-gate, short-rule size classes, lossy battery, store lifecycle
  (drain-once/tombstone/release/unknown distinct), collect(token)==collect(files)==disk
  on tricky + symlink trees (full `CompileResult` equality), stable ATM-E-* rejections.
- X3 functional backfill proof: post-scan disk rewrite + deletion invisible to the
  drain (pre-mutation wants served); fresh-scan control non-vacuous; partial-retention
  control backfills from disk.
- Untouched suites stay green: 18 sync tests (real syncs, now via token), scan-retention
  (TS differential), scanner-identity (14 T1 pins).

## CAPTURE (LAND-track: −52.38 ms AND −5.68%, ex-run-1 stands)

Enterprise, bench lock held (claim + two-step release filed), 6 warmups/arm unscored,
alternating order, sha256 pins verified before+after all 42 runs (diet `373ee209…`,
tip `efeae689…`, zero mismatches):

| pair | A fallback | B native | Δ | Δ% |
|---|---|---|---|---|
| 1 | 914.11 | 865.91 | −48.20 | −5.27 |
| 2 | 950.86 | 865.32 | −85.54 | −9.00 |
| 3 | 917.07 | 868.18 | −48.89 | −5.33 |
| 4 | 922.50 | 864.99 | −57.51 | −6.23 |
| 5 | 922.97 | 873.05 | −49.91 | −5.41 |
| 6 | 920.82 | 883.84 | −36.98 | −4.02 |
| 7 | 922.34 | 877.67 | −44.66 | −4.84 |
| 8 | 925.66 | 871.88 | −53.77 | −5.81 |

Medians A 922.42 → B 870.03 (−52.38, −5.68%), wins 8/8, min win +36.98/+4.02%.
Ex-run-1: A 922.50 → B 871.88 (−50.61, −5.49%). Stage medians: scan −26.76
(350.23→323.47), compile −25.33 (496.32→470.99), evaluate/publish flat.
Harness validation (fallback-A vs true-tip, 7 interleaved pairs): medians agree
within box noise (cold triplet +9.8, warm quartet −23.0 on T spikes); the prize
dwarfs the harness in all 8 pairs. Pair-2A (+30 ms) is ordinary box noise, scored,
never cherry-picked.

**Mechanism.** The prize splits exactly where the design deletes work: scan −27 ms
(single-read loop, zero TS string allocs, 2426→1202 reads) and compile −25 ms (no
4.3 MB JSON unmarshal, drain moves instead of `filter_virtual_sources` clones).
Evaluate/publish flat (untouched). X3 + P2==P1 prove bytes cross once and never
re-read. The memo's 35.6 ms/3.4% projection is met or better on every pair.

## Suites + quality

- `agentrs c atomic`: 620/620 (tip 613; Δ exactly the 7 new tests, zero lost):
  `needle_gate_hits_only_needle_files`, `short_rule_reads_every_size_class`,
  `lossy_utf8_pins_the_m1e_battery`, `store_lifecycle_moves_once_and_fails_loud`,
  `collect_token_matches_files_and_disk_on_the_tricky_tree`,
  `collect_token_matches_files_and_disk_on_the_symlink_tree`,
  `schema_rejections_carry_stable_error_codes`.
- Neo fragments/sync vitest: 99/99 (tip 80; +19: (1)–(9), (10)–(13)+X1+X3, (14), X2a/X2b,
  +1 prepare-fallback). tsc clean.
- `agentrs v atomic`: 300/301 **identically on tip and diet** — ATM-SITE-54
  (resolve/units) fails on the clean tip with the same assertion; pre-existing, in
  fenced files, untouched. Disclosed, not absorbed.
- `agentrs q`: 0 violations; 5 warnings == tip's 5 (sources/lib/codes, same counts).
  New files warning-free. Clippy: zero lints in touched files.
- `agentneo q`: 0 errors; 8 warnings all pre-existing (zero new; my files clean).
- Portability: `cargo check` passes all 4 napi targets (host .node built + tested;
  linux std installed for the check); zero `cfg` in shipped scan code (2× `cfg(unix)`
  in tests only, symlink precedent); `sep` rides the request from the caller.

## Files

Modified (15): `atomic/{native.rs,js/{index,runtime,types}.ts,src/{lib,types}.rs,
sources.rs,diagnostics/codes.rs}`, `scanner.ts` (5 keyword-only exports),
`scanner-native.ts` consumers (`lib/index.ts`, `base/index.ts`, `fragments/index.ts`,
`sync/{index,native}.ts`), `base/index.test.ts` (mandated prepare-contract update).
New (9): `atomic/src/scan/{mod,store}.rs`, `atomic/tests/scan_retention.rs`,
`fragments/{lib/scanner-native.ts,base/{scan-native-helpers,scan-native,
scan-native-lifecycle,scan-goldens,scan-crossings}.test.ts,base/fixtures/
scan-goldens.{small,medium,enterprise,churn}.json}`.
Fences: none of `resolve/{mod,normalize,unit}.rs`, `stylesheet/emitter/mod.rs`,
`runtime/serializer.rs`, `tests/serializer_parity.rs` touched. No collisions.

Notes: (a) `scan.rs` became `scan/{mod,store}.rs` — the q file-length gate forced the
split (mod 317 + store 68, both clean); the module path `crate::scan` is unchanged.
(b) `index.test.ts` prepare-output pins the old `scannedSources` contract; DESIGN §3.2
mandates the retention-ref replacement, so the test was updated (+1 fallback test).
(c) `runPlanner` still calls TS `scanForFragments` — the native matches-only entry
exists and is parity-tested (13), but rewiring the planner is outside the filed entry
set; follow-up. (d) Tip validation worktree left at `/tmp/f1-tip-worktree` (detached
pin) for re-runs; all `/tmp/f1-*` asides preserved, never committed.

## DX appendix

1. **Broke:** `pnpm agentrs b` alone leaves neo tests failing with
   `Cannot find package '@reference-ui/rust/atomic'` — the JS dist is a separate
   build. **Workaround:** `pnpm --filter @reference-ui/rust run build:js` after `b`.
   **Lost:** ~10 min (diagnosis + rebuild). **Proposal:** `agentrs b` should also
   refresh the JS dist, or the mission brief should list both commands.
2. **Broke:** installed rustfmt (1.94) disagrees with committed style repo-wide
   (pre-existing diffs in dozens of files incl. benches), and `rustfmt --check`
   follows `mod` includes into files I must not touch. **Workaround:** file-scoped
   line-length checks + matching committed style by hand; never workspace `fmt`.
   **Lost:** ~10 min. **Proposal:** pin the fmt toolchain or record the blessed
   rustfmt version so `q`/`f` don't fight the tree.
3. **Broke:** Vitest 4 removed `it(name, fn, opts)` (TypeError at collection).
   **Workaround:** `it(name, { timeout }, fn)`. **Lost:** ~5 min. **Proposal:** none
   (version drift; the error message names the fix).
4. **Broke:** literal `\0` escapes in a heredoc-written test file landed as NUL bytes
   in string literals (runtime-correct but fragile). **Workaround:** python byte
   surgery to escape sequences. **Lost:** ~5 min. **Proposal:** none (authoring
   hygiene; caught by inspection before running).
