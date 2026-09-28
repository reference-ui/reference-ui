# CONTINUITY-T FORTIFY — close (a) Resolve

Date: 2026-09-27. Engineer crew (separate from finder, reproducer, oracle). No commit (captain commits).

Ruling: `.agents/missions/continuity/doom-t-rule.md` (binding, read first). Chose close **(a) Resolve**: engine-grammar `r` values in token slots lower through the shared `resolve_rhythm` chain (already imported — no second lowering), mirroring `resolve_keyframe_value`. The cycle guard refuses `--spacing-root`-as-r with an error diagnostic + omitted declaration.

## Diff summary (4 files, all inside the ruling boundary)

- `packages/reference-rs/modules/atomic/src/stylesheet/system_layers/mod.rs` — `css_token_value` now: `{brace}` alias path unchanged (ATM-TOKEN-11); otherwise runs the value through `resolve_rhythm` (shared import); values the chain leaves untouched print verbatim (genuine-CSS passthrough, silent); values it resolves print resolved — except when the owning slot is `--spacing-root`, which pushes `ATM-E-RHYTHM-ROOT-CYCLE` (error, names token + value, declaration omitted). Returns `Option<String>` (`None` = omit). Minimal diagnostics plumbing through `write_token_entry` / `write_token_block` / `append_tokens` (private helpers + one `pub` signature; required by the ruling's refuse-with-diagnostic guard). Light + Dark both flow through the choke point — one fix covers both.
- `packages/reference-rs/modules/atomic/src/stylesheet/emitter/streams.rs` — the two `append_tokens` call sites pass `sinks.primary` / `sinks.portable`, mirroring reset/global sink parity.
- `packages/reference-rs/modules/atomic/src/diagnostics/codes.rs` — new `RhythmRootCycle` variant + `ATM-E-RHYTHM-ROOT-CYCLE` table row (51 rows) + exhaustiveness-test entry. Location is `DiagnosticLocation::default()` (unlocated): tokens are spec-owned, `BaseSystem` carries no source identity — same honesty as the static-CSS precedent (ATM-DIAG-04).
- `packages/reference-rs/modules/atomic/src/stylesheet/system_layers/tests.rs` — 4 pins (below).

Untouched per ruling: utility resolution, keyframe path, raw-CSS passthrough (`0.25rem` etc.), layer order/preamble, naming, `--spacing-root` semantics. No other production file modified.

## Pins added (Rust unit tests, colocated with the choke point)

In `system_layers/tests.rs` (no new seam station: avoids census/portability blast radius; the seam path funnels through the same function, proven by the unmodified repro reruns below):

1. `doom_t_rhythm_token_value_resolves_through_spacing_root` — `spacing.4 = "1r"` mints `--spacing-4: var(--spacing-root);`, no `: 1r;`, zero diagnostics.
2. `doom_t_dark_override_rhythm_resolves_in_dark_block` — dark `"2r"` mints `--spacing-4: calc(2 * var(--spacing-root));` inside `[data-color-mode=dark]`, light still resolves, zero diagnostics.
3. `doom_t_genuine_css_token_values_print_verbatim` — `"0.25rem"` and `"1px solid red"` print verbatim, zero diagnostics (ATM-TOKEN-14 CSS-wins guard).
4. `doom_t_spacing_root_refuses_rhythm_value` — `spacing.root = "1r"` (css_var `--spacing-root`): no `--spacing-root:` declaration, healthy sibling still emits, exactly 1 error diagnostic with code `ATM-E-RHYTHM-ROOT-CYCLE` naming `--spacing-root` and `1r`.

Fail-without-fix / pass-with-fix, firsthand: pins run against unfixed code → the 3 behavior pins RED (minted `--spacing-4: 1r` / `--spacing-root: 1r` verbatim), guard green; post-fix → 4/4 green (`cargo test -p atomic --lib -- doom_t`: `4 passed; 0 failed`).

Seam proof with unmodified repro vehicles (native rebuilt with fix): `/tmp/doom-t-repro-independent.mts` now prints `--spacing-4: var(--spacing-root);`, diagnostics 0, raw-mint test false; `/tmp/doom-continuity-t1-rvalue.mts` exits 0 with GREEN (was exit 1 RED-FAIL).

## Suites + results

- `pnpm agentrs c atomic` (full Rust): **733 lib + all integration targets green**, incl. the 4 pins and the codes-table tests.
- `pnpm agentrs v atomic` (full seam, fixed binary): **304/305 green**. Explicit: `ATM-TOKEN-11` green, `ATM-COND-01` green, `ATM-TOKEN-12` green (in passing `cases.test.ts`), sibling stylesheet-bytes census cell green (enterprise sheet byte-identical — zero in-tree output drift).
- `pnpm agentrs q` on the 4 touched files: **0 violations** (gate passes). 3 warnings: 2× 5-arg helpers (tolerated, precedented in-tree e.g. `name/escape.rs`, `resolve/tokens/interpolate.rs`; threading the codebase-standard `&mut Vec<Diagnostic>` sink rather than inventing a struct for a 2-function chain); 1× `codes.rs` length (pre-existing: 435 lines before my +10). My lines are rustfmt-clean (verified; workspace-wide fmt dirt pre-exists and was left alone).

Pre-existing red, itemized (NOT absorbed): `tests/harvest-census.test.ts > publishes react.mjs bytes (re-verify after Jettison acceptance)` — `react.mjs raw: expected 158317 to be 158073`. Proven foreign firsthand: with my 4 files surgically stashed and native rebuilt WITHOUT the fix, the same cell fails with byte-identical numbers (158317 vs 158073). Its inputs (`stylePropNames`, static recipes JSON, Neo TS packager) are outside this diff's reach, and the sibling stylesheet-bytes cell on the same compile result is green.

## Sweep evidence

Raw-r mint re-sweep (`:\s*[0-9.+-]*r\s*;`): zero matches across `modules/atomic/tests` goldens/fixtures, `base-system` lib_fixture, the `ATM-COND-01` golden, and lib/core CSS — except `ATM-RHYTHM-07/output/styles.css:583`, the concurrent doom-r crew's ruled utility-passthrough pin (`margin-top: 999…r`, quarantined in `css-quarantine.ts`): utility authorship, not a tokens-layer mint; not this fortify's slot. Input-side sweep (`"value"|"light"|"dark": "<r-stem>"`): zero r-valued token definitions in case inputs, lib_fixture, lib, or core — no in-tree author triggers the new path (consistent with the byte-identical census sheet).

Sibling slots (each covered or ruled out with cited evidence):

- `staticCss` wildcard expansion — RULED OUT: `static_css.rs:80-98` expands over token KEYS into `Want { prop, <token path> }` (`push_static_item`, :209-225), which then resolve through the normal utility pipeline (rhythm + tokens). It never reads `entry.light()/dark()` and prints no raw values.
- Recipe token emit — RULED OUT: `recipes/mod.rs:292-295` resolves recipe wants via `resolve_want_with` (the untouched utility pipeline); recipes never read raw token values.
- Other raw-token emitters (exhaustive rg for `.light()/.dark()`): only `system_layers` (fixed choke point); `base-system/src/motion.rs:90` extracts a keyframe NAME for gap analysis (not sheet emit; `1r` yields no ident → None); `base-system/src/lower/mod.rs:188-189` builds the load-time alias-cycle graph (not sheet emit); `resolve/tokens/mod.rs:349` emits `var(--…)` references, never values. All RULED OUT.
- Opacity modifiers over non-color tokens — explicitly OUT of scope per ruling; not touched.
- ATM-TOKEN-11 — green (proven above); the `{brace}` path is byte-unchanged code.

## Notes for the captain

- Shared-checkout awareness: the concurrent doom-r crew's work (`resolve/rhythm/mod.rs` finiteness gate, `ATM-RHYTHM-07/`, `css-quarantine.ts`, `doom-r-fortify.md`) was in-tree throughout; untouched by this crew. Interaction: this fix inherits doom-r's chain behavior (non-finite stems pass through verbatim, exactly as keyframes do) — no fork, per ruling. No conflicts: disjoint files.
- Finiteness edge: a token value like `"infr"` prints verbatim (shared-chain passthrough, doom-r's ruled slot), matching keyframe behavior — tokens are now exactly at parity with the reference path, which is what the ruling demands.
- No commit made; 4 files modified + this report. Captain commits.
