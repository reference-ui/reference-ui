# Matrix runner: performance & simplicity direction

Standing decisions from the simulation wrap-up (Sep 2026). Parked here so the
rewrite can pick them up later. Nothing below is implemented yet.

## Where matrix is going

Matrix keeps ONLY tests that are genuinely about interpackage/distribution
behavior: chaining, distro installability, tarball contents, consumption of
built output across packages. Everything else moves to a new `reference-*`
harness (name TBD — candidates: `assay`, `trials`, `crucible`, `gauge`) built
lib-style: fast, no registry, no pack/publish/install cycle.

Triage rule per suite: "does this test fail if packages are linked from source
instead of packed → published → installed?" No → it moves. Yes → it stays.

Open question: the bundler × React-runtime container axis. It isn't
interpackage, but it needs hermetic environments. Decide later whether a slim
container axis stays in matrix or the new harness grows a container mode. Do
not strand the "works in webpack + React 17" proof by accident.

## Runner philosophy: exclusive, full throttle, fail fast

No multi-agent queueing, no waiter loops, no telemetry. The matrix run is a
single exclusive run:

- Lock = a file with a PID in it. PID alive → print "already running (pid N)"
  and exit nonzero. PID dead → take over. A `--force` flag (or deleting the
  file) clears a false busy.
- While held, the run goes full throttle: no cpu-gate participation, no QoS
  management, no sharing — there is nothing to coordinate with by
  construction.
- This deliberately deletes the quarantined `lock.ts` waiter design (unbounded
  poll loop, PID-liveness) rather than hardening it. Nowhere for a wedge
  to hide.

## Bug fixes to take (low-risk, normal operation only)

1. **Staging-copy exclude** (`pipeline/src/registry/package-prep.ts:224-230`).
   The whole-dir copy into `.pipeline/registry/staging` excludes only
   `.git`/`node_modules` — a re-prep copies ~7.7GB, 7.5GB of it
   `packages/reference-rs/dist/cargo` (the Rust target-dir per
   `.cargo/config.toml`). Worse: staging on disk is ~15GB, because
   `dist/cargo` is full of hardlinks that `du` counts once but `fs.cp`
   duplicates. Safety case VERIFIED (probe Q2): the Rust artifact step runs
   BEFORE the staging loop (`pack.ts:113`) and consumes only source bytes
   (`.node` from `dist/native`, intermediates via `cwd: packageDir`); inside
   the loop the only Rust touch is a `package.json` text rewrite; `pnpm pack`
   runs `files`-allowlisted with scripts disabled; and rs `files` lists
   `dist/native` but nothing under `dist/cargo`, `dist/artifacts`, or
   `dist/npm`. Exclude (matched on path RELATIVE to `pkg.dir`, not bare
   basename — core/lib/mcp/icons ship whole `dist` via `files`, so a bare
   `dist` match would break them): `target/`, `dist/cargo/`, `.turbo/`,
   `coverage/` (zero risk); `dist/artifacts/`, `dist/npm/` (consumed
   pre-staging from source only). Keep `dist/native/`. Verification run:
   snapshot `tar -tf` of the 12 current tarballs → `rm
   .pipeline/registry/manifest.json` (forces full re-prep; Rust cache in its
   separate state file still hits, so no Dagger) → `pnpm pipeline registry
   pack` → assert all 12 repack and every `tar -tf` listing is byte-identical
   (staging should drop to ~200MB). Tarball-content identity is the proof.
2. **Missing-tarball crash** (`pipeline/src/registry/pack.ts:146-148`).
   Manifest matches but tarball file missing (deleted, partial clean, or a
   previously failed pack, which `rm`s the tarball at :151 before rewriting
   the manifest) → `readTarballEntries` throws uncaught instead of
   re-packing. One failed pack wedges every future pack until
   `manifest.json` is hand-deleted. Treat as a cache miss and rebuild.
3. **Deleted build outputs report "unchanged"**
   (`pipeline/src/build/cache.ts:40-57` + `build/index.ts:44-50`). `dist/`
   is git-ignored and excluded from hash inputs, so deleting it still hashes
   "unchanged" and skips the rebuild; the failure surfaces later as a
   confusing `pack.ts:169` "missing declared packaged outputs" error.
   Rebuild (or error clearly at the build step) when declared outputs are
   absent.
4. **Glob `files`/`exports` silently skip verification** (LATENT —
   `pipeline/src/registry/package-prep.ts:34-36`). Entries containing glob
   characters are dropped from declared-path verification, so a package
   using globs would pass the tarball-content guard vacuously. All current
   `files` are literal, so no live bug; fix when touching the area.

## Quarantine triage (stash `sim-quarantine-pipeline`, 20 files, +506/−36)

- **Re-apply later:** run-id log/artifact namespacing (`runner/paths.ts` +
  tests + touchpoints) — stops parallel runs clobbering logs; fail-fast
  flags + census summary (`cli.ts`, `run.ts`, `reporting.ts`, `types.ts`) —
  behavior-preserving and tested.
- **Revisit under the matrix redesign (perf, not correctness):** lanes 4→6,
  per-graph pnpm store re-keying, Verdaccio `cache: true`.
- **Drop:** the cross-process lock + queue machinery (superseded by the PID
  lockfile above). Note: the quarantined waiter loop is the prime suspect for
  the sim's css "watch-ready" wedge hangs (OPINION — unbounded `for(;;)`, no
  timeout, PID-liveness check, reentrancy flag leaks to children).

Full pre-revert state also retained at
`refs/tbh/recovery/before-discard/20260916T212523Z-15633`.

## Probe verdicts (landed, folded in above)

- **If you run `pnpm pipeline test` now: full re-prep.** Entry chain
  `cli.ts` → `run.ts:100` → `build/index.ts` → `load.ts:159` → `pack.ts:153`
  → `package-prep.ts:224-230` (`rm -rf` + recursive copy). The copy is
  hash-gated (`pack.ts:146-148`: manifest hash + tarball name + declared
  paths must all match), re-triggering on first run, any tracked/untracked
  file change, lockfile change, version bump, or manifest loss — but NOT on
  ignored-`dist` changes. A read-only prediction with the real hash code
  showed all 12 packages + build-state mismatching right now, because the
  sim wrap-up commit (22:31) landed after the last pack (manifest 22:12).
  So: rebuild everything, re-run the Rust artifact step, re-copy 7.7GB,
  re-pack and reload all tarballs into Verdaccio. No matrix run was executed
  to determine this (static + `/tmp` prediction script, zero writes).
- **Verdaccio `cache: false` is incidental, not deliberate.** Apr 24
  `433c1087` ("ensure proper caching and metadata freshness") deliberately
  set `cache: true` + `maxage: 30d`; Sep 6 kept `true`; Sep 12 `5ab8bb49`
  ("stabilize matrix tests…") flipped `true`→`false` as an unexplained
  one-liner in a 66-file commit whose message never mentions
  registry/caching. Most plausible reading: flipped while debugging matrix
  flakiness to rule out stale uplink responses, never reverted or recorded.
  Trade-off of restoring `true`: Verdaccio serves cached upstream
  tarballs/metadata up to `maxage: 30d`, so range resolution could pin stale
  versions and a yanked/republished tarball could serve stale for 30 days.
  Decision deferred to the slim-matrix redesign.
- Sim learnings: `packages/reference-rs/docs/simulation-learnings.md`.

## Non-goals

No perf tuning of the matrix path until the slim-matrix redesign lands. The
staging exclude above is a correctness-adjacent bug fix (8GB of pointless I/O
on every prep miss), not the start of an optimization pass.
