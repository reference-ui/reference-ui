COMPLETE

# Voyage log — Objective 1: Token errors

Captain and crews append here. Cleared 2026-09-19: census clean,
oracle CLEAR TO COMMIT, captain committed. (Vetoes are logged, not
blocking, per standing orders.)

---

## Crew report (filed, uncommitted)

22 textual sites → 31 warnings → 0; sync 127 → 96 (Δ exactly −31, all
else byte-identical); 5 colocated vitest suites green; capture
spot-check shows NumberField + going transparent → muted wash on
hover. Rendered impact was uniform: unknown paths emitted raw
(`background: ui.button.mutedBackground`), browsers dropped them —
hover feedback silently dead, explainer panels transparent,
destructive chrome lost its red, status labels un-greened. No leaf
had an obviously-correct existing token, so all six were defined
(2 files, +31 lines).

Proposed values (HQ veto still open):

- `design.positive.text` → green.600/400
- `design.bg.muted` → gray.100/900
- `ui.button.mutedBackground` → gray.100/800
- `ui.panel.background` → gray.100/900
- `ui.status.error.border` → red.600/400
- `ui.status.error.text` → red.600/400

Veto watch: the green pair (700/300 vs 600/400 — strongest veto
candidate, crew suggests 700/300 for contrast) and the dark fills
(900 vs 800 on panel + bg.muted).

## Carry-forwards

1. Hover usages emit exactly 2 file-less warnings each — a
   diagnostics formatting bug, filed as Error Correct fodder
   (`VOYAGE-LOG-2.md`).
2. Pre-existing var-name mismatch in `disclosureChrome.ts:44`
   (hardcodes `--ui-button-muted-background`, real var is
   `--colors-ui-button-muted-background`) — left untouched, fallback
   still renders, stays open.
3. `classify.rs` pins the unknown path next to real tokens
   (classification test, unaffected by defining it) — noted, not a
   defect.

## Useful

**Why they error now.** The Forge stillbirth probe (ATM-TOKEN-14)
turned twin resolution strict: mint's twin-decorator pass now
reports UNKNOWN-TOKEN-PATH / UNKNOWN-COLOR for every dangling leaf
instead of letting it through. The census is the siren.

**Why it was always there.** All six leaves were always dangling —
components referenced theme paths that never existed. Previously the
pipeline swallowed them silently (dropped links, fallback paint), so
nobody saw errors because nothing resolved strictly. The bug
(dangling refs + silent drop) predates the probe by the whole life of
the tokens; the probe only made it loud. Fixing the leaves without
fixing the silence would re-bury the next one — that is Objective 2.

---

## Oracle verdict (2026-09-19, crew lead + 4 nested workers)

Verdict: **CLEAR TO COMMIT**. Every numeric and behavioral claim
reproduced firsthand. Per-value provenance is flagged in this section
(sourced from the committed in-code comments), closing
the log-provenance requirement. Vetoes do NOT block commit per
standing orders — commit the proposed values and move.

### Evidence

**Leaves (all 6 at proposed values, firsthand file reads).**
`design.ts:40` positive.text green.600/400; `design.ts:46` bg.muted
gray.100/900; `tokens.ts:169` button.mutedBackground gray.100/800;
`tokens.ts:240` panel.background gray.100/900; `tokens.ts:247-248`
status.error.border/text red.600/400.

**Provenance per chosen value (closes item 6).** Each twin verified
to exist at the cited value: positive.text mirrors
`ui.meter.evenLessGood.foreground` (`tokens.ts:194`, red.600/400
convention transposed to green; `design.ts:40` is the only
`{colors.green.*}` semantic ref in theme); bg.muted and
panel.background mirror `ui.pre.background` (`tokens.ts:57`) and
`ui.tab.track.background` (`tokens.ts:233`, both gray.100/900 —
`radio.track` at `:152` is a different token, no ambiguity);
button.mutedBackground twins `ui.table.row.mutedBackground`
(`tokens.ts:205`, identical gray.100/800); status.error.border/text
mirror `ui.meter.evenLessGood.foreground` (`tokens.ts:194`).

**Census.** 22 textual sites enumerated blind via
`rg "ui\.button\.mutedBackground|design\.positive\.text|ui\.status\.error\.(border|text)|design\.bg\.muted|ui\.panel\.background"`
(9 button + 5 positive + 1 bg + 2 panel + 2 border + 3 text = 22).
`pnpm --dir packages/reference-lib sync` after-log: 96 warnings,
**0** UNKNOWN-TOKEN-PATH / UNKNOWN-COLOR, byte-stable across runs
and identical between two workers' independent runs
(`/tmp/oracle1-sync-after.log` == `/tmp/oracle1-census-after.log`).

**Sync delta.** Before-log built by overlaying the two token files
from `c53d4a005`, then restored (`git status` shows only this log
modified). Before 127 (all 127 lines `ATM-W-*`) → after 96;
`comm` on sorted logs: 96 common, 31 only-before, **0 only-after**.
All 31 removed are `ATM-W-UNKNOWN-TOKEN-PATH`, per leaf: bg.muted
1, positive.text 5, button.mutedBackground 18, panel.background 2,
error.border 2, error.text 3. Arithmetic: all 9 button sites emit
×2 (18), every other site ×1 (13) — 22 sites → 31 warnings → 0.

**Vitest.** The only 5 suites under `src/core` (colocated with the
fix), each re-run firsthand via `pnpm agent vt <path>`: measure
1/11/26, button-variants 6, focus-visible 5 — **49 passed, 0
failed**. (One form note: `pnpm agent vitest lib --run <paths>`
applies `lib` as a `-t` name filter and vacantly "passes" with 49
skipped; the `vt` path form above is the real run.)

**Diff review.** `a61efba6e` token hunks: 2 files, +31/−0, purely
additive (33 `^+` lines minus 2 `+++` headers). No token commits
after `a61efba6e`; `git -S` confirms no leaf existed in any prior
version. Other files in the commit (3 doom logs, doom-skill prose,
3 voyage logs, error-correct doc prose) touch no token semantics.
Carry-forwards confirmed: `disclosureChrome.ts:44` hardcodes
`--ui-button-muted-background` vs the real `--colors-…` convention
(`button.ts:61`, `inputs.ts:145`); `classify.rs` pins
`ui.button.mutedBackground` in reject-tests (canon `:267`, atomic
`:106`), unaffected by defining the leaf.

**Veto watch: logged** (crew-report section above: green 700/300 vs
600/400, dark fills 900 vs 800). Standing orders: log, don't park.

### Nits (non-blocking, for the record)

- N1: error-correct doc "First blood" says "31 sites" — actual is
  22 textual sites / 31 warnings.
- N2: same hunk, "`fbfc83fca` wrote the usages" — true only for the
  button leaf; others came via `1ee2419e8`, `3762068f0`,
  `3bf2d4da2`, `84a3d8073` (`git log -S`, one per leaf).
- N3: carry-forward 1 says hover usages double-emit — the ×2 covers
  all 9 button sites including the non-hover `disclosureChrome.ts:19`.
- N4: this log's lines 5–7 demand "HQ has ruled the vetoes" before
  `COMPLETE` — contradicts standing orders; captain should correct
  when flipping the first line.
- N5: the 5 green suites prove no regressions but none exercises the
  new leaves directly (`button-variants` pins only the pre-existing
  `table.row` twin); fix coverage rests on the sync census.

### Next-dispatch recommendation

Captain commits now (code + this log), flips line 1 to `COMPLETE`,
opens Objective 2 with cartography. No fix loop needed.
