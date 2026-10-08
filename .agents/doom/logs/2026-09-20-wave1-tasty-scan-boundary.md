---
date: 2026-09-20
cycle: wave1
module: tasty/scanner/policy
theories_spent: 1
verdict: break-found
---

# Tasty scan boundary over-collection

## Hypothesis

The scan/emit surface: `packages/reference-rs/modules/tasty/src/scanner/README.md:11`
pins a hard scan boundary — a user file that only `import`s an external package
must NOT cause that package to be scanned (only `export ... from` bridges), and
a library file must only follow same-package imports. Five witnesses state it
(scanner README, `scanner/workspace/README.md`, the call-site comment at
`scanner/workspace/policy.rs:33-34`, the doc comment on
`extract_reexport_module_specifiers` in `scanner/imports.rs:14-15`, and the
`TST-EXT-01` input comment); the crawler still computes per-file
`reexport_specifiers` and threads them into `DiscoveryContext`.

Gap pursued: `should_skip_user_external_import` ignores its
`_reexport_specifiers` parameter and follows every non-dev external import, and
`next_external_depth` permits cross-package hops to depth 2 — so neither half
of the boundary is enforced. Red test: scan a fixture whose user file
plain-imports (never re-exports) `fakelib`, with `fakelib` importing
`otherlib`, and assert no external symbols reach the manifest.

Thin-log note for scheduling: `node .agents/doom/cli.mjs search "tasty"`
returned zero matches before this hunt — tasty had no logged coverage.

## Verdict

`break-found`. Repro `/tmp/doom-tasty-scan-boundary.mjs` (blind-runnable:
`node /tmp/doom-tasty-scan-boundary.mjs [repo-root]`, exit 1) shows the
manifest contains `FakeWidget`, `FakeUnrelated`, `Other`, `OtherUnrelated`
alongside user-owned `Bar` — whole external packages, including symbols never
referenced anywhere, pulled in by one plain `import type`.

Violated contract: the scanner README scan boundary
(`packages/reference-rs/modules/tasty/src/scanner/README.md:11`), code
`packages/reference-rs/modules/tasty/src/scanner/workspace/policy.rs:99-112`
(`should_skip_user_external_import`) and `:83-97` (`next_external_depth`).

Severity: user-facing over-collection. There is no way to import a type for
internal use without documenting its entire package (and, via depth 2, its
neighbors) — manifest/chunk pollution plus scan cost on every external import.

Honesty note for review: git shows the gate existed as written
(`c5006b39b`: `is_user_file && !reexport_specifiers.contains(source_module)`,
same-package-only for libraries) and was deliberately loosened in `2d405aa9b`
("too restrictive ... prevented showing SystemStyleObject members ... filter
at display time instead"), without updating the README, the four other
witnesses, or the now-dead `reexport_specifiers` plumbing. Fix direction
(restore the gate vs. re-ratify the contract + remove the plumbing) needs an
architect ruling — but contract and code cannot both stay as they are.
