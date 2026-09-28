# OPERATION CONTINUITY-01 — ROOT-VAR review oracle verdict

**Verdict: VERIFIED (commit-ready)** — core arc only. The HQ-addition
ergonomics item (knob + rhythm docs) is **not delivered**; recorded below as
an open follow-up for captain/HQ disposition, not as an arc defect.

## 1. Design soundness — SOUND (read firsthand)

- `root_default.rs:16-17`: verbatim 52B block
  `@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n`; value matches
  lib `global.ts:4` (`--spacing-root: 0.25rem`) — confirmed by read.
- Single sheet: `emitter/mod.rs` sequential oracle and `streams.rs:62-78`
  joins both prepend root **outside** the package wrap. First-declared `root`
  = rank 0, pinned by `cascade-order.test.ts` (`rootRank == 0`,
  top-level `['root', 'color-mode']`).
- Extends: `streams.ts:171-174` hoists own-root pre-statement;
  `printUpstreamBlock` (`streams.ts:78-88`) drops upstream `root` and `reset`
  (reset precedent); published entry keeps own root (`toPublishedEntry`).
  Exactly-one-root + placement pinned in `streams.test.ts` (28 green) and
  `streams-goldens.test.ts` (13 green), plus CHAIN-07 extended-phase
  `countOccurrences('@layer root {') == 1`.
- Preamble untouched: `layers/mod.rs:12` string byte-identical (doc-only
  diff). Rejection bare: `preamble_only()` has no root; `ATM-TOKEN-10`
  absent from the diff. Naive-unshift failure mode (downstream default
  outranking upstream author) is correctly avoided by the below-everything
  placement. Documented boundary (author `@layer root` in an earlier sheet
  joining below) is pathological and accepted.

## 2. Suites re-run firsthand

| Suite | Oracle result |
|---|---|
| `agentrs c atomic` | 735/735 green |
| `agentrs v atomic -t ROOT` | ATM-ROOT-01 + ATM-ROOT-02 green |
| `agentrs v atomic` (full) | 306/307; sole red = harvest-census react.mjs pin |
| neo unit (`vitest run`) | 549/551; reds = the 2 HINTS verbose tests |
| `agentneo run NEO-CHAIN-07` | PASS (560px → 1120px → 2240px phases) |
| `agentneo run NEO-SITE-16` | FAIL, same signature as briefed |
| neo `streams/sources` trio | 45/45 green |
| `agentrs q` (new engine files) | 0 violations |

Reds confirmed unchanged/foreign, none absorbed:
1. **harvest-census react.mjs**: measured `reactRaw 158317` vs pin `158073`
   — exact itemized values; crew's diff only re-pinned css cells
   (+52 raw/+1 rule, plans/wants unchanged) and never touched the react
   pipeline. Foreign, pre-existing.
2. **HINTS copy mismatch** (`bin/ref.test.ts`, `src/sync/sync-diagnostics.test.ts`):
   engine emits `remove 'x' or check its spelling`, test expects
   `remove it or check the property spelling`; HINTS commit `36dc3ca9d`
   (Sep 26) predates the mission; crew touched neither file. Foreign.
3. **NEO-SITE-16**: fails `sheet carries member color` — member utilities
   absent from sheet, a failure a root-block prepend cannot cause; crew's TS
   is a provable no-op under a rootless engine (`own.root ?? ''`). Foreign;
   needs owner triage as briefed.
4. **Lock flakes**: full neo run in this session showed zero flakes;
   `clean.test.ts` 6/6 solo; crew touched no sync/lock code. Unchanged.

## 3. Golden attestation spot-check — CONFIRMED (independent script, full set)

- ROOT block = 52 bytes; **247/247** changed ATM `styles.css` satisfy
  `new == ROOT + HEAD-old` byte-exact (crew claimed 247; I re-verified all,
  not a sample). Zero `css.json`/`diagnostics.json` churn worktree-wide.
- 6 non-stylesheet case-file diffs are the mechanical `startsWith`
  prepends (DIAG-03, GHOST-03, LAYER-02/03/04/08) — reviewed, correct.
- Scan goldens: +52B each (small 92651→92703, medium, enterprise, churn),
  `runtimeSha` unchanged each. NAMER-04 literal: root-first prepend.
- T-fortify-carried `diagnostics/js/index.d.ts` hunk (warningHintFor) is
  regen output, not crew-authored; safe to ride, captain may split.

## 4. Ergonomics gap check (HQ addition — fact-finding only)

**Not delivered.** No overwrite knob exists in the diff (no theme/config API;
the demonstrated overwrite path is raw `globalCss({ ':root': … })` /
author CSS, see CHAIN-07 `OVERRIDE_THEME`). No rhythm docs fragment exists
(SPEC.md + layers/README.md edits are internal contract prose, not
user-facing rhythm documentation). Note: the mission log records this
addition as "briefed (queued, no interrupt)", i.e. it landed after the crew
was underway — recorded here as an open follow-up, not a crew defect. If HQ
requires the knob in this commit, the verdict flips to GAPS; otherwise commit
now and dispatch a follow-up.
