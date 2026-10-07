# Oracle design consult — cwd-relative emission canon (CWD.oracle)

STEP: CWD.oracle
PIN: HEAD on `reference-system`; the C1 working tree is uncommitted (gate +
dist-CLI wiring + residual paragraph). Read
`.agents/missions/voyage-robustness/reports/WAVE1.C1.md` (falsification),
`reports/DESIGN.oracle.md`, `reports/PLAN.oracle.md`, and `GATES.md`.

## The new falsification

C1's zero-churn bar failed on a **third determinism axis: `process.cwd()`**.
Confirmed by captain repro (restore verified, pins PASS):

| invocation | cwd | lib `system/baseSystem.mjs` |
| --- | --- | --- |
| harness / dist CLI with dir arg from repo root | repo root | `e4099f20…` = **pin** |
| documented `pnpm --dir packages/reference-lib run sync` | package dir | `2ccabe2e…` |

`types/types.mjs` moves the same way (`31d8786e…` → `a7afb537…`); `react.mjs`
(`minify:true`) and its map are cwd-insensitive. Mechanism, confirmed in code:
`lib/microbundle/build-options.ts` never sets `absWorkingDir`, so esbuild's
`// <path>` module banners are relative to `process.cwd()`;
`cli/sync.ts` `runSyncCommand(dir, …)` resolves the target dir but never
`process.chdir`. Same axis on docs (`3cf8397a…` → `fad0d893…`).

**Consequence:** the committed pin (and the one-shot R1 re-baseline to
`3cf8397a…`) is a **repo-root-cwd artifact**. No documented package path
reproduces it. The drift-doc "dist mode ⇒ pin" premise held only because the
harness ran from the root.

## Options (the C1 crew listed; none applied)

1. **Root-cwd invocation canon** — documented scripts invoke the dist CLI from
   the repo root with the package as the `[dir]` arg. Zero byte change
   (verified), but does not remove cwd-dependence and complicates the `dev`
   `concurrently`/`vite` chain; packed installs have no repo root.
2. **Re-baseline pins to the package-cwd (documented) form** — product-
   reproducible, but the harness must `chdir`, and per-package banners differ.
3. **Canonicalize `absWorkingDir` at the microbundle seam** (`build-options.ts`
   / `microBundleWithResult`) so banner text is independent of caller cwd, then
   re-baseline once. You CUT B2 (banner blanking) as insufficient for the
   *mode* content-class files — but this is a different axis (cwd path text),
   and it may be the only robust fix.

## Ask

1. **Choose the canon.** If (3): which base — the **neo package root** (banners
   `dist/src/…`, machine- and install-portable) or the **repo root** (keeps the
   current `packages/reference-neo/…` banner and may mean zero re-baseline, but
   is unlocatable in a packed install)? Confirm `absWorkingDir` is the right
   lever and that setting it does not change resolution of the absolute entry
   points.
2. **Does this revive a B2-adjacent output-seam change as warranted?** If yes,
   state why the cwd axis (unlike the mode axis) justifies it, and its bar.
3. **Re-baseline protocol** for the pins (one line per changed artifact?
   per-package? which mode+cwd is canonical), and whether the one-shot pins
   from the prior voyage must be re-captured too.
4. **C1 disposition.** Do the gate (`ensure-dist.mjs`) + dist-CLI wiring land
   now as their own commit (they are correct under every option), with the
   cwd-canon as a following wave — or hold C1 and land both together? Does the
   canon fold with B3-depth (map sources) or stay separate?
5. **Anything else this axis breaks** — the sourcemap `sources` (already
   cwd/relative), the `types.mjs` banners, `check:dist`, the packed tarball.

## Constraints

Shipped artifact is dist mode; fresh checkouts have no `dist`; no `reference-rs`
contracts/engine-request changes; one working tree.

## Response format

First line `STATUS: DONE` (or `STATUS: REFUSED`). Findings with file:line; the
canon ruling with the exact fix + re-baseline protocol; C1 disposition; revised
bars; P4 for non-repair observations.
