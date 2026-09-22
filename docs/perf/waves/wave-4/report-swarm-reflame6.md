# reflame6 REPORT: wave-4 post-T1 flame refresh (2 reconciled captures + phase table)

## Identity

- Base: `ff64ab75b594cfd81d0cb8488bd0ea86a0155b15` (verified `git rev-parse HEAD`
  first act; tree clean at start).
- Release `.node`: `4832cb2fd7f340b927ee2531a5a4dcf2c540b81685737d098a7e41653eab6174`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, 8,889,408 B —
  same size as recon/T1 builds, sha differs by fresh worktree build).
  Built once via `pnpm agentrs b`; sha verified before AND after EVERY capture
  (4/4 stable, harness aborts on drift). `build:js` ran once (gitignored).
- Tip delta vs repro5 (`b8a75b0bd74c..ff64ab75`, verified): exactly ONE production
  commit — `1e4e3a0b5 perf(neo): land T1 scan identity diet` (`scanner.ts` +151/−6
  + `scanner-identity.test.ts` + bench report artifacts); all other commits docs.
  Any scan delta is the diet by elimination.
- End state: `?? docs/evidence/flamegraph/enterprise-repro6{a,b}/` + this REPORT
  only. No production code changes. No commits. No LOG writes. No stash.

## Grounding (fences honored)

- PERF-W4-SCANRECON4 (wave-4 recon: repro5a/b phase table, T1 briefable,
  scan 364.4/365.1 anchor).
- PERF-W4-SCANIDENTITY (T1 diet LAND −16.84 ms/−1.96%, scan −14.40, whole-sync bar).
- INT-W4-SCANT1 (integrator confirm −15.05/−1.76%, scan −16.82, compile flat).
- Re-profile ONLY: no diets, no backlog, no census. F1 designer shares this box —
  coordinated via the lock, never touched foreign PIDs.

## 1. Fresh flames (2 reconciled captures, this exact tip)

- `/tmp/swarm-reflame6/enterprise-repro6a/` — syncMs **963.43**, RECONCILED.
- `/tmp/swarm-reflame6/enterprise-repro6b/` — syncMs **960.72**, RECONCILED.
- Filed as `docs/evidence/flamegraph/enterprise-repro6a/` + `enterprise-repro6b/`
  (procedure `agentrs-flame/3`, pin `ff64ab75b594`, **dirty:false**; each bundle:
  `profile.json.gz` + presymbolicated sidecar + `phases.json` + `meta.json` +
  `summary.md` + `callers.md` filed via the query layer, no re-record).
- Protocol fidelity: locked enterprise load (3000 style + 12000 dead + 120
  recipes, 7527 css calls, seed 7), 1000 Hz samply, `--perf-basic-prof`,
  same-run phase buckets. One cold unscored tip-verify run first (1157.0,
  discarded, first-run-after-rebuild — same shape as recon4's 1313.8); both
  scored captures warm. Bench lock held for ONE timed block (cold + flame A/B),
  grabbed 13:32:30Z, two-step release 13:32:43Z.
  Noise disclosed: F1-designer hold (`scan-F1-design M3`) waited out (~2 min,
  queued patiently); box load ~3.3 at grab; no competing samply/worker PIDs
  observed during the block; zero scored-set discards (nothing contended).

## 2. Phase table: repro6a/b vs filed repro5a/b (wt ≈ ms)

| phase | pre 5a | pre 5b | 6a | 6b | Δ 6a−5a | Δ 6b−5b | Δ 6a−5b | Δ 6b−5a |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| syncTotal | 961.2 | 974.1 | 963.3 | 960.6 | +2.1 | −13.5 | −10.8 | −0.6 |
| compile | 508.8 | 522.2 | 525.7 | 521.6 | +16.9 | −0.6 | +3.5 | +12.8 |
| scan | 364.4 | 365.1 | 349.3 | 344.0 | −15.1 | −21.1 | −15.8 | −20.4 |
| publish | 53.3 | 52.1 | 56.8 | 59.9 | +3.5 | +7.8 | +4.7 | +6.6 |
| config | 28.5 | 28.7 | 28.4 | 28.2 | −0.1 | −0.5 | −0.3 | −0.3 |
| evaluate | 6.2 | 6.0 | 3.2 | 6.9 | −3.1 | +0.9 | −2.9 | +0.7 |
| startup (outside sync) | 124.8 | 144.7 | 127.3 | 121.8 | +2.5 | −22.9 | −17.4 | −3.0 |

Straddles: 6a↔6b scan 5.3, compile 4.1, publish 3.1, sync 2.7;
5a↔5b scan 0.7, compile 13.4, sync 12.9, startup 19.9.

## 3. Scan-delta confirm with noise bounds

- Scan pair-mean: (349.3+344.0)/2 − (364.4+365.1)/2 = **−18.1 ms**.
  All four cross-deltas negative: −15.1/−21.1/−15.8/−20.4.
- Expectation ≈ −15 ms ± noise: CONFIRMED. The 6a↔6b scan straddle (5.3)
  bounds the noise; −18.1 ± ~5 covers −15, and both verdict harnesses sit
  inside the same band (member scan −14.40, integrator scan −16.82).
- Flame-side mechanism (why the ms moved): scan-phase kernel self is
  298/298 (6a/6b) vs 292/299 (5a/5b) — FLAT, syscalls untouched; the whole
  −18.1 is userspace (removed `relative()`+splits JS). Whole-profile JS
  self 11/15 vs 27/23 — down, directionally the diet. This is the T1
  identity-only mechanism seen from the flame side.
- Whole-sync pair-mean −5.7 decomposes: scan −18.1 + compile +8.1 +
  publish +5.6 + smalls ≈ −5.8 — closes. Whole-sync on n=2 flame runs is
  noise-dominated (5a↔5b sync straddle was 12.9); the scan room — the
  diet's mechanism room — carries the confirmed movement.

## 4. compile / publish / config flatness (with honest bounds)

- Compile: 6a/6b 525.7/521.6 sit with the 4a/4b/5b cluster (520.0/520.1/522.2);
  6a−5b +3.5 and 6b−5b −0.6 are flat. The 6a−5a +16.9 is the 5a-low-outlier
  (508.8) artifact — disclosed, not diet-caused (compile inputs are
  byte-identical per T1's 4/4 identity proof; no mechanism exists).
- Publish: pair-mean +5.6, all four cross-deltas positive (+3.5…+7.8) —
  disclosed as a watch item. Bounded by history: 9 filed pre-T1 captures span
  48.1–56.9 (repro3b hit 56.9); 6a (56.8) is in-band, 6b (59.9) exceeds the
  prior max by 3.0 — a small-n edge on an 8.8-wide historical band. No
  mechanism links the diet to publish (retention byte-identical ⇒ publish
  inputs identical); verdict harnesses measured publish +0.5. Noise by
  mechanism + identity proof.
- Config: −0.1/−0.5 — flat. Evaluate: 3.2/6.9 — the known A↔B noise swap
  (recon disclosed ±3.5). Startup: node-startup noise outside sync, unscored.

Lib self-weight (whole profile): kernel 422/423 (pre 412/435, in-band);
.node 250/249 (pre 233/240 — attribution jitter on a fresh-build layout with
zero native code delta; compile wall is flat vs the cluster, so not work);
node 159/151 (pre 174/165); malloc 136/156 (pre 145/143); platform 98/76
(pre 89/100); JS 11/15 (pre 27/23 — down, the diet's removed JS). All within
small-n sampling + rebuild-layout noise except JS, which moved the diet's way.

## Evidence paths (this worktree; captain lands to main tree)

- `docs/evidence/flamegraph/enterprise-repro6a/` — profile.json.gz (102165 B,
  1000 Hz) + sidecar + phases.json + meta.json + summary.md + callers.md
- `docs/evidence/flamegraph/enterprise-repro6b/` — profile.json.gz (101123 B,
  1000 Hz) + sidecar + phases.json + meta.json + summary.md + callers.md
- Staging (out of tree, preserved): `/tmp/swarm-reflame6/` (run-captures.sh,
  compare.mjs, tip-verify/ unscored cold run, staged bundles)

REFLAME-VERDICT: CONFIRMED -18.1ms pair-mean (-15.1/-21.1)
