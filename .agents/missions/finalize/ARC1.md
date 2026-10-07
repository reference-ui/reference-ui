# ARC1 — Memoize external resolution (tasty diet)

STATUS: COMPLETE — landed `7a83e9fa7`; Oracle review pending

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
