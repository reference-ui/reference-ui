# WAVE1 — C1: unify documented paths on dist mode + freshness gate

STATUS: C1 LANDED (`490962c4d`, amended bar) — C2 (cwd canon) next per CWD.oracle

Bar (amended per `CWD.oracle`): root-cwd documented-form sync reproduces the
four lib pins (mode unification); package-cwd delta confined to banner lines;
`ensure-dist` fresh-clone + steady-state + opt-out proofs; suites green. Full
cwd-independence moves to C2.

## Entries

### C1 — dist unification + neo-dist freshness gate (`reports/WAVE1.C1.md`)

VERDICT: implementation lands; **zero-churn bar fails as specified.** The gate
(`packages/reference-neo/tools/ensure-dist.mjs`) and the dist-CLI wiring for
lib/docs/icons land cleanly (fresh-clone rebuild 0.53 s; steady state ~45–90 ms;
`agentneo q` 0 errors; neo `src/config` vitest 28 pass). But the documented lib
`sync` (cwd = `packages/reference-lib`) changes `system/baseSystem.mjs`
(`e4099f20`→`2ccabe2e`) and `types/types.mjs` (`31d8786e`→`a7afb537`); `react.mjs`
and `.map` stay pinned.

Root cause is a **cwd axis**, not mode: `build-options.ts` never sets
`absWorkingDir`, so esbuild `// <path>` banners are `process.cwd()`-relative.
The one-shot pin was captured by the harness from the repo root
(`// packages/reference-neo/dist/…`); documented scripts run from the package dir
(`// ../reference-neo/dist/…`). Reproduced on docs too (`baseSystem` `3cf8397a`→
`fad0d893`). `types.mjs` differs in 47 banner lines only (banner-stripped equal).
Invoking the dist CLI from the repo root with an explicit dir reproduces **all
four** pins exactly; pins baseline untouched. A cwd canon (root invocation, a
package-cwd pin re-baseline, or canonical `absWorkingDir` + re-baseline) is a
captain/Oracle decision. `check:dist` is stale on the edited `package.json`
mtime (normal; rebuild needed).

### Captain verification + escalation

- Confirmed the cwd axis firsthand: from repo root with a dir arg
  (`node packages/reference-neo/dist/bin/ref.js sync packages/reference-lib`)
  all four lib artifacts equal the pins; the documented package-cwd
  `pnpm run sync` changes `baseSystem.mjs` (`e4099f20→2ccabe2e`) and
  `types.mjs` (`31d8786e→a7afb537`); restored from root → `verify-pins` **PASS**.
- Code confirmed: `build-options.ts` never sets `absWorkingDir`;
  `cli/sync.ts` `runSyncCommand(dir, …)` resolves the dir but never `chdir`.
- Implication: the committed pin (and the one-shot R1 re-baseline) is a
  **repo-root-cwd artifact**, reproducible by no documented path.
- **C1 product changes held uncommitted.** Escalated to Oracle `CWD.oracle`
  (`briefs/CWD.oracle.md`): choose the canon (root invocation / package-cwd
  re-baseline / canonical `absWorkingDir` + re-baseline), whether the gate +
  dist wiring land separately, and whether it folds with B3-depth.

### Oracle CWD.oracle: canon = option (3), neo-root `absWorkingDir`; C1 lands now

- Ruling: reject root-invocation (1) and package-cwd (2) canons; **adopt (3)**
  `absWorkingDir` = **neo package root** (`import.meta.url`) set unconditionally
  in `buildMicroBundleOptions`, plus resolve `config/bundle.ts` metafile keys
  against the exported canon base (R3 edge — `bundle.test.ts` guards it).
  Also: 6 pinned files affected (`baseSystem`+`types` × docs/lib/icons);
  `react.mjs`/maps must not move; **two commits** (C2 code, then pins-only).
- C1 **lands now on an amended bar** (mode unification; package-cwd delta
  banner-only); cwd-independence is **C2**. C2 does **not** fold with B3-depth.
  B2 stays CUT (the cwd canon is a new item, not B2 revived).
- GATES step 3 amended: identity proof runs each package's documented sync
  **from its package dir**.
- Captain verified amended bar: root-cwd form = pins; package-cwd
  banner-normalized **EQUAL** (280/280, 47/47 banner lines); `ensure-dist`
  steady-state 45 ms, opt-out exit 0, quality 0/0; `verify-pins` PASS.
- Landed **`490962c4d`**.


