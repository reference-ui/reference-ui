# WAVE0 — recon, harness, census, pins

STATUS: DONE (recon crew; awaiting Oracle harness/census review)

Deliverables: baseline phase split; module-load census (per-package);
byte-identity pins; `MEASURE.md`. No product changes.

## Entries

### 2026-10-07 — recon crew: harness baseline, census, pins (DONE)

Tip `reference-system` @ `50df627bd` (product tree == `c5fba023c`). No product
code changed; no commit/push/stash; bench lock held, released in two steps.

- **Phase split (docs, sync mode):** 16 fresh samples / 8 pairs. config median
  **1548 ms** (drop-max 1542; one 4099 jitter outlier), `syncTotal` **1673**,
  `drainMs` **136**; scan 14 / evaluate 10 / compile 45 / publish 47. Config =
  92.5% of `syncTotal`. Raw: `/tmp/voyage-sync-16.json`.
- **Config split:** `bundleMs` 13, `evaluateMs` **1535** (8/8), `importLibMs`
  **1549** (8/8), `importNeoMs` 4. Mechanism = barrel import.
- **Cold arm:** dropped docs `types/tasty`+`tmp`; config 1539 (vs 1548 warm).
  Not truly cold — `purge` needs root, unavailable. Disclosed.
- **Census:** **7,728 file loads**; `@reference-ui/icons` 3,860 +
  `@material-symbols-svg/react` 3,859 = 99.85%. Barrel itself = 2 loads.
  Oracle ~7.7k CONFIRMED. R1 target ~2. Evidence:
  `reports/census-docs.json(.urls.txt)`.
- **Existence proof:** lib self-sync config **18 ms**, icons **19 ms** — both
  already import the zero-import `baseSystem` subpath.
- **Pins:** docs 522 files `cfbf75c3…`, lib 580 `85169ba5…`, icons 156
  `c8f0d68b…` at `pins/baseline.sha256`; `verify-pins.mjs` → PASS (1,258
  files). Determinism proven (docs 18 syncs; lib/icons 2 self-syncs).
  **Finding:** pre-existing lib/icons `.reference-ui` dirs were stale; pins are
  fresh self-sync bytes.
- **Perf index:** `startup` 0 hits, `config` 2 unrelated (109 entries).
- **Disclosures:** mid-wave commit `c5fba023c → 50df627bd` by another session
  (mission docs only); pre-existing untracked `pipeline/` files untouched
  (`registry/lock.ts`, `registry/lock.test.ts`, `matrix/runner/paths.test.ts`).
  `pins/baseline.sha256` matches `.gitignore` `*.sha256` and `reports/` is
  ignored — `pins/README` + `MEASURE.md` carry the aggregates; `git add -f` the
  full pin file if it must commit.

