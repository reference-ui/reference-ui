# voyage-robustness — CLOSEOUT

**Mission.** Harden the config-load / emit / exports path of the one-shot
`ref sync`: deterministic bytes, no silent staleness, and proof machinery that
cannot pass vacuously. Follows `voyage-one-shot`.

- **Branch:** `reference-system` (one working tree; serial implementers).
- **Base → tip:** base `1d556dae9` (post-`voyage-one-shot`, `PLAN.oracle` pin) →
  tip **`1accad80f`** (`chore(pins): re-baseline docs styles.css + baseSystem.mjs`).
- **Crews:** general — DeepSeek V4.1 Flash (`#high`). **Captain** owns commits,
  re-runs the decisive gates, one verified arc per commit.
- **Oracle:** Muse Spark 1.3 **Contributor** tier (Max effort) as a read-only,
  context-firewalled review per land (`PLAN`, `DESIGN`, `CWD`, `WAVE2.C2.arc`,
  `WAVE3.B3-depth.arc`, `WAVE4.micros.arc`, `CONCLUSION`). No `reference-rs`
  contract/engine-request changes anywhere (contract fence held).
- **Headline:** **dev == ship == pin.** Every documented build path
  (`lib` `sync`/`dev`/`build`, `docs` `dev`/`build`, `icons` `build`) runs the
  **shipped dist CLI** behind a neo-owned **dist-freshness gate**; emitted bytes
  are **cwd-independent** (`absWorkingDir` = neo package root); the packaged
  tasty lazy edge is **analyzable and materialized**. `verify-pins` **PASS
  (1258)** from fresh **documented package-cwd** syncs.

All evidence below was re-gathered on the live tree at `1accad80f`; report/ledger
citations are named inline where a wave's own proof is the evidence.

---

## 1. Outcomes — every wave / fix

| wave | item | verdict | commit(s) | evidence |
| --- | --- | --- | --- | --- |
| WAVE0 | recon: 4-file emit drift, silent stale upstream, vacuous verify | LAND (recon) | `29e3e4d3e` et al. | `reports/WAVE0.recon.md` |
| **C1** | unify documented paths on dist mode + neo dist gate | **LAND** (amended bar) | `490962c4d` | `reports/WAVE1.C1.md`; `WAVE1.md` captain verification |
| **C2** | cwd canon: `absWorkingDir` = neo package root | **LAND** | `a65eecad7` (code) + `cec363eab` (pins) | `reports/WAVE2.C2.md`; arc `reports/WAVE2.C2.arc.md` |
| W2.5.fix | ARC-P2-1 runner stale-neo hole; ARC-P3-1 failed-build poison; P4-3/4 | **LAND** | `a2aa41af6` | `reports/WAVE2.5.fix.md` |
| **B3-depth** | `react.mjs.map` sources live-relative (F-A) | **LAND** | `4687076d1` (code) + `beea20e24` (pin-walk) + `7dd862400` (pins) | `reports/WAVE3.B3-depth.md`; arc `reports/WAVE3.B3-depth.arc.md` |
| W3.fix | B3D-P3-1/P3-2/P4-1/P4-3 follow-ups | **LAND** | `60c407a47` | `reports/WAVE3.fix.md` |
| WAVE4 | micro-batch B4 + B5 + B6 | **LAND** | `5b421e4ec` | `reports/WAVE4.micros.md`; arc `reports/WAVE4.micros.arc.md` |
| W4.fix | B4 P2-1 content-honest sync leg; P3-1 upstream icons input; P4-5 message | **LAND** | `9512fad32` | `reports/WAVE4.fix.md`; markers verified at tip (§6) |
| **WAVE5** | close `LIB_TASTY_RUNTIME_404` (materialize + analyzable) | **LAND** | `2b376fd3d` (code) + `e75b4c31c`/`c82052096` (pins) | `reports/WAVE5.tasty.md`; full re-run §6 |
| pins | docs-release drift re-baseline (3 docs lines) | **LAND** | `1accad80f` | §3 below |
| CUT | B2 blanking, B3-xmode, T2 guard, T3 hardening, compile-request relativize, alias canonicalization, narrow-bootstrap, content surgery | **CUT** | — | §4; `GATES.md`, `reports/DESIGN.oracle.md` §2 |
| FILED | content-class residual; `LIB_DIST_ATOMIC_BUILD`; `normalizeConfigDependencyPaths` Win32; mcp dist tripwire | FILED/CUT | — | §4 |

### Commit list (voyage-owned)

```
490962c4d  build(neo): run documented syncs in dist mode behind a dist-freshness gate
a65eecad7  fix(neo): pin microbundle absWorkingDir to the neo package root
cec363eab  chore(pins): re-baseline 6 banner lines for the cwd canon (C2)
a2aa41af6  fix(neo,agent): close stale-neo holes (Oracle ARC-P2-1/P3-1)
4687076d1  fix(neo): emit react.mjs.map sources relative to the live outDir
beea20e24  chore(mission): ignore sync.lock in the pin walk
7dd862400  chore(pins): re-baseline 3 react.mjs.map lines (B3-depth live sources)
5b421e4ec  test(neo,lib): B4/B5/B6 freshness, guard, and Windows marker
2b376fd3d  fix(neo,lib): materialize + de-leak the tasty runtime edge (WAVE5)
e75b4c31c  chore(pins): re-baseline lib+icons types.mjs (WAVE5); add F-7 pin protocol
c82052096  chore(pins): re-baseline docs types.mjs after dev-server restart (WAVE5 complete)
9512fad32  fix(lib): content-honest sync freshness + track upstream icons baseSystem
1accad80f  chore(pins): re-baseline docs styles.css + baseSystem.mjs
```

Interleaved commits by other missions on the same branch (`977593fc6`,
`34ebcf959`, `48c2a7e22`, `daa992fef`, `5e8ff3a72`, `07e130810`, cleanup and
`package-unify-1008` docs) are **not** voyage commits; they are attributed in §3
and §7.

---

## 2. Dist provenance (`GATES.md` step 1)

- `git status --short` at attest time: **only** the three pre-existing untracked
  `pipeline/src/**` files (no tracked dirt):
  `pipeline/src/registry/lock.test.ts`, `pipeline/src/registry/lock.ts`,
  `pipeline/src/testing/matrix/runner/paths.test.ts`.
- `ensure-dist.mjs` steady state: `real 0.05` s, silent, exit 0 (dist already fresh).
- **Full rebuild:** `node packages/reference-neo/tools/build-bin.mjs` →
  `[ref build] dist ready: 320 files, bin dist/bin/ref.js` — **real 0.55 s**.
- **Input hash** (259 inputs — `src`+`bin` recursive, tests/`__fixtures__`/`dist`
  excluded, plus `tools/build-bin.mjs`, `tsconfig.build.json`, `tsconfig.json`,
  `package.json`; method = sorted `relpath\0sha256(content)\n` folded into sha256):
  **`3b89415f97760525c29c1fef8aea79d400b347f45b6b3772afa314c0f93baffb`**.
- **Output tree hash** (320 files, same fold): **`4a361e4064ee04dd8c061522988792e1834920139ac933966c5f8623dbe29f84`**,
  **identical before and after the rebuild** → the dist is the deterministic
  emit of the pinned tip, not a stale artifact.

---

## 3. Identity + gates (`GATES.md` steps 2–4)

### Documented package-cwd syncs, then `verify-pins`

```
$ (cd packages/reference-docs)   node ../reference-neo/tools/ensure-dist.mjs && pnpm exec ref sync
  [ref] already watching this project (pid 46014) — using the running session   # poke→watch rebuilds; see §8

$ pnpm --dir packages/reference-lib run sync
  node ../reference-neo/tools/ensure-dist.mjs && node ../reference-neo/dist/bin/ref.js sync
  REF v0.0.0 ready in 3399 ms   CSS 247.4 KB   Warnings: 12        (real 3.98 s)

$ (cd packages/reference-icons)  node ../reference-neo/tools/ensure-dist.mjs && pnpm exec ref sync
  REF v0.0.0 ready in 10116 ms  CSS 12.1 KB                        (real 10.55 s)

$ node .agents/missions/voyage-one-shot/scripts/verify-pins.mjs
  PASS — 1258 pinned files byte-identical (docs+lib+icons)          exit 0
```

Docs hashes equal the pins directly (`system/baseSystem.mjs`
`559a1078…`, `types/types.mjs` `64f66545…`). A verify with no preceding sync is
vacuous (WAVE0 T3); here it follows fresh documented syncs in all three package
cwds.

### Lib freshness gate

```
$ pnpm --dir packages/reference-lib run check:dist
  check:dist OK — 8 generated outputs present and current with 302 inputs (1 upstream).
```

### Quality

```
$ pnpm agentneo q
  [neo-quality] 0 errors, 26 warnings, 304 files in 1691ms
```

### Dist-mode unification / cwd-independence (C1/C2 bars)

`verify-pins` PASS from the **package-cwd** form is the operative proof: under C2
`absWorkingDir = NEO_PACKAGE_ROOT` (set unconditionally in
`lib/microbundle/build-options.ts`), so package-cwd, root-dir-arg, harness,
watch and packed forms emit identical bytes. The C2 report recorded the full
cross-cwd proof (1258-file 0-diff), the `react.mjs`×3 + maps×3 lever falsifier
(identical), and the banner-only 6-line delta; the B3-depth report recorded the
3-map `sources`-line delta with a reconstruction-to-pin proof. Both arcs were
Oracle-reviewed LAND. The current tip is docs-only over those commits, so the
pins are unchanged by it.

---

## 4. WAVE5 acceptance (`FINAL.closeout` §6)

Fresh **documented** lib build (`REF_PIPELINE_SKIP_DEPENDENCY_BUILDS=1 pnpm
--dir packages/reference-lib run build`; SKIP-leg idiom, neo dist rebuilt first):

```
[ref build] dist ready: 320 files, bin dist/bin/ref.js        (fresh)
ESM dist/theme/index.mjs  75.12 KB
ESM dist/index.mjs        2.15 MB
ESM ⚡️ Build success in 472ms
build-package: B-35 node:url branches patched: 2
real 6.87 / 8.49 s   (warm re-runs; first run 11.10 s under concurrent load)
```

| bar | command | result |
| --- | --- | --- |
| plain analyzable edge | `grep -c '__rewriteRelativeImportExtension' dist/index.mjs` | **0** |
| literal present | `grep -o 'import("./tasty/runtime.js")' dist/index.mjs` | `import("./tasty/runtime.js")` (context: `__name2(() => import("./tasty/runtime.js"), "loadRuntimeModule")`) |
| `dist/tasty/` present | `ls dist/tasty/` | `chunk-registry.js  chunks  manifest.d.ts  manifest.js  runtime.d.ts  runtime.js` |
| populated | `ls dist/tasty/chunks \| wc -l` | **550** |
| size (no eager inline) | `stat -f '%z' dist/index.mjs` | **2251270 bytes (2.15 MB)**, == WAVE4 baseline |
| unmodified consumer smoke | `pnpm --dir packages/reference-lib run smoke` | `PASS mount-reference`, `PASS zero-unexpected-console-errors`, **`SMOKE-GATE PASS`** (real 47.48 s) |
| no Vite analyze warning | kept scaffold (`--keep`), `npx vite build` | `✓ built in 5.31s`; **zero** `cannot be analyzed` / `vite:import-analysis` / `rewriteRelativeImportExtension` / `externalized`; code-splits `runtime-DXxoFEdJ.js`; 554 assets |
| sync time flat | warm lib build wall | 6.87–8.49 s vs WAVE5 6.82 s / WAVE4 ~7 s; dist size unchanged |

WAVE5's extra disclosed seam (`packages/reference-lib/tsup.config.ts` pins
`'./tasty/runtime.js'` `external`) is present at the tip and is what keeps the
edge lazy and the 2.15 MB size.

---

## 5. Named per-wave suites

| wave | suite (command) | result @ tip |
| --- | --- | --- |
| W1/C1 | `pnpm agentneo q` | 0 errors (24 warn then; 26 now) |
| W2/C2 | neo `vitest run src/config src/lib/microbundle src/packager src/cli` | 98/98 (report `WAVE2.C2.md`) |
| W2/C2 | mcp `tsup` build + mcp `vitest` | green + 90/90 (report) |
| W2.5 | neo `tests/shared` vitest | 5/5 (report) |
| B3 | neo `vitest run src/packager src/sync src/config src/lib/microbundle` | 112/112 (report) |
| B3 | `pnpm agentneo run NEO-SYNC-02 / 05 / 06` | **PASS / PASS / PASS** (re-run @ tip) |
| W3.fix | neo `vitest run src/packager src/sync` | 70/70 (report); re-run @ tip = 73 tests, see below |
| W4 | neo `vitest run src/config` | **31 passed (5 files)** (re-run @ tip) |
| W4 | `check:dist` + `verify-pins` + smoke step 3b | OK / PASS (1258) / PASS (re-run) |
| W5 | neo `vitest run src/packager src/sync` | 73 tests, 14 files (report). Re-run @ tip: **72–71 passed, 1–2 failed** — the flaky lock-kill repros only (§7) |

Re-run detail @ tip (they are not all flake-free under the live watcher, so
stated exactly):

```
neo vitest run src/config                                  → 5 files | 31 passed (31)
neo vitest run src/packager src/sync                       → 1 failed | 72 passed (73)   [clean-repro timeout]
neo vitest run src/packager src/sync (2nd run)             → 2 failed | 71 passed (73)   [clean-repro + session-repro]
neo vitest run src/sync/session-repro.test.ts (alone)      → 8 passed (8)
neo vitest run src/sync/clean-repro.test.ts   (alone)      → 1 failed | 1 passed (2)
neo vitest run (full, FORCE_COLOR unset)                   → 2 failed | 601 passed (603)
```

The failures are the documented pre-existing reds (§7), not the voyage's suites.

Mutation-based bars (B4 token-touch `check:dist` FAIL naming
`.reference-ui/system/baseSystem.mjs`; dataless fixture smoke FAIL at step 3b;
B5 tmp-project helper→barrel FAIL; B6 Win32 marker) are reproduced with evidence
in `reports/WAVE4.micros.md` and `reports/WAVE4.fix.md`; they require touching
inputs/mtimes and are cited rather than re-run destructively. `check:dist OK` on
the clean tree and the smoke PASS are re-run above.

---

## 6. WAVE4.fix markers at the tip (verified in the tracked file)

`git show 1accad80f:packages/reference-lib/scripts/check-dist-fresh.mjs`:

- **P2-1** content-honest sync leg: `newestSyncInput.mtimeMs > buildStamp` where
  `buildStamp = Math.max(...distOutputs.map(...))` (lines ~171–173).
- **P3-1** upstream tracked: `const UPSTREAM_BASE_SYSTEMS = ['@reference-ui/icons/baseSystem']` (line 58), resolved via `import.meta.resolve` and folded into the inputs (line 118).
- **P2-1/P4-5** OK line reworded off the false "inputs predate outputs":
  `check:dist OK — 8 generated outputs present and current with 302 inputs (1 upstream).`

WAVE5 markers at the tip: `rewrite-types-runtime-import.ts` (whole-call unwrap,
`GENERATED_RUNTIME_SPECIFIER = './tasty/runtime.js'`, helper strip);
`materialize-runtime.mjs` (`.reference-ui/types/tasty` → `dist/tasty`);
`build-package.mjs` (tasty tripwire); `tsup.config.ts` (`external: ['./tasty/runtime.js']`).

---

## 7. Pin re-baselines

Every baseline commit shows **only** its claimed hash lines (checked with
`git show <c> -- …baseline.sha256 | grep -E '^[-+][0-9a-f]{64}'`):

| commit | claim | changed hash lines | verdict |
| --- | --- | --- | --- |
| `5ea3dcdca` | voyage-one-shot subpath (`perf(lib)`) | 1 (`lib baseSystem`) | prior body |
| `cec363eab` | **C2** cwd canon | **6** — `baseSystem`+`types` × docs/lib/icons | banner lines only (`WAVE2.C2.arc` §5) |
| `a2aa41af6` | W2.5 P4-3 aggregate refresh | 4 (aggregate/header comments; **no** hash line) | cosmetic; `verify-pins` ignores comments |
| `7dd862400` | **B3-depth** live map sources | **3** — `react.mjs.map` × docs/lib/icons | `sources` line only; reconstruction-to-pin proof (`WAVE3.B3-depth.arc` §5) |
| `34ebcf959` | runtime-attributable (`977593fc6`, **font-weight-runtime-1008**) | **9** — `react.mjs`+`.map`+`types.mjs` × docs/lib/icons | runtime mission's; correctly attributed (`WAVE3.fix.md` §4) |
| `e75b4c31c` | **WAVE5** lib+icons `types.mjs` (+ F-7 protocol) | **2** — `types.mjs` × lib/icons | helper unwrap (`WAVE5.tasty.md`) |
| `c82052096` | **WAVE5** docs `types.mjs` | **1** — docs `types.mjs` | WAVE5 completion (`WAVE5.tasty.md`) |
| **`1accad80f`** | **current** docs-release drift | **3 hashes + docs aggregate + 2 header lines = 6 lines** | §below |

**Current re-baseline `1accad80f` (full diff, `6 insertions / 6 deletions`, one file):**

```
# pin: reference-system @ 9512fad32 (re-baseline: docs styles.css + system/baseSystem.mjs
     after docs-release CodeBlock + font-weight runtime landed; lib/icons unchanged)
# captured: 2026-10-08
-27f38f828a89192d62ca0f6cdbeb60b6eecf99eeaad6ce73d5be42f1d92f4b3f  docs/.reference-ui/react/styles.css
+b59a1a71e6b0d696e34b906531b59f4012bbd726fdcaa5645bdc1393085d338e  docs/.reference-ui/react/styles.css
-27f38f828a89192d62ca0f6cdbeb60b6eecf99eeaad6ce73d5be42f1d92f4b3f  docs/.reference-ui/styled/styles.css
+b59a1a71e6b0d696e34b906531b59f4012bbd726fdcaa5645bdc1393085d338e  docs/.reference-ui/styled/styles.css
-fff857dc1793fe96e6c62074ee82830339cde4ce4cd3f829fafe632581a70b4b  docs/.reference-ui/system/baseSystem.mjs
+559a1078c9ca92c8a786e36ee14ff9a6e83790ddc4d926e578637a34240e0b97  docs/.reference-ui/system/baseSystem.mjs
-# docs aggregate: 28366e7a…  files=522
+# docs aggregate: 8b82c29c…  files=522
```

lib and icons lines are unchanged; only the three docs emitted files + the docs
aggregate + the two provenance/header comment lines move. The commit message
records the attribution: the **docs-release CodeBlock fix** (`5e8ff3a72`, the
`.reference-ui/*/styles.css` fade) and the **font-weight runtime landing**
(`system/baseSystem.mjs`); a clean one-shot `ref sync` in `packages/reference-docs`
reproduced the live bytes exactly, so this is deterministic drift, not a
stale-server artifact.

---

## 8. Residual + CUT ledger

### Accepted residual — content-class emit drift

Doc: **`docs/bugs/NEO_EMIT_MODE_DRIFT.md`** §Residual (C1), §Canon (C2), §Canon
(WAVE5).

- Source mode is the **neo inner loop only** (`bin/ref.ts`, `agentneo`,
  `tests/**` importing `src/sync/index.ts`), never a documented build path;
  shipped bytes are **dist-only** and pinned.
- Content-class drift (`types.mjs` tsc-emit-twin graph, `react.mjs` different
  minified program, `react.mjs.map` mappings) is accepted, not a bug.
- Any future cross-mode byte gate must scope to **dist mode**; comparing a
  source-mode emit against a dist-mode pin is out of contract.
- WAVE5 **narrows** this residual by one edge: dist mode now emits the plain
  `import("./tasty/runtime.js")` that source mode already produced, with the
  `__rewriteRelativeImportExtension` helper stripped.

### Full CUT list (`GATES.md`, do not revive without fresh flames)

B2 output-normalization/blanking · B3 cross-mode map identity · T2 config-load
staleness guard · T3 mission-script hardening · compile-request relativize
(breaks SITE-28 replay) · alias canonicalization (no fresh-checkout-safe form) ·
narrow-bootstrap-entry · content surgery (unminify/re-minify, format
canonicalization). Each has its one-line rationale in `reports/DESIGN.oracle.md`
§2 and `reports/CWD.oracle.md`; the `sync.lock` pin-walk exclusion (`beea20e24`)
is the same class as the `tmp/` exclusion, **not** T3 revived (`WAVE3.B3-depth.arc` §6).

### Open advisories (filed, non-blocking, with pointers)

| id | file:line | status |
| --- | --- | --- |
| `LIB_DIST_ATOMIC_BUILD` (CONC-P3-1) | `packages/reference-lib/tsup.config.ts` `clean: true` | FILED (F-2); bar "lib rebuild during a live dev server ⇒ zero 404 windows" |
| `normalizeConfigDependencyPaths` Win32 gap (CWD P4-5 / CONC-P4-2) | `packages/reference-neo/src/config/bundle.ts:30` | FILED note (F-3); needs a real Windows runner |
| mcp dist-content tripwire (ARC-P4-1 / CONC-P4-3) | `packages/reference-mcp/tsup.config.ts` | NOTE (F-4); cheap advisory, not a gate |
| hardcoded upstream list (WAVE4 P4-2) | `check-dist-fresh.mjs` `UPSTREAM_BASE_SYSTEMS` | note — any new `extends`/`layers` upstream must be added in the same change |
| B3D-P4-2/P4-3/P4-4 | `packager/react.ts` map guard | notes — generic guard now folded into `react.test.ts` + NEO-SYNC-02 |

---

## 9. Follow-ups / filed bugs

- **`docs/bugs/LIB_TASTY_RUNTIME_404.md`** → **FIXED** (WAVE5, evidence in §4 +
  `reports/WAVE5.tasty.md`). The packaged lib's lazy tasty edge is analyzable and
  materialized; the consumer smoke flips FAIL→PASS including `mount-reference`.
- **`LIB_DIST_ATOMIC_BUILD`** → FILED separately (Oracle CONC-P3-1); not gated.
- **Native MDX (F-5)** → separate mission; first version on branch
  `openchamber/mdx-support` (worktree `mdx-support`), merge pending decision.
- **`package-unify-1008` / F-1 (drop tsup)** → RULED (raw esbuild), Arc A (lib)
  queued behind WAVE5 (both edit `check-dist-fresh.mjs`).

---

## 10. Known pre-existing reds (scope-untouched, not re-litigated)

| red | scope argument (git) | last observed |
| --- | --- | --- |
| `bin/ref.test.ts` verbose-wording drift ("…value the prop accepts" vs "…accepted value") | voyage touched it **zero** times: `git log 490962c4d^..HEAD -- packages/reference-neo/bin/ref.test.ts` is empty; last change `8114da0f7` (pre-voyage) | full-suite re-run: 1 failed test, exact strings quoted |
| Flaky `clean-repro` / `session-repro` lock-kill | `clean-repro.test.ts` last changed `8114da0f7` (pre-voyage); `session-repro.test.ts`/`session.ts`/`session-owner.ts` changed only by the **parallel second-watch mission** (`48c2a7e22`, `daa992fef`), **not** the robustness arc | `session-repro` alone 8/8 PASS; under live-watcher contention it times out ("timed out waiting for child exit") — env/FORCE_COLOR class |
| Matrix mcp 8 failures | pre-existing; robustness changed the mcp surface only via the C2 R3 vendored copy (`a65eecad7`), covered by mcp vitest 90/90 + child-build smoke (`reports/WAVE2.C2.md`, `voyage-one-shot/CLOSEOUT.md`) | cited, not re-run (hermetic/Dagger) |
| Neo full-suite failure(s) | same `bin/ref.test.ts` wording item (+ the flaky lock-kill above) | full suite @ tip: **2 failed / 601 passed (603)** |

The neo full-suite count grew (603 tests, other missions) since the reports
(568–571); the delta is other missions' tests, not a new voyage red.

---

## 11. Nothing silently dropped — `FINALIZE.md` cross-check

Every open `FINALIZE.md` item is either covered here or explicitly carried:

| FINALIZE item | disposition |
| --- | --- |
| **F-1** drop tsup (esbuild) | RULED; Arc A (lib) queued behind WAVE5 — **carried** (§9). Not part of this body. |
| **F-2** `LIB_DIST_ATOMIC_BUILD` | FILED open advisory — **carried** (§8). |
| **F-3** `normalizeConfigDependencyPaths` Win32 | FILED note with file:line — **carried** (§8). |
| **F-4** mcp dist tripwire | NOTE open recommendation — **carried** (§8). |
| **F-5** native MDX | separate mission; first version delivered — **carried** (§9). |
| **F-6** repo cleanup | OPEN; cleanup pass 2 done (`39931e410`, `7cfd59ab0`); CLEANUP-3 ruling + archive/prune pending — **carried**. |
| **F-7** shared pin baseline under concurrent missions | protocol honored: documented package-cwd syncs only, each re-baseline diff shows only its claimed lines (§7); current baseline `1accad80f`, `verify-pins` PASS (1258) — **addressed**. |
| "Open after docs release" → WAVE4.fix in flight | **LANDED** (`9512fad32`); markers verified (§6). |

No `FINALIZE.md` open item is left unmentioned.

---

## 12. Dev-server cleanliness (observed state)

The mission handoff for this closeout assumed the docs dev server had been
**stopped** and was **not running**. That is **not the observed state at write
time**:

- `lsof -iTCP:5174 -sTCP:LISTEN` → `node` pid **46015** (`vite`) listening.
- pid **46014** = `ref sync --watch` on `packages/reference-docs`; parent chain
  `pnpm --filter @reference-ui/reference-docs run dev` (pid 45942).
- Both started **`Thu Oct 8 00:51:34 2026`** — ~40 s **after** the pinned tip
  `1accad80f` (committed 00:50:54). The docs output it wrote (`…/types/tasty/*`
  mtime `1791417094` = 00:51:34) matches the pins byte-for-byte.

This docs dev server is **not a voyage artifact** and was **not touched** by this
closeout: the docs one-shot `ref sync` used the session protocol — a one-shot
toward a resident watch **pokes it to rebuild** and exits covered
(`packages/reference-neo/src/sync/session.ts:229-241`, `pokeWatchHolder`), which
is exactly what happened. The WAVE5 acceptance (§4) holds **with** the server
running: the fresh lib build, the analyzable edge, `dist/tasty/` (550 chunks),
the unmodified smoke PASS, and the zero-warning Vite build are all independent of
it. No voyage process, scaffold, or tarball was left behind (the smoke scaffold
and the `reference-ui-lib-0.0.46.tgz` it produced were removed; tracked `.tgz`
count = 0).

---

## 13. Verification commands (copy-paste)

```sh
# dist provenance
git status --short
node packages/reference-neo/tools/ensure-dist.mjs
node packages/reference-neo/tools/build-bin.mjs

# identity — documented package-cwd syncs, then verify
(cd packages/reference-docs && node ../reference-neo/tools/ensure-dist.mjs && pnpm exec ref sync)
pnpm --dir packages/reference-lib run sync
(cd packages/reference-icons && node ../reference-neo/tools/ensure-dist.mjs && pnpm exec ref sync)
node .agents/missions/voyage-one-shot/scripts/verify-pins.mjs        # PASS — 1258

# gates
pnpm --dir packages/reference-lib run check:dist                     # OK (302 inputs, 1 upstream)
pnpm agentneo q                                                      # 0 errors

# WAVE5 acceptance
REF_PIPELINE_SKIP_DEPENDENCY_BUILDS=1 pnpm --dir packages/reference-lib run build
grep -c '__rewriteRelativeImportExtension' packages/reference-lib/dist/index.mjs   # 0
grep -o 'import("./tasty/runtime.js")' packages/reference-lib/dist/index.mjs
ls packages/reference-lib/dist/tasty/chunks | wc -l                  # 550
pnpm --dir packages/reference-lib run smoke                          # SMOKE-GATE PASS

# suites
(cd packages/reference-neo && pnpm exec vitest run src/config)       # 31 passed
pnpm agentneo run NEO-SYNC-02 && pnpm agentneo run NEO-SYNC-05 && pnpm agentneo run NEO-SYNC-06
```

---

## 14. Verdict

**CONCLUDED.**

Every LAND carries its frozen bar, the command, the result, and dist
provenance; the final `verify-pins` is **PASS (1258)** from fresh **documented
package-cwd** syncs; every pin re-baseline diff shows only its claimed lines
(the `1accad80f` docs-only release drift attributed to the docs-release CodeBlock
fix + font-weight runtime); the residual/CUT/advisory ledger and all four
pre-existing reds are enumerated with scope-untouched git arguments; every
`FINALIZE.md` open item is covered or explicitly carried; and the WAVE5
acceptance (plain analyzable edge, materialized `dist/tasty/` with 550 chunks,
unmodified smoke PASS incl. `mount-reference`, zero Vite analyze warning, flat
build time) holds on the live tree.

**P4 note (not a HOLD):** the docs dev server **is** running (§12) contrary to
the closeout handoff's "not running" assumption. It is another session's
process, was not touched, and does not bear on any LAND or on the WAVE5
acceptance; it is recorded here so nothing reads as silently dropped. The
remaining external step is the Oracle `FINAL.closeout` review of this document.

*No commit / push / stash performed. Only this file was written.*
