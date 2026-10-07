# Brief — ARC1.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

You are the **fix line** for the Oracle's ARC1 review. Arc 1 landed as commit
`7a83e9fa7`; the Oracle reviewed it frozen and returned **mergeable** with
demands that are now next tasks. Read the full review at
`.agents/missions/finalize/reports/ARC1.review.md` before you start.

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Stay
inside `packages/reference-rs/modules/tasty/**`. Do **not** commit, push, or
`git stash`; do not touch `packages/reference-neo/**` (a parallel crew owns it).
If `git status` shows files you did not touch, disclose them.

## Do (tests only — no behavior change)

Implement the Oracle's two test demands. Each test must be a **genuine
falsifier** with the same mutate-disk-then-fresh-control structure the landed
tests use (`scanner/packages/tests.rs:272,303,333`): a broken memo must fail
the primary assertion, and a broken fixture must fail the control.

- **F1 (P2) — pin discovery→extraction memo sharing** (the arc's central
  claim). Add an observable end-to-end falsifier: scan a fixture workspace
  through `scan_workspace` with a bare-specifier import, then delete/rename
  its `node_modules` package entry, then resolve the same specifier through
  the workspace's resolver and require the cached hit, while a fresh
  `ImportResolver::new` on the same root returns `None`. Assert behavior
  (cached hit vs miss), not counters. This must fail if a regression
  constructs a fresh resolver in `extract_ast`.
- **F3 (P3) — three missing key-shape falsifiers:**
  - (a) resolve both `pkg` and `pkg/sub` on one resolver, so a memo keyed by
    package name (not full specifier text) fails.
  - (b) exercise the **fallback** path: cache a fallback-provided specifier
    and a fallback miss (`@types` provider hit / miss).
  - (c) pin that **relative** imports stay uncached per importing file /
    `file_id_set`: two relative resolutions differing only by importing
    file on one resolver yield different answers.

Place them where the module's tests live (likely
`scanner/packages/tests.rs` and/or `scanner/workspace/tests.rs`). Keep the
file-header and quality rules; the file will grow — if it crosses the 365/500
line limits, split into a focused submodule rather than bloating.

## Do NOT do

- **F2** (memoize installed-package enumeration / provider index): the Oracle
  marked it optional and sequenced. Cold one-shot is already ~1.9s, so the
  residual ~2s does not need it. Do **not** implement it; leave it as a
  filed follow-up in your report.

## Prove

- `pnpm agentrs c tasty` green (show the new tests running, not just the
  total).
- `pnpm agentrs v tasty` green; `pnpm agentrs q` on your touched files 0
  violations.
- Confirm you changed **no** production behavior: `git diff` should show test
  code only (plus any test-only helper module). If any non-test file changes,
  stop and explain why.

## Output

Write `.agents/missions/finalize/reports/ARC1.fix.md` (what you added, the
exact commands + results, and the filed F2 follow-up). Append an entry to
`.agents/missions/finalize/ARC1.md`. Then reply with a short summary.