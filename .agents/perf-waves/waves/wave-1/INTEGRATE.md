# Wave-1 Integrate: combined diet wins (canon + islen + reserve + emit)

Base: `1a57b1e80daaa6b062a2a02e6ad4cc66e56d5402` (verified `git rev-parse HEAD` before
starting). Four patches applied with `git apply --check` then `git apply`, all clean.
No commits, no pushes. Fifth agent (swarm-keys) correctly cut — nothing to integrate.

## Per-change summary

**canon (167 lines)** — `maybe_alias` rejection pre-filter in `canon::dialect::resolve_alias`
(`modules/canon/src/dialect.rs`). Miss paths return after 1–2 byte ops (initial-byte match
+ length check) instead of a 315-entry binary search; members fall through to the unchanged
search. Filter arms are emitter-derived (`generate/emit/dialect.ts::emitPrefilterMatch`, fed by
the alias table itself) with a table-contract test (`alias_prefilter_table_contract`) emitted
from `generate/emit/tests/join.ts` and hand-applied to `src/tests.rs`. Full canon regen was
NOT run (pre-existing emitter/data drift on unrelated files — left alone per brief).

**islen (40 lines)** — `is_length` no-alloc rewrite (`canon/src/css/values/lengths.rs`).
Parses the trimmed `&str` directly; the per-call `to_ascii_lowercase()` String is gone and
unit suffixes match via `eq_ignore_ascii_case` in a new `strip_unit_suffix` helper
(`get`-based, so non-boundary splits miss rather than panic).

**reserve (217 lines)** — exact-capacity reserve-once. `join_with`/`concat2` helpers
(`module-graph/src/ladder/mod.rs`) replace `format!("{a}/{b}")` across the ladder/key/probe
path; needle pre-size in atomic includes (`strip_root`); `decls.len()` reserves for
plans/keys/`seen_keys` in `atomic/src/runtime/builder.rs`; `PathBuf::with_capacity` in
`module-graph/src/key.rs`. All output bytes preserved by construction (push in order).

**emit (346 lines)** — direct-push rule emission. `atomic/stylesheet/{cascade,emitter,name}`
collapse per-atom `format!`/String chains into pushes to pre-sized buffers (`push_declaration`,
`push_escaped_value`, `push_indent`, `push_selector_with_system`, `shared_capacity` pre-size);
`EscapeCursor` in `name/escape.rs` preserves the positional leading-char escape rule across
piecewise pushes; `resolve/lexical.rs` gains the shared `sanitize_char` L6 single owner.
(`selector_with_system` keeps its nesting behavior for selector-conditioned atoms; the HTML-side
`class_name`/`class_name_with_system` are untouched.)

## Interaction / collision analysis

Files are disjoint across the four patches (verified: 16 files, no overlaps). Behavioral hunt:

**canon × islen (classify path).** Both are used in `canon/src/css/values/classify.rs`, but on
disjoint inputs: `resolve_alias` (via `canonical_prop`) classifies PROPERTY names;
`is_length` classifies VALUES. Neither calls the other (call-graph grep confirmed: `is_length`
callers are `value_kind` + atomic `harvest/classify.rs`; `resolve_alias` callers are prop-side
only). No semantic overlap, no double-counted savings — each shrinks a different sub-step of
per-declaration classify, so their gains add within classify (modulo Amdahl second-order).

**reserve × emit (assembly phase).** Reserve's `builder.rs` changes are capacity-only
(`with_capacity`); `seen_keys` is insert/contains-only, never iterated (read lines 133–214),
so the `HashSet` bucket-count change cannot perturb output order — plan/key order comes from
`decls` iteration into Vecs. Emit's `builder.rs` adjacency is nil: the builder calls
`class_name_with_system`, which emit deliberately did NOT touch (only the stylesheet-selector
path `selector_with_system` changed). stylesheet `format_declaration` keeps its signature and
delegates to `push_declaration`; its one caller (`emitter/mod.rs:160`) is unaffected.
Independent. (Also noted: `stylesheet/global/walker.rs` has its own pre-existing private
`push_indent` — untouched by all patches, no resolution conflict with cascade's new
`pub(crate) push_indent`.)

**emit EscapeCursor × reserve capacity (hostile read).** `EscapeCursor` is a fresh local per
`push_selector_base` call, index starting at 0; the `.` is pushed raw to `out` (matching the
old `format!(".{escaped}")` where index 0 was the first identifier char). Char sequence
reconstruction verified against `class_name` piece by piece: system + `__` + cond segments
(`seg:seg:`…`:`, same join order) + prefix + `_` + sanitized value + `!` — identical order to
`class_name_with_system`. Sanitize equivalence holds because `sanitize_class_value` →
`sanitize_value` is a pure per-char map of `sanitize_char`, and escape is per-char + position,
so per-char sanitize-then-escape equals whole-string sanitize-then-escape given the identical
sequence. `push_sanitized` shares the same `sanitize_char` single owner — no rule drift.
Reserve's exact-capacity math touches none of these buffers (`shared_capacity` is emit's own,
overshoot-tolerant by design). No shared-state violation found. Byte-identity proof below is
the backstop for all of this.

**canon × reserve × emit (triple).** No cross-patch call edges: changed functions only call
same-patch helpers or unchanged code. The `probe.rs::strip_runtime_ext` `concat2` still
allocates per ext (same as the old `format!`, just cheaper) — no behavior change, noted for
honesty, not touched.

**Regen/tests.** Full canon regen NOT run (brief instruction; pre-existing drift untouched).
Emitter-vs-checked-in verified read-only instead (see below).

## Quality + correctness results

**Rust suites** (`pnpm agentrs c <crate>`, combined tree): canon PASS, atomic PASS,
module-graph PASS. `alias_prefilter_table_contract` run explicitly: 1 passed.

**Quality gate** (`pnpm agentrs q`, all 16 touched files): 0 code violations. Two soft-limit
warnings, both pre-existing (base line counts already over 365: `lexical.rs` 367→373,
`builder.rs` 420→423; patches add a handful of lines each). Left alone — no unrelated edits.

**Emitter consistency** (`/tmp/wave1-emitter-check.mjs`, read-only, tsx): extracted 315
`Alias::new` entries from the COMBINED `dialect.rs` (310 single-line + 5 wrapped), fed them to
the REAL `emitDialectRs`, and diffed: emitted `maybe_alias` == checked-in (identical), emitted
`resolve_alias` == checked-in (identical), emitted `alias_prefilter_table_contract` ==
checked-in (identical). Independent re-verification of the filter (JS-side arm parse, not the
Rust test): **315/315 members pass**.

**is_length differential** (throwaway `canon/tests/wave1_islen_diff.rs`, old logic
reimplemented inline, DELETED after run): **0 divergences over 6916 inputs** (numbers × 31
units × lower/UPPER/Mixed case × padding + adversarial tails, non-ASCII, unit lookalikes).
Equivalence reasoning: `f64::from_str` is already ASCII case-insensitive (E/inf/infinity/nan),
so skipping the lowercase is decision-identical; ASCII-only units make byte-suffix and
case-folded-suffix matches coincide, and `get` refuses non-boundary splits exactly where
`strip_suffix` would miss.

**Correctness gates (all pass):**
- (a) suites above green.
- (b) base-vs-combined byte-identical on all four scales (`styles.css` + `runtime-data.mjs`
  sha256; `cssCalls`/`totalBytes` also match: 171/183681, 635/459021, 7527/3082391,
  43956/8393515).
- (c) combined run twice → identical hashes on all four scales (determinism).

Binaries: base `f6f63a07…a8378`, combined `29669014…b10794` (sha256, `napi build --release`,
darwin-x64). Base built from stashed (clean `1a57b1e80`) tree — cargo recompiled (18 atomic
warnings printed, +15 KB size delta); stash round-trip verified byte-identical against a
pre-stash `git diff` backup, pre-existing stashes untouched.

## Benchmark: 8 interleaved A/B pairs (enterprise, `--runs 1 --keep --json`)

Protocol: 2 UNSCORED warmups per arm first, then 8 pairs alternating order (AB, BA, …) under
the bench lock (acquired `mkdir`, released `rm owner && rmdir`). Arm selection via
`REFERENCE_UI_NATIVE_PATH` pointing at the aside `.node` files — the loader honors it as the
sole candidate, equivalent to swapping the file, with zero stamp/rebuild interference (no
freshness check exists on the sync path). Sample = stdout `{…}` record
`.scales[0].samples[0].syncMs`.

Warmups (unscored): base 1219.1, 1248.4; combined 1161.1, 1162.5.

| pair | base (ms) | combined (ms) | Δ (ms) |
|------|-----------|---------------|--------|
| 1 | 1230.8 | 1157.6 | +73.2 |
| 2 | 1229.7 | 1163.8 | +65.9 |
| 3 | 1239.0 | 1164.3 | +74.7 |
| 4 | 1228.9 | 1160.0 | +68.9 |
| 5 | 1218.5 | 1216.4 | +2.1 |
| 6 | 1237.5 | 1157.2 | +80.3 |
| 7 | 1237.5 | 1174.2 | +63.3 |
| 8 | 1223.4 | 1155.5 | +67.9 |

Medians, all 8: base 1230.3, combined 1161.9 → **Δ +68.3 ms (+5.56%)**.
Medians, run 1 excluded: base 1229.7, combined 1163.8 → **Δ +65.9 ms (+5.36%)**.
Median per-pair delta: +68.4 (all 8), +67.9 (run 1 excluded).

Note: pair-5 combined (1216.4) is a lone outlier on the combined arm (base in the same pair
was normal at 1218.5) — single-sample machine noise; the median verdict is robust to it
(combined median excluding pair 5 instead: 1160.0, even stronger). No bisect triggered: the
sum clears the bar (+40 ms / +3% with run 1 excluded) with headroom, so per brief no
component was dropped.

Solo-sum context: canon −39.6 + islen −16.0 + reserve +16.5 + emit −24.6 ≈ −63.7 ms protocol
sum; combined measured −65.9 ms (run-1-excluded median). Sub/super-additivity within noise —
no interaction penalty, no phantom stacking.

## Verdict

**LAND (combined −65.9 ms / −5.36% median at enterprise, run 1 excluded; all green)**

Byte-identical outputs on all four scales, deterministic, suites + quality + emitter +
differential all pass, and the timed A/B clears the bar with and without run 1.
