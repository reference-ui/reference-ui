# WAVE1 — R1: `@reference-ui/lib` `./baseSystem` subpath

STATUS: DONE — VERDICT HOLD (identity-baseline conflict; see `reports/WAVE1.R1.md`)

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

