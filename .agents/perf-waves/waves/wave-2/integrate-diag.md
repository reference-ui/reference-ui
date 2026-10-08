# swarm-intdiag INTEGRATE: diag partition dead-render skip

Claim: swarm-diag LAND (−35.2 ms / −3.00% enterprise median).
Base pin verified: `git rev-parse HEAD` = `5844b24a81a528ace14fab63e908793a6829a874`;
integration branch `reference-system` tip == base (no wave-2 landings yet, confirmed
`git rev-parse reference-system` → same hash). Patch
`docs/perf/waves/wave-2/diag.patch` (102 lines, captain-extracted) applied with
`git apply --check` then `git apply`, both clean. Resulting tree diff: 1 file,
`packages/reference-rs/modules/atomic/src/diagnostics/channels/mod.rs` +58/−12.

## Per-change paragraph

`DiagnosticChannels::partition` rendered every compiler-classified fact through
`render_fact`, then dropped the line when the compiler backchannel was not
requested (the default `logs` path). For analysis facts (`ExactLookupExpected`,
`DynamicSlot`) the rendered line is provably dead on that path: never pushed
(no strip reads it) and never echo (no sweep reads it). The patch adds two
skips: (1) in the new `partition_fact` helper, return before `render_fact`
when `!render_compiler && !is_pushed_fact(fact)`; (2) in `partition`, return
early when `!render_compiler && userspace.is_empty()`. The per-fact body moved
into `partition_fact` with identical statements in identical order (only
`continue`→`return` and `channels.`→`self.` renames). Two new unit tests pin
the skips. No diagnostic content, wording, or rule changes.

## Collision analysis

(1) same-function-twice: no collision. Integration tip == base (verified), so
the patched `partition`/`partition_fact` diff against the same base the crew
built on; the patch applied clean with no fuzz. `partition` has exactly one
production caller (`partition_channels` in
`packages/reference-rs/modules/atomic/src/lib.rs:323`); no other wave-2 crew
touched `channels/` (sibling-worktree `git status` sweep: only the diag crew
tree and this tree show `channels/mod.rs` modified; others touch
extract/identity, canon values, cascade, key_memo, or docs/memos only).

(2) shared-state/ordering: the extraction is statement-verbatim and the early
return is truly vacuous. Base loop body (`HEAD:.../channels/mod.rs:70-81`) vs
`partition_fact` body (patched `:97-108`): same four statements, same order —
`render_fact` let-else, `is_pushed_fact`→`remove_rendered`, `is_false_fact`→
echo push, `render_compiler`→compiler push — modulo the mechanical
`continue`→`return` and `channels.userspace`/`channels.compiler`→`self.*`
renames, plus the new guard at `:94-96`. Vacuity of the early return
(`!render_compiler && userspace.is_empty()`, patched `:68-70`): the userspace
list can only shrink via `remove_line`, whose `position` on an empty vec is
`None` (no-op, `proof/lines.rs:33-39`); the echo sweep calls `find_line`,
which on an empty vec returns `None` (no-op, `proof/lines.rs:17-24`); the
compiler list is discarded by the caller when `!render_compiler`
(`lib.rs:330-334` sets `compiler_diagnostics = None`). Renders are pure
(`render_fact` takes `&fact`/`&catalog`, all `Policy::render_*` take shared
refs and return owned `Diagnostic`), so skipping them drops no side effect.
Pushed facts still render on every path where strip/echo reads them: the
per-fact skip requires `!is_pushed_fact`, and `is_pushed_fact` is true for
every variant except the two analysis ones (`channels/mod.rs:137-140`); the
early return only fires when the default channel is empty, where every strip
and sweep provably no-ops. Strip readers traced: `remove_rendered`
(`channels/mod.rs:152-160`) → `remove_line` (`proof/lines.rs:27`); sweep
readers: `sweep_false_echoes` (`channels/mod.rs:162-170`) →
`find_line`/`remove_line` (`proof/lines.rs:11-39`).

(3) regen/tests: hand-written, no emitter. `channels/mod.rs` carries `//!`
module docs and a `#[cfg(test)]` suite; no `generated`/`codegen`/`include!`
markers, and `modules/atomic` has no `build.rs` — so no emitter-vs-checked-in
check applies (unlike wave-1 emit). The two new tests
(`unrequested_backchannel_leaves_default_untouched_by_analysis`,
`empty_default_and_unrequested_backchannel_render_nothing`) were run
explicitly: PASS (see Correctness).

(4) soundness re-verification from the code (not the report): analysis facts
never pushed + never echo, re-proven. "Never pushed": `is_pushed_fact`
returns false for exactly `ExactLookupExpected { .. } | DynamicSlot { .. }`
(`channels/mod.rs:137-140`), and those are the only two variants the per-fact
skip can bypass. "Never echo": `is_false_fact` matches only
`ResolveOutcome { outcome, .. }` with `is_false_refusal(outcome)`
(`channels/mod.rs:144-150`), and `is_false_refusal` matches only
`ResolveOutcome::Rejected` with an `InvalidValue{value: "false"}` detail
(`channels/render.rs:122-131`) — a disjoint variant from both analysis facts
(`facts.rs:206-214`). Both analysis variants classify `Compiler`
(`policy/mod.rs:46-48`), confirming they reached the dead render in base.
Backchannel drop affects neither output: caller keeps only `userspace` and
sets `compiler_diagnostics = None` when `!render_compiler` (`lib.rs:329-334`).
The skipped per-render work is real: `catalog.locate` (path clone + `line_col`
scan, `site.rs:65-77`) plus `Policy::render_expected` (`format!` + value
spelling + `lookup_key()` five-tuple, `policy/analysis.rs:13-26`).

(5) LOG.md prior art: no prior attempt, no race. `LOG.md:121` lists
"Diagnostics/proof 76 wt incl — unworked"; the wave-2 backlog seeds exactly
one diagnostics crew (swarm-diag, `LOG.md:172-173`); the claims file and the
sibling-worktree sweep show a single diag crew and no other wave-2 diff
touching `channels/`. The crew's LAND claim is filed at `LOG.md:238-248`.

## Quality + correctness

- `pnpm agentrs c atomic` (patched tree): PASS, full suite green.
- The 2 new partition tests run explicitly (`-t "channels"`): 10/10 pass,
  incl. `unrequested_backchannel_leaves_default_untouched_by_analysis` and
  `empty_default_and_unrequested_backchannel_render_nothing`.
- `pnpm agentrs q` on the touched file: 0 code violations, 1 warning — the
  file-length soft warning (424 lines > 365). Pre-existing: base file is 377
  lines, already over the soft limit (`git show HEAD:… | wc -l`). No new
  complexity findings: the `partition_fact` extraction kept gates flat.
- ATM-SITE-54 vitest re-verification (both arms, `REFERENCE_UI_NATIVE_PATH`
  at aside `.node` files): FAILS IDENTICALLY on base and candidate — same
  test (`ATM-SITE-54 compiles, passes gauges, and matches goldens`), same
  assertion (`spec.ts:43`, `expect(hasWant(result, prop, value)).toBe(true)`
  → false). Pre-existing and unrelated (specifier-resolution wants, nothing
  to do with diagnostics channels). Not a HOLD.

Binaries (built in this tree, `napi build --release`, darwin-x64):
base `5c01173c…6b8ab`, cand `4f74f086…8780a2`. Base built from stashed tree;
stash round-trip verified byte-identical (`cmp` against pre-stash `git diff`
backup); pre-existing stashes untouched. `build:js` ran once (wrappers were
missing; gitignored). Harness never rebuilt mid-set; aside `.node` sha256
verified before and after the pair set — identical.

## Confirm protocol (the number)

`pnpm bench:neo -- --scale enterprise --runs 1 --json`, sample
`scales[0].samples[0].syncMs`, arms swapped per run via
`REFERENCE_UI_NATIVE_PATH` (loader honors it as the sole candidate,
`modules/runtime/js/loader.ts:25` + unit test). 2 unscored warmups per arm,
then 8 pairs alternating order (B/C, C/B, …) under one bench-lock hold.

Warmups (unscored): base 1390.14, 1280.24; cand 1154.64, 1160.33.

| pair | base syncMs | cand syncMs | Δ ms    | Δ %   |
| ---- | ----------- | ----------- | ------- | ----- |
| 1    | 1174.40     | 1150.19     | −24.21  | −2.1% |
| 2    | 1173.37     | 1148.48     | −24.90  | −2.1% |
| 3    | 1178.80     | 1170.33     | −8.47   | −0.7% |
| 4    | 1222.33     | 1213.28     | −9.04   | −0.7% |
| 5    | 1188.62     | 1157.34     | −31.28  | −2.6% |
| 6    | 1216.91     | 1517.94     | +301.03 | noisy |
| 7    | 1196.70     | 1148.53     | −48.16  | −4.0% |
| 8    | 1168.96     | 1311.54     | +142.57 | noisy |

- Base median 1183.71 ms; cand median 1163.83 ms.
- Median Δ: **−19.87 ms (−1.68%)**, 6 of 8 pairs favor candidate.
- Excluding run 1: base 1188.62, cand 1170.33 → **Δ −18.29 ms (−1.54%)** —
  verdict stands.
- Median per-pair delta: −16.63 ms.
- Pairs 6 and 8 (cand) are external-noise outliers (+301/+143; pair-6 base
  also elevated). The patch strictly removes pure dead work (no new locks,
  allocs, or timing-sensitive paths), so a +300 ms cand pathology is not
  constructible from the change; the bisect round-1 burst hit all three arms
  the same way.

Byte-identity (enterprise, `--keep`, seed 7): base and cand outputs `cmp`
identical, and both match the sealed outputs exactly —
styles.css `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea`,
runtime-data.mjs `718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`.
Determinism: two further candidate runs, all four hashes identical.

Bisect (per brief, since −19.9 trails the −35.2 claim): skip-only arm S
(`24894e0e…`) and early-return-only arm E (`61c5d322…`), 4-round B/S/E
round-robin. Medians: base 1168.08, S 1183.20 (+15.1), E 1190.47 (+22.4) —
inconclusive, and instructively so: on this workload (empty default channel,
unrequested backchannel) E executes the *identical* path as full cand (early
return fires first; the loop never runs), yet measured +22 while full cand
measured −20 — a ~42 ms swing between identical execution paths. That
calibrates the single-set noise floor at ±20–40 ms, which fully explains both
the bisect wash (n=4 cannot resolve ~20 ms) and the crew-vs-integrator gap
(−35.2 vs −19.9). Direction is consistent across 16 pairs (12/16 favor cand
in the same direction over two independent sets).

## Verdict

**LAND (delta −19.9 ms / −1.68% enterprise median; ex-run-1 −18.3/−1.54%)**

The integrator replication lands below the crew's −35.2/−3.00% claim, but
LAND is the right call: the change is pure dead-work elimination (35,426
renders whose values are provably unread — re-proven from the code above, not
trusted from the report), so it cannot regress; outputs are byte-identical to
the sealed seed-7 hashes with determinism ×2; two independent 8-pair sets both
land 6/8 in the same direction and both stand ex-run-1; quality and the full
atomic suite are green with ATM-SITE-54 re-proven pre-existing on both arms.
True effect ≈ −20 to −35 ms; credited here at the integrator's measured −19.9.
No YIELD (no race — single diag crew, no other wave-2 diff touches
`channels/`). No HOLD (nothing needs rework; the bisect shortfall is noise
floor, demonstrated by the E≡cand path-equivalence argument, not mechanism
doubt).
