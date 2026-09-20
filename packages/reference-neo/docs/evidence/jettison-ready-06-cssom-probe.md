# Jettison READY ask 6 — CSSOM probe feasibility (measured)

Date: 2026-09-20. Author: MEASURE crew (read-only on source; probe was a temp harness case,
deleted after the run — this file is the only tree write).
Mission: `docs/missions/operation-jettison.md` §6 option A.

## Verdict

- **Exposure CONFIRMED.** `document.styleSheets` exposes every linked same-origin `styles.css`
  with readable `cssRules`, enumerable `@layer` blocks, no `SecurityError`.
- **Cost: milliseconds, with one honest footnote.** ~2.2k rules → **~0.8 ms** median.
  ~34k rules → **~12–16 ms** median, first (cold-JIT) build ~23–26 ms. That is milliseconds, but at
  34k it is also roughly **one frame** — not "sub-millisecond at any scale". Acceptable as designed
  (lazy, once per sheet-list change, dev-only, off the paint path), and ~75% of the cost is plain JS
  string work (split + regex + unescape + `Set`), so there is headroom to halve it if needed.
- **Microtask deferral HOLDS for parse-ordering, DOES NOT hold for network latency.**
  Static head links were already readable at the first script eval (localhost). But a freshly appended
  `<link>` is **absent** from `document.styleSheets` in the microtask after append (control: `rules: -1`),
  readable ~10–20 ms later. On a slow network where the sheet has not arrived by the first `css()` call,
  a single microtask still sees an incomplete sheet → false miss warnings. The probe must ALSO gate on
  sheet completeness (skip while any same-origin linked sheet reads 0 rules and the document is not
  complete; re-check on `load`). §6 option A's "first-paint race handled by deferring the check to a
  microtask" needs that second half.

## Measurements

Env: Neo world harness (`pnpm agentneo run`, headless Chromium per `navigator.userAgent`
`HeadlessChrome/153.0.8010.12`), i9-13900K, 8 hardware threads, 64 GB RAM, macOS.
Sheets served over the harness's local HTTP (same-origin by construction).
Timings are `performance.now()` around a fresh recursive-walk + regex-extract + `Set` build,
7 iterations per scenario; median of 7 reported (min/max show JIT spread).

| Scenario | Style rules → classes | Median (4 runs) | Min | Max (cold iter) |
|---|---:|---|---|---|
| base-only | 4 → 5 | 0.0 ms | 0.0 | 0.1–0.2 |
| 2k-only | 2,203 → 2,214 | 0.7–0.8 ms | 0.5–0.7 | 2.4–2.6 |
| 34k-only | 34,003 → 34,173 | 11.8–15.8 ms | 11.1–14.8 | 22.8–25.8 |
| full (36k) | 36,210 → 36,392 | 12.4–15.3 ms | 11.7–15.1 | 14.4–17.8 |
| full, walk-only (no selector touch) | 36,210 | 0.8–0.9 ms | 0.7–0.8 | ~2.0 |
| full, walk + `selectorText` read (no regex/Set) | 36,210 | 2.3–2.9 ms | 2.2–2.4 | 3.4–6.5 |

Cost split at 36k (~13 ms total): CSSOM traversal ~0.8 ms (6%), selector-string reads ~+1.8 ms (14%),
JS split/regex/unescape/Set ~+10 ms (75%). Full page reload with all 36k rules / 1.27 MB CSS:
101–104 ms navigation+parse on localhost (context, not probe cost).

First-paint race (static head `<link>`, cold headless context, localhost):

| Checkpoint | Sheets listed | `base.css` / `sheet-2k` / `sheet-34k` readable |
|---|---|---|
| body-end script eval | 3 | yes / yes / yes (rules 3 / 1 / 1) |
| microtask after eval | 3 | yes / yes / yes |
| rAF | 3 | yes / yes / yes |
| `load` | 3 | yes / yes / yes |

So on a fast network the sheet beats the parser and deferral is moot. The negative control is what
matters: dynamic `<link>` appended from JS → microtask sees **no sheet entry at all**
(`microtaskReadable: false, rules: -1`), readable one poll later (`laterReadable: true`).
A microtask is not a load-wait; it only covers "script ran before the parser registered the sheet".

## Filter correctness (asserted in-page, all PASS)

- `@layer utilities` collected; `@layer recipes` + unlayered rules **excluded** (decoys absent from the Set).
- Nested grouping inside utilities (`@media` wrapping style rules) **included** via recursive descent.
- Grouped selectors (`.a,.b`), pseudo-classes (`:hover` → class kept, pseudo ignored),
  escaped colons (`.u2k-md\:flex` → `u2k-md:flex`) all extracted; exact class counts asserted
  (2,214 / 34,173 / 5 per sheet, 36,392 full).
- Rebuild trigger: injected `<style>` grows `document.styleSheets` by 1 (observable) and a
  re-enumerating rescan picks up the new utilities classes.

## Implementation warnings for Slice 3 (`namer/miss.ts`)

1. **Do not detect layers by `rule.type`.** Measured: Chromium reports `type: 0` with
   `constructor.name: 'CSSLayerBlockRule'` for `@layer` blocks (spec constant `LAYER_BLOCK_RULE` is 18,
   but the engine does not use it). Match `instanceof CSSLayerBlockRule` (guarded) or the constructor
   name. The probe hit this live: numeric matching found zero layers.
2. **Gate on completeness, not just presence.** Skip the check while a same-origin linked sheet exposes
   0 top-level rules and `document.readyState !== 'complete'`; re-arm on `load`. Otherwise slow networks
   produce false miss warnings on first paint — the exact failure §6A's microtask sentence claims to handle.
3. **Wrap every `cssRules` access in try/catch.** Same-origin sheets read fine, but any cross-origin
   sheet in the page throws `SecurityError`; one unguarded access kills the whole scan.
4. **Unescape selector escapes** (`\:` → `:`) before comparing against constructed class names, and split
   grouped selectors on commas. The DOM class is unescaped; the sheet selector is not.

## Repro (exactly)

The probe was temp-harness-scratch, deleted after 4 green runs (case dir, its `.artifacts/NEO-TMP-CSSOM/`,
and any run-log entry all removed; `rg -il tmp-cssom packages/` returns nothing). To redo it:

1. `mkdir -p packages/reference-neo/tests/cases/tmp-cssom-probe/{world,specs}` with
   `case.json` `{"id": "NEO-TMP-CSSOM", "name": "cssom probe scratch"}` (no `"sync"` → serve-only).
2. Generate sheets: `python3 /tmp/jettison_gen_sheets.py` (kept in `/tmp` for audit) writes
   `world/base.css` (218 B: 4 utilities rules incl. grouped/pseudo/escaped, 1 recipes decoy,
   1 unlayered decoy), `world/sheet-2k.css` (2,203 rules / 2,214 classes, `@layer utilities` with
   `:hover` every 50th, grouped every 100th, `@media`-nested every 200th, 3 escaped),
   `world/sheet-34k.css` (34,003 rules / 34,173 classes, same mix).
3. `world/index.html`: three `<link rel="stylesheet">` + `#probe` div + the body-end race recorder
   (snaps `document.styleSheets` presence/readability at eval, microtask, rAF, `load` into `window.__race`).
4. `specs/cssom.spec.ts`: default-exports `run({page, url})`; asserts exposure, exact counts, filter,
   rebuild; times 7 fresh builds per scenario in one `evaluate`; dynamic-link control in a second;
   prints `PROBE-REPORT` JSON. (Evaluate callbacks must be self-contained — Playwright serializes the
   function alone, closures do not survive.)
5. `pnpm agentneo run NEO-TMP-CSSOM` (typechecks, serves over 127.0.0.1, runs headless). Expect PASS;
   the `PROBE-REPORT` line carries every number in the tables above.
6. Delete the case dir + `.artifacts/NEO-TMP-CSSOM` + scrub `last-run.json`.

Method limits: localhost only (the harness has no network throttling, so slow-sheet timing is
extrapolated from the dynamic-link control, not measured under throttle); Chromium only; synthetic
sheets (same CSSOM code path as real sheets, less selector variety).
