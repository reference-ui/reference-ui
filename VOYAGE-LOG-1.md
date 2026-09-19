IN PROGRESS

# Voyage log — Objective 1: Token errors

Captain and crews append here. First line becomes `COMPLETE` when the
census is clean, HQ has ruled the vetoes, and the captain has
committed.

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
