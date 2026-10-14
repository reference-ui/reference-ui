# Release go-list

Work top to bottom once `plan.md` wraps up. Each box is one shippable step;
tick it when its check passes.

## 1. Binaries

- [ ] CI builds the native core for every target (linux x64/arm64,
      darwin x64/arm64, win32 x64), not just linux. darwin-arm64 and win32
      are stale today.
- [ ] WASM build of the Rust core ships beside the native ones (as Panda
      does), so `ref sync` runs in cloud sandboxes and WebContainers.
- [ ] Loader falls back to WASM when the platform binary is missing or fails
      to load.
- [ ] Smoke passes on each native target and on WASM alone.
- [ ] Windows: the staged-publish rename swap (`src/sync/commit.ts`) and the
      tasty per-file swap behave correctly. Known risks, unverified: a rename
      over a live file a bundler or editor holds open fails with EPERM/EBUSY,
      so the commit fails; the rollback renames can fail the same way and
      leave files stuck (their backups are kept); and `symlinkSync`
      (`src/sync/commit-journal.ts`, backing up a symlinked live file) needs
      Developer Mode or admin rights, so it throws EPERM without them.

## 2. Pipeline

- [ ] Fresh clone in CI runs every suite green. Gitignored fixtures were
      partly tracked on 2026-10-14; confirm styletrace sync-root,
      ATM-SITE-16/54/58 and NEO-DIAG-56/57.
- [ ] `docs.yml` artifact path fixed.
- [ ] npm-tarball fallback for unbuildable explicit targets.
- [ ] GitHub Actions and repo settings configured.

## 3. Publish (in this order)

- [ ] `@reference-ui/rust`: adds the `contracts`, `diagnostics`,
      `primitives` and `namer` exports that neo's declarations import (0.0.42
      lacks them).
- [ ] `@reference-ui/icons`: republish (0.0.43 ships broken declarations),
      bump lib's icons pin, and drop the lib smoke's `SIBLING_OWNED_PREFIXES`
      tolerance.
- [ ] Neo's public package: pick the published name (`@reference-ui/neo` is
      `private`, 0.0.0) and make every README's `defineConfig` /
      `extendSystem` import match.
- [ ] `@reference-ui/lib`.
- [ ] After each publish: the packed-consumer type probe against the real
      registry (TS 7 and 5.9; bundler, node16, nodenext; `skipLibCheck` on
      and off) gives 0 errors on the positive file and exact errors on the
      deliberate one.

## 4. Launch

- [ ] Branding.
- [ ] Push `public-release` and open it up.
