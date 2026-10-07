# Oracle review — ARC1.review

STEP: ARC1.review
PIN: commit `7a83e9fa7` ("perf(tasty): memoize external import resolution per scan"),
on branch `reference-system`.

Judge **that commit, frozen**. The working tree may carry unrelated in-flight
work from a parallel crew (other packages) — use `git show 7a83e9fa7` and
`git diff 7a83e9fa7^ 7a83e9fa7` and ignore uncommitted changes outside it.

## Objective

Reference UI's `ref sync` one-shot on the tiny docs app reported ~15s; ~11s
was the tasty phase's external import resolution with zero memoization:
8,067 `resolve_external_import` calls / 7,922
`find_installed_declaration_provider` fallbacks / ~243k `package.json`
reads — all behind **19 distinct specifiers**.

Arc 1 memoizes resolution per scan. Contract: **same inputs → byte-identical
manifest bytes**.

## What landed (read it)

- `packages/reference-rs/modules/tasty/src/scanner/packages.rs` — the new
  `ImportResolver` (external memo by specifier, negatives included, plus a
  second-level `package.json` read memo by path).
- `.../scanner/model.rs`, `scanner/workspace.rs`, `scanner/workspace/*.rs` —
  resolver created in `scan_workspace`, carried on `ScannedWorkspace` via `Rc`,
  shared by discovery and extraction.
- `.../ast/extract/**` + `.../ast/mod.rs` — resolve sites take `&ImportResolver`.
- `.../scanner/packages/package_entry.rs`, `packages/tests.rs`,
  `tests/extract.rs`, `tests/resolve.rs`.

## Prior verification (captain, firsthand)

- `pnpm agentrs c tasty` 85 passed; `pnpm agentrs v tasty` 83 passed;
  `pnpm agentrs t` exit 0; `pnpm agentrs q` 0 violations (20 soft warnings).
- Docs cold one-shot: 20,525 ms → ~1.8–2.0 s; resolutions 8,067 → 19;
  fallbacks 7,922 → 9; `package.json` reads 343,926 → 44 attempts / 37
  parses. Output `diff -r` identical (492 files; `manifest.js` sha
  `51c69b1d…`).
- **Known variance from the report's bar**: the report predicted
  `≤ ~19 package.json reads`; the change yields 44 attempts / 37 parses,
  argued to be the distinct-installed-package floor. Weigh whether that is
  acceptable or masks a real defect.

## What to review

1. Correctness of the memo keys and lifetimes: is caching a **negative**
   (`None`) result safe for the lifetime of a scan? Can a symlinked or nested
   `node_modules` layout resolve the same specifier differently at two sites
   in one scan, so a single-key memo returns a wrong answer? Check the
   `Rc` sharing across discovery→extraction and whether any site mutates the
   resolver.
2. Byte-identity risk: does memoizing change ordering or any fallback that
   previously observed on-disk state mid-scan?
3. The 44-vs-19 reads bar: is "one read per installed package dir" truly the
   floor, or does the fallback re-walk more than necessary?
4. Test adequacy: do the added unit tests actually falsify a broken memo
   (positive, negative, path), or do they pass vacuously? Name any missing
   falsifier.
5. Seam with Arc 2 (tasty off the one-shot critical path) and Arc 3 (native
   MDX): anything Arc 1 changes that a later arc would build on wrongly.

## Response format

First line: `STATUS: DONE` (or `STATUS: REFUSED`). Then actionable findings,
each with a stable ID, severity, file:line at the pinned commit, evidence
(exact code/tests), recommendation (observable behavior, not a patch), and the
validation gap. Mark non-repair observations P4. End with a verdict (clear,
findings, or refuse) and whether the slice may merge while gaps become next
tasks.
