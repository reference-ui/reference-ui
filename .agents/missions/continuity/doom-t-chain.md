# CONTINUITY-T CHAIN REVIEW — verdict: VERIFIED (commit-ready)

Date: 2026-09-27. Oracle (independent of finder, reproducer, ruling, fortify). No commit.
Ruling boundary: `.agents/missions/continuity/doom-t-rule.md` (close (a) or (b), no invalid mint + no silence, cycle guard, sweeps, TOKEN-11/14 green). Fortify chose (a) Resolve.

All evidence below is firsthand. The shared checkout is under heavy concurrent write (doom-R committed mid-review as `c047e4e6b`; a root-crew is rewriting streams/goldens live). Every T-attributable claim was therefore proven in isolated worktrees as well as the shared tree:
- `/tmp/doom-t-chain-unfixed` = old HEAD `d349dc0d7` + new pins + codes row (fail-without-fix)
- `/tmp/doom-t-chain-fixed` = committed HEAD `c047e4e6b` + exactly the 4 T files (T-only signal), own native build

## 1. Both blind repros now GREEN (unmodified scripts, rebuilt native)

- `/tmp/doom-continuity-t1-rvalue.mts` → exit 0: `--spacing-4: var(--spacing-root);`, diagnostics silent, utility healthy. GREEN.
- `/tmp/doom-t-repro-independent.mts` → raw-mint test false, diagnostics 0, same resolved mint.
- Finder repro also GREEN against the isolated T-only build. ✔

## 2. Pins fail-without-fix / pass-with-fix (my own runs, isolated)

- Unfixed HEAD + pins: pins 1, 2, 4 FAIL (mint `--spacing-4: 1r` / `--spacing-root: 1r` verbatim); pin 3 (genuine-CSS guard) passes — exactly the expected shape.
- Fixed: 4/4 green in the shared tree AND in the T-only worktree on committed HEAD (T is compatible with the doom-R commit). ✔

## 3. Full affected suites

- `pnpm agentrs c atomic` (shared tree): **735 lib + all integration targets green**, incl. the 4 pins and codes-table tests. ✔
- Seam: shared tree is currently 253-red from the concurrent root-crew (`root` stream key, `@layer root` bytes, golden rewrites in flight) — foreign noise, not T. Definitive T-only worktree run: **303/305**. The two reds, each proven non-T:
  - `harvest-census > publishes react.mjs bytes`: `expected 158317 to be 158073` — **byte-identical with and without T** (stash round-trip, rebuilt native each way). Pre-existing, verified unchanged, never absorbed. Sibling stylesheet-bytes census cell green.
  - `ATM-SITE-54`: fails **identically with/without T at two HEADs**; fixture contains zero rhythm values; green in two independent main-tree measurements (T-fortify 304/305, R-chain "sole red harvest-census"). Harness-environmental (my /tmp+symlink setup), T-neutral by construction (`wants`-only assertions; T touches tokens-layer emit only).
- `pnpm agentrs q` on the 3 T-pure files: **0 violations**, 3 warnings exactly as fortify itemized (2× 5-arg helpers, 1× codes.rs length 442, pre-existing trajectory). ✔

## 4. Line-by-line diff vs ruling boundary

- May-change: `css_token_value` + minimal required plumbing only — `write_token_entry`/`write_token_block`/`append_tokens` diagnostics threading, 2 `streams.rs` call-site args, `codes.rs` row. No forked rhythm lowering: shared `resolve_rhythm` import, keyframe parity. `{brace}` path semantically byte-identical; chain-untouched values still print verbatim. ✔
- Stays-untouched (verified via diff, no T lines outside the 4 files): utility resolution, keyframe path (`resolve_keyframe_value` untouched), raw-CSS passthrough (pin 3), layer order/preamble/naming/`--spacing-root` semantics (cascade-order green in T-only), opacity color-mix slot (explicitly out, untouched). ✔
- Must-move-together: light + dark flow through the one choke point; dark twin pinned (`2r` → `calc(2 * var(--spacing-root))` in `[data-color-mode=dark]`). ✔
- Sweeps (re-run firsthand): raw-r mint sweep = exactly one match, the committed doom-R utility pin (`ATM-RHYTHM-07/output/styles.css:586`, quarantined utility authorship, not a tokens mint). Siblings ruled out with cited reads: `static_css.rs:80-98` expands token KEYS into `Want`s (never reads values); `recipes/mod.rs:292-295` resolves via the utility pipeline; exhaustive `.light()/.dark()` rg = choke point + alias-cycle graph (`lower/mod.rs:188-189`) + keyframe-name extract (`motion.rs:90`) + tests; `resolve/tokens` `format_entry` emits `var(--…)` refs, never values. ✔

## 5. Contracts-held

No invalid mint (valid `var()`/`calc()`), no silence (success silent; root-cycle = 1 error diagnostic naming `--spacing-root` + `1r`, declaration omitted, sibling healthy). TOKEN-11, TOKEN-14, COND-01 each explicitly green with T. ✔

## Verdict: VERIFIED — commit-ready with one handling note

**Captain: commit selectively.** `codes.rs`, `system_layers/mod.rs`, `system_layers/tests.rs` are T-pure, but shared-tree `streams.rs` now carries concurrent root-crew hunks alongside T's 2-line call-site hunk — commit only the T hunk (`git add -p`), never the whole file. All other uncommitted `packages/` files are foreign to this arc.
