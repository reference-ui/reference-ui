# Tabs recipe styles uncollected under concurrent churn — real bug or load artifact?

**Severity:** Unknown (no breakage at HEAD; investigation record)
**Area:** Lib style collector + CT daemon CSS (`styles.css` generation)
**Status:** Open, recorded 2026-09-26 (day campaign, Tabs-F v4). Needs the
quiet-tree experiment below before any conclusion.
**Scope**: lib style collection for Book-side recipe shapes.

## Observed

Stripping `variant="line"|"pill"` from the Tabs kernel into Book-side
recipe objects (fully-explicit static consts, no function calls) lost
utility classes from the regenerated `styles.css`: tabs-only utils
(`pb_3.5r`, `mb_-1px`, `py_5r`) went missing and 3 React-19 snapshots
failed with shrunken dims (e.g. 352x47 → 37) on an otherwise
zero-delta tree. Reverting to kernel-inline variant styles restored
all 22 snapshots byte-identical. Full probe log:
`.agents/missions/quarantine-landing/features-Tabs.md` (SURPRISE 1–3,
RESOLUTION).

## Probe evidence (30+ probes, all under 5-wide concurrent load)

1. **Collection law (7 sync probes):** inline JSX literals + top-level
   consts spread by identifier ARE harvested; function calls are NOT.
   B1 primitive-component literal ok; B2 custom-target literal MISSED;
   const-spread-onto-custom ok (closureChrome precedent); nested
   `_hover` ok.
2. **Untraced target (3 probes):** `Tabs.Panel` const-spreads AND
   direct literals vanished while `Tab`/`List` const-spreads
   collected — `panelLook` (`py_5r`) missing even after the const
   redesign. Crew kept 3 look-agnostic panel spacing props in the
   kernel over this.
3. **Flip-flop (12+ probes):** triple-identical syncs per tree state,
   but `pb_3.5r` in/out and `pb_2r` out/in ACROSS tree states with no
   source change on the crew's side. Only kernel-inline-on-primitive
   ever held green across states.
4. **Daemon vs file:** CT reads daemon-CSS-at-run-time; file CSS
   churned with sibling tree-state (15+ probes; daemon at one point
   served V-complete/H-pb-missing). Prediction run on the reverted
   tree: 10/10 green — code correct, reds were timing dice.

## Contamination caveat (captain, 2026-09-26)

Every probe ran with five crews rewriting the tree nonstop, and the
collector regenerates from the WHOLE tree — so cross-state flip-flop
with "no change on my side" is EXPECTED, not proof of collector
unreliability. The daemon-timing split further confounds file-vs-test
comparisons. Nothing here is proven; (2) the Panel-shaped gap is the
most suspicious thread because it reproduced within single states.

## What closes this

A quiet-tree experiment crew (ZERO sibling writers for the whole
run): for each shape — inline-on-primitive, inline-on-custom,
const-spread-on-custom, function-returned — assert collect / no-collect
deterministically across repeated syncs, and daemon-vs-file agreement.
If a shape fails deterministically quiet, file the collector bug with
the repro; if everything holds quiet, close as load artifact and note
the daemon-timing trap for future campaigns.

## Why it matters if real

HQ's no-V2 contract pushes visual presets toward Book recipes over
kernel props (the Tabs `variant` strip was the first attempt). If
recipe-shaped styles genuinely don't collect outside the kernel, that
direction is blocked until the collector story is fixed — and the
Tabs `variant` retention (accepted deviation, reversible) becomes
permanent instead.
