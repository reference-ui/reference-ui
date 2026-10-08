# swarm-diag REPORT: partition dead-render skip

## Mechanism (one)

`DiagnosticChannels::partition` renders every compiler-classified fact via
`render_fact` — then drops the line when the compiler backchannel was not
requested (`logs` lacks `compiler`, the default). For **analysis facts**
(`ExactLookupExpected`, `DynamicSlot`) the rendered line is provably dead
on that path: they were never pushed (no strip reads the line) and never
echo (no sweep reads it). Each dead render pays `catalog.locate` (an
O(offset) `line_col` scan plus a path clone) + `Policy::render_expected`
(a `format!` + value spelling + full `lookup_key()` JSON five-tuple
serialization) — then the line is dropped.

Fix, in `partition` (`channels/mod.rs`): when `!render_compiler`, skip
`render_fact` for unpushed analysis facts, and return early when the
default channel is also empty (every strip and sweep is then vacuous, and
the backchannel is dropped — the loop cannot affect either output). The
per-fact body moved verbatim into a `partition_fact` helper (same
statements, same order) to keep quality-gate complexity flat. Pushed
facts still render whenever the default channel is non-empty, so the
strip/echo behavior is untouched. No diagnostic content, wording, or rule
changes — the skip removes only renders whose value is unread.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (`git rev-parse HEAD`
verified at start; tree clean).

```
.../modules/atomic/src/diagnostics/channels/mod.rs | 70 +++++++++++----
1 file changed, 58 insertions(+), 12 deletions(-)
```

Notes:

- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `build:js` once for harness resolution (gitignored, not in diff).
- Arm selection via `REFERENCE_UI_NATIVE_PATH` at aside `.node` files
  (loader honors it as the sole candidate; INTEGRATE precedent).
- The `partition_fact` extraction is behavior-neutral restructuring:
  base `partition` sat at cognitive 14 (one below the warn threshold),
  so the two skip conditions needed the helper to avoid adding a new
  quality warning.

## Artifacts

- base `.node`: `8cef1f7f5dd12c506fb7b429a74d272211970d7cebd0938925bdb28830c5e454`
- cand `.node`: `89fb3fe6346126b854760c19c35b3bdb386e3814af0e0249623d21116006e724`
- Harness never rebuilt mid-set: no build ran between asiding the two
  arms and the post-block re-verify (aside sha256s identical; worktree
  `dist` `.node` still the cand bytes). 31 bench runs + 2 census syncs
  in between, all via `REFERENCE_UI_NATIVE_PATH` arm selection.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: PASS (incl. 2 new partition tests:
  `unrequested_backchannel_leaves_default_untouched_by_analysis`,
  `empty_default_and_unrequested_backchannel_render_nothing`).
  `pnpm agentrs q` on the touched file: 0 code violations, 1
  pre-existing soft warning (file length, already >365 at base).
  Note: `pnpm agentrs v atomic` (outside the brief's suite bar) shows 1
  failure, `ATM-SITE-54` (`hasWant` wants assertion) — reproduced
  identically on the base `.node`, so pre-existing and unrelated.
- (b) Byte-identical outputs base vs cand on all four scales
  (cssCalls/bytes also exact: 171/183681, 635/459021, 7527/3082391,
  43956/8393515):

| scale      | styles.css (sha256, both arms)                 | runtime-data.mjs (sha256, both arms)           |
| ---------- | ---------------------------------------------- | ---------------------------------------------- |
| enterprise | `7ec827fb…10dcea`                              | `718d19e4…8918`                                |
| small      | `ecdec1e8…a2973`                               | `ad9194f4…4d41`                                |
| medium     | `37f2ef5b…19fe`                               | `54735e4d…fe7ce`                               |
| churn      | `1aad4978…ec05`                               | `e1349305…8cdb`                                |

Full hashes: enterprise `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` /
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small `ecdec1e80f8e71a80402987c6d0e7eb06096c576da6a456ba2cd9b8b5bda2973` /
`ad9194f41181aaee96ab7105e17f707b64fd354cd61d4041b9f40972de994d41`;
medium `37f2ef5b43f8b7cb8f5646b7a6e92a66792919f9f627eb43374d0840d94819fe` /
`54735e4d5a51c56707bfd364523b8090e770fe471abd3d590f51b8a108cfe7ce`;
churn `1aad4978ffdc1ba1ee00dc159f860d1498ca97dcf4038e7bd6efa80deb10ec05` /
`e134930586eb56a5e284637a507f21084733c11a548c7412f9b1f70103f18cdb`.

- (c) Determinism: two further candidate enterprise runs produced
  hashes identical to each other and to the byte-identity pair.

## Mechanism counts (not just ms)

Enterprise fact census (kept seed-7 repo, real `sync()`; compiler arm
via `logs: ['compiler']`, userspace arm default):

- **35,426** `ExactLookupExpected` facts, **0** `DynamicSlot`,
  **0** producer facts, **0** userspace warnings/errors.
- Every one of the 35,426 renders is dead on the default path: unpushed
  (no strip), non-echo (no sweep), backchannel off (line dropped).

Filed-flame cross-check (`enterprise-flame3`, compile scope):
`render_fact` 22 incl = `render_expected` 16 (analysis-only) +
`line_col` 4 (analysis-only, via `catalog.locate`) + malloc 2, with
zero producer-render frames (`render_extract`/`render_harvest`/
`render_resolve`) in the top 200 — the whole cluster is analysis facts.

Per dead render, statically: path `to_string` + `format!` + value
spelling (`String` or `serialize_value`) + `lookup_key` (when-`Vec`
collect + `serialize_lookup_key` JSON) ≈ 4–6 allocations plus matching
frees, i.e. roughly **150–200k dead allocs per enterprise sync**
beyond the 22 wt of direct render samples (the allocator self sits
under malloc/platform, not under `render_fact`).

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json` for
identity runs; pairs without `--keep`. Sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then 8
pairs alternating order (B/C, C/B, …) under one bench-lock hold.

Warmups (unscored): base 1200.04, 1154.88; cand 1136.50, 1158.32.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %   |
| ---- | ----------- | ----------- | ------ | ----- |
| 1    | 1172.04     | 1246.00     | +73.96 | +6.3% |
| 2    | 1230.03     | 1242.22     | +12.19 | +1.0% |
| 3    | 1172.46     | 1136.68     | −35.78 | −3.1% |
| 4    | 1179.67     | 1119.68     | −59.99 | −5.1% |
| 5    | 1167.76     | 1137.42     | −30.34 | −2.6% |
| 6    | 1168.50     | 1131.40     | −37.11 | −3.2% |
| 7    | 1195.63     | 1126.95     | −68.68 | −5.7% |
| 8    | 1162.71     | 1148.00     | −14.71 | −1.3% |

- base median: **1172.25 ms**; cand median: **1137.05 ms**
- median Δ: **−35.20 ms (−3.00%)**, 6 of 8 pairs favor candidate.
- Excluding pair 1: median Δ −35.78 ms (−3.05%) — result stands.
- Median per-pair delta: −33.06 ms.

Note: pairs 1–2 show early-set machine noise on both arms (the lock
held throughout, but other crews' builds still ran); the median
verdict is robust to them, and the ex-run-1 median is stronger.
The measured delta exceeds the 22 wt direct-render ceiling because
the skip also removes ~150–200k dead allocations whose self cost
lives under malloc/platform, not under `render_fact`.

Other scales, single samples each (directional only, high noise at
small N — the small/medium swings exceed any mechanism here and are
reported for completeness, not claimed):

| scale  | base syncMs | cand syncMs | Δ          |
| ------ | ----------- | ----------- | ---------- |
| small  | 337.28      | 168.15      | −169.1     |
| medium | 205.11      | 272.73      | +67.6      |
| churn  | 3000.70     | 2703.35     | −297.4     |

## Verdict

**LAND (delta −35.2 ms + −3.00%, rules 1–3 green)**
