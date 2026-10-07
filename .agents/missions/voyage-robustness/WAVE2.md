# WAVE2 — C2: cwd canon (`absWorkingDir` = neo package root)

STATUS: C2 LANDED (`a65eecad7` code, `cec363eab` pins); Oracle arc review **LAND**;
fix line **WAVE2.5 DONE** (ARC-P2-1 + ARC-P3-1 + P4-3/P4-4 landed, uncommitted).

Bar (`GATES.md` C2): same entry under two cwds ⇒ identical bytes; `react.mjs`×3
+ maps×3 byte-identical (lever falsifier); 6-line pin delta banner-only
(captain re-baselines); evaluated-spec/manifest/CSS identical; suites + mcp
build green.

## Entries

- **C2 (crew: general, DeepSeek V4.1 Flash)** — `reports/WAVE2.C2.md`.
  **VERDICT: DONE.** `absWorkingDir` pinned to `NEO_PACKAGE_ROOT` (from
  `import.meta.url`) at the microbundle seam; config bundlers (neo + the
  vendored mcp copy) resolve metafile keys against that base. Proof:
  package-cwd vs repo-root dir-arg documented syncs **byte-identical** (1258
  files, 0 diff; harness form matches); `react.mjs`×3 + maps×3 **identical**
  pre/post; delta vs frozen pins is exactly **6 files**, every changed line a
  banner (baseSystem banners 288/280/8; types 47×3), banner-normalized equal,
  non-fragment JSON fields equal, all other 1252 pinned bytes identical; neo C2
  suites 98/98 + `agentneo q` 0 errors (24 pre-existing warnings); mcp `tsup`
  build green + mcp vitest 90/90 + child build on lib OK. 8 files touched (incl.
  the vendored mcp R3 copy and the drift-doc canon statement). Pins untouched.

- **Captain verification + re-baseline.** Re-ran the cross-cwd proof: documented
  package-cwd (docs/lib/icons) vs root-cwd dir-arg syncs **IDENTICAL** (1258
  files); `verify-pins` fails on exactly the **6** expected files; lib
  `baseSystem`/`types` banner-normalized **EQUAL** (280/280, 47/47).
  Re-baselined exactly **6 pin lines** → `verify-pins` **PASS**;
  `agent vitest src/config + src/lib/microbundle` green; `agentneo q`
  0 errors. Commits: `a65eecad7` (code), `cec363eab` (pins-only).
- **Oracle `WAVE2.C2.arc`: LAND, no blocker.** Confirmed every frozen bar and
  the two-commit split. Follow-ups: **ARC-P2-1** (P2, prompt — test-core runner
  exports the SKIP env into lib's build, so mandated agent flows can serve
  stale-neo dist; fix the runner's freshness), **ARC-P3-1** (P3 — a failed
  `build-bin` leaves a gate-fresh partial emit; remove `dist` on failure), and
  P4 ledger items (pin aggregates, drift-doc top pointer). Fix line dispatched.

- **W2.5.fix (crew: general, DeepSeek V4.1 Flash)** — `reports/WAVE2.5.fix.md`.
  **VERDICT: DONE.** **ARC-P2-1:** `ensureLibBuild` now runs the neo freshness
  gate (`packages/reference-neo/tools/ensure-dist.mjs`) with
  `REF_PIPELINE_SKIP_DEPENDENCY_BUILDS=''` (SKIP-unset) before any gated lib
  build; proof: touch neo src → `pnpm agent playwright T1 --list` emitted
  `[ref build] dist ready: 318 files` then passed; steady state 0.04–0.05 s.
  **ARC-P3-1:** `build-bin.mjs` `fail()` now wipes `dist` before exiting; proof:
  simulated tsc failure left `dist/bin/ref.js` ABSENT (direct tsc on the same
  probe showed the emit the old path would have kept), then rebuilt clean.
  **P4-3:** refreshed the 3 pin aggregates + `@ cec363eab` header. **P4-4:**
  supersede pointer atop `NEO_EMIT_MODE_DRIFT.md`. `agentneo q` 0 errors;
  `verify-pins` PASS (1258). 4 files touched, none under `packages/reference-rs`
  or the untracked `pipeline/` files.

