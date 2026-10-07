# Brief — ARC3.impl (crew: general, DeepSeek V4.1 Flash, `#high`)

You implement **Arc 3: native MDX support in Neo sync via `mdx-rs`**.
Read `.agents/missions/finalize/MISSION.md` and `FINALIZATION_REPORT.md`
(repo root) first. Follow the **`agent-neo` skill**
(`.agents/skills/agent-neo/SKILL.md`). Stay inside `packages/reference-neo/**`
plus a case folder; do not edit `packages/reference-rs/**`.

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do
**not** commit, push, or `git stash`. Do not touch ARC1/ARC2 files
(`packages/reference-rs/**`, `reference/bridge/**`, `cli/**`) — this arc owns
`collect/**` and a Neo case. If `git status` shows files you did not touch,
disclose them.

## Context

- Legacy transform: `packages/reference-legacy/src/virtual/transforms/mdx-to-jsx/index.ts`
  (56 lines) uses `@rspress/mdx-rs`. Measured: MDX→JS is 12.6 ms/pass
  (`@mdx-js/mdx`) vs 2.9 ms/pass (`@rspress/mdx-rs`) on the 11-file docs
  corpus. This is **not** the 15s cause; it is a separate capability.
- Neo currently **excludes** MDX from fragment bundling:
  `src/collect/constants.ts` `FRAGMENT_EXTENSIONS` and the gated matches in
  `src/collect/lib/scan/scanner.ts` (see the `hasFragExt` / `scanFlagsOf`
  gates). This exclusion is the landed prerequisite; Arc 3 is the port that
  makes MDX first-class (transform before scan/bundle) without re-introducing
  the crash the exclusion fixed.

## Task

Port the legacy `mdx-to-jsx` preprocess into Neo's collect/scan path so MDX
sources can carry fragment calls, using `@rspress/mdx-rs` (Rust-side) rather
than `@mdx-js/mdx`. Requirements:
- A **proving case** under `packages/reference-neo/tests/cases/` (pick/confirm
  the right group via `pnpm agentneo list` / `search mdx`) that fails before
  and passes after.
- `bench:neo` before/after numbers (`pnpm bench:neo`), scoped to the MDX step.
- Keep `agentneo q` clean: no `any`, no suppressions, 2–6 sentence file
  headers, complexity/length within Neo's limits.

## Bound (important)

This is a **bounded** arc. First do a short feasibility pass: if the seam is
small and clean, implement it end to end. If it is a large port (new module
graph, wire-format changes, cross-package effects), **stop**, write a precise
implementation plan with entry points and a proving-case sketch, and mark the
verdict `NOT LANDED — plan filed`. Do not half-land a broken port.

## Output

Write `.agents/missions/finalize/reports/ARC3.impl.md` with: the feasibility
finding, files changed (exact paths) or the plan, the proving case id +
before/after, `bench:neo` numbers, `agentneo q` result, and a `VERDICT:` line.
Append an entry to `.agents/missions/finalize/ARC3.md`. Then reply with a short
summary.
