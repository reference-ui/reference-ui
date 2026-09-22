# swarm-stageaudit REPORT: staged-file processing audit → streamed double-collect fusion

## Verdict

**BANK** (−7.11ms / −0.72% medians, sub-bar both prongs; proven-identical diet with exact mechanism counts)

## Base

`ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified `git rev-parse HEAD` first act; post cloneplasma-LAND tip).

## Topic (repro2 re-seed T6)

Staged-file processing audit — `StreamedSource::collect` (13/17wt) + staging census over 12,000 staged files.
Brief: per-staged-file WORK census FIRST (gating vs non-gating split); realistic 2–4 ONLY if non-gating work ≥ 8ms, else CUT fast.
Hard fence: shot2 KILLED — WORK diet only, no skip/avoidance shapes.

## Work census (the counts mission)

### Static counts (kept enterprise repo + seeder + code; asserted in bench setup)

- Streamed files: 12,000 (`src/util/util{i}.ts`, plan deadFiles + kept-repo count).
- `StreamedSource::collect` calls: 12,000 (1 per streamed file; all parse clean).
- `collect_local_constants` calls on streamed programs: 24,000 (2 per file: merge leg + bag leg, both unconditional — stream.rs:140-144).
- Census streamed specs: 0 (template carries no import/export-from/star/default-hop bytes; asserted on real records).
- Unstage fraction: 12,000/12,000 (outgoing empty + zero relative imports target `src/util/` — all relative specs are `../recipes/*`; independently confirmed by valgraph's live census ×3: "12000 stream ALL unstaged-drop").
- Template pins: 128 B content, 84-char absolute path (kept-repo exact, double slash included).

### Unit costs (temp criterion bench, 6 legs, 2 runs — scaffolding reverted)

| leg | class | run1 | run2 | ×12,000 |
| --- | --- | --- | --- | --- |
| `ModuleKey::new` (G1, extend-fenced) | gating | 165.44ns | 164.20ns | 1.99/1.97ms |
| `ModuleRecord::collect` (G2, T3-fenced) | gating | 319.98ns | 319.72ns | 3.84/3.84ms |
| `collect_local_constants` (N1=N2) | non-gating | 231.02ns | 233.90ns | 2.77/2.81ms per leg |
| `project.merge` ×12k (N3) | non-gating | 3.0976ms | 3.1060ms | 3.10/3.11ms total |
| census skip (G3a) | gating | 10.492ns | 10.880ns | 0.126/0.131ms |
| gate keys (G3b) | gating | 895.93µs | 896.76µs | 0.90/0.90ms total |

- NON-GATING (N1+N2+N3): 8.64 / 8.72ms → **clears the 8ms bar** (both runs).
- GATING (G1+G2+G3): 6.85 / 6.83ms (gate inputs + gate machinery; all fenced or sub-floor).
- Reconciliation: G1+G2+N2 = 8.60ms hot-cache floor vs StreamedSource::collect flame 13/17wt (3a↔3b swing 4; cold reality fills the gap upward — conservative direction for the bar).
- Cross-checks: streamed-record 320ns < recordaudit mixed 466ns (simpler records ✓); key 164ns vs valgraph 128–154ns (7% over their top, inter-harness tolerance, disclosed); bag 231ns vs valgraph s1 394ns (different fixture class/harness suspected — disclosed; either value clears the bar harder in the cold direction).

### The losing math that isn't (why this built instead of CUT)

- N2 (bag leg) is computed then DROPPED for all 12,000 files — winnable only via skip logic (KILLED ground) or fusion dedup with N1 (diet). Fusion serves both consumers identically: pure WORK diet, zero skip shape.
- Fusion prize = N2 at 100% capture = 2.8ms floor (cold reality higher; 8-pair measures production truth).

## The diet (exact transformation)

`StreamedSource::with_bag`: collect once in `stage_streamed`, merge by ref, move the bag into the staged source. 2 files +15/-4 (stream.rs, staging.rs). `collect` keeps exact behavior for the differential test caller — zero test churn. Zero order changes; no maps touched; both consumers served identically (byte-identical by construction).

## Proof

### Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm via env

Base `.node`: `5a5d131e…525e3d` (8,902,336 B); cand: `81ee0e8e…66408`; arms hash-distinct; pins verified before AND after every run (40/40).
2 unscored warmups/arm (w1b 976.12, w2b 979.52, w1c 1167.74 cold-first, w2c 985.53). Start arms alternated.

| pair | base syncMs | cand syncMs | Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 991.04 | 972.25 | +18.79 | B,C |
| 2 | 986.93 | 972.66 | +14.27 | C,B |
| 3 | 963.94 | 975.67 | −11.73 | B,C |
| 4 | 1357.96* | 989.91 | +368.05* | C,B |
| 5 | 987.71 | 979.72 | +7.99 | B,C |
| 6 | 976.18 | 982.60 | −6.42 | C,B |
| 7 | 971.89 | 981.46 | −9.57 | B,C |
| 8 | 987.42 | 980.42 | +6.99 | C,B |

- Base median 987.18; cand median 980.07 → **Δ −7.11ms (−0.72%)**, 5/8 favor cand.
- Ex-run-1: −6.51ms — verdict stands.
- Paired-median Δ: −7.49 — all three estimators agree (≈ −6.5 to −7.5).
- p4b base 1357.96 is a +370ms machine spike (cause unobserved; box quiet after; no foreign PIDs touched). Verdict is robust to it: ex-p4 medians give −6.86. Disclosed, not discarded.
- Mechanism check: prize floor N2 = 2.8ms (hot-cache), cold reality ~4–5; measured −7 sits ~1.6–2.5× the floor — allocator second-order (12,000 fewer BTree builds + frees), recipepath-precedented shape, not a keys2-style 7× overread. No LAND claimed (sub-bar both prongs → correct BANK).

### Identity: 4/4 vs sealed pins (full sha256, base==cand every scale)

| scale | styles.css | runtime-data.mjs |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) == pin | `718d19e4…78918` (214,466 B) == pin |
| small | `ecdec1e8…bda2973` (92,651 B) == pin | `ad9194f4…994d41` (91,030 B) == pin |
| medium | `37f2ef5b…4819fe` (348,780 B) == pin | `54735e4d…cfe7ce` (110,241 B) == pin |
| churn | `1aad4978…10ec05` (8,289,806 B) == pin | `e1349305…f18cdb` (103,709 B) == pin |

Enterprise: all 20 runs (4 warmups + 16 pairs) full-64 == pins. cssCalls exact every run (7527/171/635/43956).

### Determinism

20/20 enterprise + 6/6 cross-scale output hashes identical. Zero discards.

### Suites + quality

- `pnpm agentrs c atomic`: 595 + 1 + 0 green (== tip count, delta 0 — pure refactor, no new tests needed).
- `pnpm agentrs q` on both diet files: 0 violations.

## Fences honored

- shot2 KILL: no pre-open signals, no skip logic — fusion removes a redundant walk, decides nothing.
- Parse's landed reuse: staged around (streamed transient parses untouched; reuse is retained-only).
- Programsfx's programs maps: no map touched (2 files: stream.rs, staging.rs).
- Hashers' Fx types: composed underneath (no type changes).
- Extract's JsxHosts union: untouched. T3 recordaudit (ModuleRecord internals) + extend (ModuleKey): attributed at boundary, never dieted.
- Sortshape: zero order changes (merge/stage/walk order all preserved).

## Collision

- bagdefer (downstream, gated on this verdict): my fusion is streamed-double-collect; their ground is from_plan collect/load arms — adjacent, disjoint mechanisms.
