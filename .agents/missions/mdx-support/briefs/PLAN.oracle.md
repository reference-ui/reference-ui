# Oracle plan check — PLAN.oracle (mission `mdx-support`)

STATUS: PENDING

Workspace: the live worktree (branch `openchamber/mdx-support`, HEAD `a1afefbb0`).
Read `.agents/missions/finalize/PLAN-mdx.md` fully — it is the durable,
Oracle-approved plan (prior verdict APPROVED WITH CHANGES, pin `2ffb79770`,
revised at `96f017015`). This mission **re-opens Arc 3** as its own bounded
mission and lands it against current HEAD.

## Objective

Deliver **first-version native MDX support** for Reference UI: `.mdx` files
become first-class fragment sources in Neo sync, using `@rspress/mdx-rs`.
No scope creep: `.mdx` only (`.md` stays excluded). No `packages/reference-rs`
contract change.

## The approved decomposition (review this shape)

- **Phase 1 (captain-gated):** add `@rspress/mdx-rs@^0.6.6` to
  `packages/reference-neo/package.json` and `pnpm install` at the worktree
  root; verify a load probe (`compile({ value, filepath, development:false,
  root:'' })` returns non-empty `code`) on darwin-arm64; note linux-x64/Dagger.
- **Phase 2:** new `src/lib/microbundle/plugins/mdx.ts` (`onLoad /\.mdx$/`)
  registered **unconditionally** in `plugins/index.ts` (covers `bundleFragments`,
  `runSingle`, `runPlanner`); widen `react-stub.ts` to resolve `@mdx-js/react`;
  no `MicroBundleOptions.mdx` flag. On compile error: throw a named diagnostic
  (R5, deliberate divergence from legacy's silent `export {}`).
- **Phase 3:** MDX-scoped **sync** pre-pass. `FRAGMENT_EXTENSIONS += 'mdx'`;
  new `stripMdxNoise` + line-anchored `createMdxImportPatterns` beside the
  frozen `createImportPatterns`; `splitScan` gains an optional `mdxPatterns`
  (stays sync); `native.ts` builds and passes the same. No `.ts/.tsx` golden churn.
- **Phase 4:** proving case `NEO-MDX-01` + decoy-only `world/theme/decoy.mdx`
  + a scan-level decoy assertion in Vitest; bench axis if in reach.
- **Phase 5:** docs cleanup handed to `agent-docs`.

## Review question

Given current HEAD `a1afefbb0` (neo drift since the plan base: several
microbundle/sync/guard commits), judge:

1. Is the R2 shape still correct: for `.mdx` candidates match the
   **stripped** content with `mdxPatterns` and **never** with
   `discoveryPatterns`, while all other JS-bundleable candidates keep the
   frozen `matchesAnyPattern(content, discoveryPatterns)`? Any hidden seam in
   `splitScan` / `native.ts` line 212 that breaks this two-matcher split?
2. Does `createMdxImportPatterns`'s line anchor
   `^[ \t]*import[ \t]+(?:[^'"\n]*?[ \t]+from[ \t]+)?['"]<id>['"]`
   have a correctness hole (e.g. multiline imports, `export … from`,
   comments, CRLF) that would either miss a real top-level import or match a
   fence/prose line the strip did not remove?
3. Is unconditional plugin registration really inert for non-MDX bundles, and
   is the react-stub widening the right route for `@mdx-js/react` bindings?
4. Anything in the re-opened mission's scope that the plan understates or that
   should be sequenced/reviewed differently. Flag missing evidence, not
   preferences.

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as the first line, then the
review: verdict, findings with severity + file/line, and whether the plan may
proceed to Phase 1 as written. Read the live code before concluding.
