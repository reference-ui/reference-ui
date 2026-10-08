# WAVE1 — R1: `@reference-ui/lib` `./baseSystem` subpath

STATUS: LANDED — Oracle WAVE1.arc: LAND with captain re-baseline; R4 CUT

Bar: config-import loads 7,728 → ~2; config phase 1548 ms → ~10–30 ms;
byte-identity vs Wave 0 pins; config-touching suites green. R2 design note as
CUT-insurance.

## Entries

### R1 — `./baseSystem` subpath — HOLD (inert identity-baseline conflict)

- Crew: general (DeepSeek V4.1 Flash, `#high`); base `29e3e4d3e`, tip `ea102a5cc`.
- Landed: lib `exports["./baseSystem"]` (types+import); 3 configs migrated (docs,
  `matrix/tests/mcp`, `chain/T16`); `LoadConfigError` upstream-sync hint;
  barrel-import guard test; packed-tarball subpath probe (runtime + types).
- **Counts PASS:** config-import loads **7,728 → 2** (`reports/census-docs.after.json`).
- **Timing PASS:** docs config **1548 → 20 ms** median (min 18.9, max 35.1), whole
  sync **1673 → 146 ms**; clears the ≥15 ms / ≥1.5 % LAND bar at 13.7 %.
  8 fresh-process pairs, bench-locked; config mode `evaluateMs` 1535 → 5.
- **Identity HOLD:** `verify-pins` fails one file,
  `docs/.reference-ui/system/baseSystem.mjs` (`b7fece…` → `3cf839…`). Fragment is
  normalized-equal (esbuild source-vs-dist banner/whitespace); `streams`/`jsxElements`
  equal; docs manifest + CSS byte-identical. The pin set is sync-mode inconsistent:
  docs pin is source-bannered (barrel's tsup-inlined copy), lib pin is dist-bannered
  (harness). Under the subpath no single mode passes all three (proven both orderings).
  Remedy is captain-owned pin re-baseline or an emit-mode normalization — **not** an
  R1 rewrite.
- Suites: neo gate **0 errors / 24 pre-existing warns**; T16 4/4; lib `check:dist` OK;
  lib consumer smoke **PASS** (incl. `baseSystem: reference-ui` + consumer types);
  mcp 8 failures **pre-existing** (barrel-vs-subpath identical, model JSON-identical).
- Disclosures: no `reference-rs`; pre-existing untracked `pipeline/` files untouched;
  generated `.reference-ui/` re-synced and `lib/dist` rebuilt (git-ignored); mcp
  `model.json` deleted/regenerated during diagnosis.
- R2 design note filed (read-only) — CUT-insurance only.

### R1 captain verification (independent) + Oracle arc review dispatched

- Census re-run by captain: **totalLoads 2** (`@reference-ui/docs` 1 +
  `@reference-ui/lib` 1). Confirmed.
- Timing re-run by captain (bench-locked, 16 fresh processes): config
  **~19–20 ms**; `syncTotal` **141–166 ms**. Confirmed. LAND bar cleared.
- Identity re-run: **1 missing/changed, 0 unexpected** — only
  `docs/.reference-ui/system/baseSystem.mjs` (`b7fece…` → `3cf839…`). Delta
  scope confirmed to the one argued file.
- Decision escalated to Oracle `WAVE1.arc`: is the HOLD correct, is a
  captain-owned pin re-baseline acceptable (and in which canonical mode), is the
  sync-mode emit nondeterminism a blocker or a separate topic, does
  normalized-equality hide semantic risk, and is R4 now CUT by evaporation.
- R1 product files held **uncommitted** pending the ruling.

### 2026-10-07 — Oracle WAVE1.arc: **LAND** with captain-owned re-baseline

Ruling (`reports/WAVE1.arc.md`): HOLD was correct discipline; the conflict is
an inert, pre-existing, mode-explained baseline artifact. **Canonical mode =
dist** (the shipped `bin: ./dist/bin/ref.js`; `bin/ref.ts` source mode exists
only in-workspace). Wave 0's baseline is **not** invalidated. Fragment preamble
bytes have no semantic consumer (executed, never hashed; only `baseSystem.mjs`
differs → evaluated spec, manifest, CSS byte-identical). **R4 = CUT by
evaporation** (residual ~20 ms; a sound persistent key costs ~the prize).
W1-5/W1-6 = Wave-1.5 fix tasks; W1-1 emit-stability = separate Neo topic.

Re-baseline applied per protocol:

1. Dist provenance attested: `pnpm --filter @reference-ui/neo build` →
   `dist ready: 318 files`, wall **816 ms**, from tip `0a9008d59` (dist track).
2. Fresh all-dist syncs (harness): icons → lib → docs; config 70 / 18 / 20 ms.
3. `verify-pins` failed on exactly
   `docs/.reference-ui/system/baseSystem.mjs` (`b7fece49…` → `3cf8397a…`).
4. Replaced only line 31 of `pins/baseline.sha256` (old `b7fece49…` → new
   `3cf8397a…`); the other 1,257 lines untouched.
5. `verify-pins` → **PASS — 1,258 files byte-identical**.
6. Captain gates: `agent vitest src/config` **27 passed**; `agentneo q`
   **0 errors / 24 pre-existing warns**.

### 2026-10-07 — WAVE1.5.fix: Oracle W1-5 + W1-6 landed

- **W1-5** (`errors.ts`): `UPSTREAM_MARKER` narrowed
  `/@reference-ui\/|\.reference-ui\//` → `/\.reference-ui\//`; a genuinely
  not-installed `@reference-ui/*` package (`Cannot find package '…'`) no longer
  earns the "run sync" hint. Tests: wrapped case rebuilt on the realistic
  **resolved path**; new **negative** (`stays quiet for a not-installed
  Reference UI package`) covers the exact overmatch the old marker allowed.
- **W1-6** (`base-system-import.test.ts`): `BARREL_IMPORT` broadened from
  named-`baseSystem`-only to the exact barrel specifier in **any** module
  position — static `from`, dynamic `import()`, `require()`, side-effect
  `import` — rejecting `/baseSystem` subpaths and non-module strings (docs
  `include: ['@reference-ui/lib']`). Detector self-test now drives 9 banned /
  8 allowed shapes; runner test renamed to match. Anti-vacuous bound, pruning
  walk, and the three-config migration pin unchanged.
- Prove: `agent vitest src/config` **28 passed** (5 files); `agentneo q`
  **0 errors / 24 pre-existing warns**. `git diff` = the three in-scope files
  only. No commit. Report: `reports/WAVE1.5.fix.md`.

### 2026-10-07 — Oracle FINAL: voyage correctly closed; P3 record-polish applied

FINAL.oracle verdict: voyage correctly closed; the two P3s are record-polish,
the eight P4s advisory. Applied:

- **F1** — CLI ready line measured directly (was inferred): `cd
  packages/reference-docs && pnpm exec ref sync` → **313 / 313 ms** (first run
  581 warmup; earlier 296/294). Recorded in `CLOSEOUT.md`.
- **F2** — `packages/reference-lib/README.md` now teaches the fast import
  (`@reference-ui/lib/baseSystem` in `ui.config.ts`) instead of the barrel.
- **F4** — closeout quotient corrected 99.85% → 99.88%.
- **F6** — closeout now discloses the mcp 8 pre-existing failures.
- **F7** — `GATES.md` hardening promise marked superseded.
- **F8** — R3 recorded as CUT by evaporation; R2 reworded as no-action.




