# ARC1 — Memoize external resolution (tasty diet)

STATUS: COMPLETE — `7a83e9fa7` + Oracle fixes `ecbc0139d`; Oracle verdict mergeable, F1/F3 satisfied, F2 filed

Where: `packages/reference-rs/modules/tasty/src/scanner/packages.rs`
(+ `scanner/packages/package_entry.rs`, `package_json.rs` as needed).

Bar: counters ≤ ~19 resolutions and ≤ ~19 package.json reads on the docs
repro; one-shot `ref sync` drops by ~11s; tasty + neo suites green;
`pnpm agentrs q` clean; byte-identical manifest. Bench-lock per `agent-perf`.

## Entries

### 2026-10-07 — ARC1.impl (DeepSeek V4.1 Flash, `#high`) — VERDICT: LAND

Base `291f2c633` (brief pinned `0429dbc91`; see report DX #1). Implemented a
per-scan `ImportResolver` (external memo incl. negatives + absolute-path
`package.json` memo), shared discovery→extraction via `Rc` on
`ScannedWorkspace`. 17 files, all under `modules/tasty/**`. No commit.

Counters (temporary probes, reverted; docs cold one-shot): disk resolutions
8,067→**19** (== distinct specifiers); fallbacks 7,922→**9**; `package.json`
reads 343,926→**44 attempts / 37 parses** (== 44 installed package dirs, each
once); wall 20,525 ms→**1.8–2.0 s** warm (−~18.7 s). Brief's reads target
(~19) reflects specifier count; the fallback must inspect each installed
package once, so 44 is the path-memo floor (documented in report).

Identity: docs tasty output `diff -r` IDENTICAL, 492-file aggregate sha
`3e39ebae…`; `agentrs v tasty` 83 passed. Suites: `c` tasty 85, `v` tasty 83,
`t` exit 0, `q` 0 violations (no new warnings; the 4 transient dead-code/unused
warnings removed). Bench lock held/released twice, free at close. Report:
`reports/ARC1.impl.md`.

Note for fix crew / Oracle: only literal variance is the reads bar (44 vs ~19);
resolution + wall + identity bars met.

### 2026-10-07 — ARC1.fix (DeepSeek V4.1 Flash, `#high`) — VERDICT: DONE

Oracle review (`reports/ARC1.review.md`) returned **mergeable** with F1 (P2) +
F3 (P3) as next tasks. Implemented tests only, inside
`modules/tasty/**`; no production behavior changed (production was temporarily
mutated to prove the falsifiers, then reverted byte-for-byte).

Added 5 tests in 2 focused submodules (existing test files gained only
`mod memo;`):

- **F1** `workspace/tests/memo.rs`:
  `scan_workspace_hands_extraction_a_discovery_warmed_resolver` — scan a bare
  `@memo/lib` import, remove the package, require the workspace resolver's
  cached hit **and** `extract_ast`'s `target_file_id` to resolve from the warm
  memo, while a fresh resolver misses. Fails if extraction builds a fresh
  resolver.
- **F3** `packages/tests/memo.rs`: full-specifier key (`pkg` vs `pkg/sub` on one
  resolver), fallback provided/`@types` hit + fallback miss (both cached), and
  relative imports staying uncached per importing file/`file_id_set`. Each has
  mutate-disk + fresh-control.

Falsifier proof by mutation (reverted): disabling the memo fails F1+F3 (a/b);
keying by package name fails F3 (a) only; specifier-keyed relative memo fails
F3 (c) only.

Suites: `c tasty` **90 passed** (85 + 5; new names observed), `v tasty`
**83 passed**, `q` **0 violations** (one pre-existing >365-line warning on
`workspace/tests.rs`, already 418 lines before this arc). F2 filed as a deferred
follow-up, **not** implemented. Report: `reports/ARC1.fix.md`.

