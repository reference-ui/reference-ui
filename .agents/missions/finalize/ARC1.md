# ARC1 — Memoize external resolution (tasty diet)

STATUS: IN PROGRESS

Where: `packages/reference-rs/modules/tasty/src/scanner/packages.rs`
(+ `scanner/packages/package_entry.rs`, `package_json.rs` as needed).

Bar: counters ≤ ~19 resolutions and ≤ ~19 package.json reads on the docs
repro; one-shot `ref sync` drops by ~11s; tasty + neo suites green;
`pnpm agentrs q` clean; byte-identical manifest. Bench-lock per `agent-perf`.

## Entries
