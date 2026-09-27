# Tabs recipe styles uncollected under concurrent churn — real bug or load artifact?

**Severity:** Unknown (no breakage at HEAD; investigation record)
**Area:** Lib style collector + CT daemon CSS (`styles.css` generation)
**Status:** CLOSED 2026-09-27. Root-caused, fixed, field-proven
(stations + end-to-end probe on production `Tabs.tsx`); the strip
re-attempt is off — HQ retired the headless direction and `variant`
stays in the kernel by design.
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

## Resolution (2026-09-26)

A second agent root-caused it to styletrace: member-form compound
styles via alias hosts were not collected — exactly the recipe shape
the Tabs crew was emitting. Fixed in `a5e86f4e9` ("styletrace+atomic:
collect member-form compound styles via alias hosts") with `94bd4b6f3`
(atomic extract split) on top, both on this branch. The captain's
contamination caveat is PARTIALLY WITHDRAWN: concurrent load explains
the timing variance and flip-flop, but NOT the missing classes — HQ's
instinct was right, something was truly hiding there.

## What closed this

Field proof landed without the strip: `ATM-SITE-87` plus the
styletrace `member_alias` fixtures pin member-form collection, and a
post-fix probe compiled production `Tabs.tsx` with a Book-shaped
`<Tabs.Panel {...panelLook}>` consumer — the spread collects
(`tracedJsxHosts` carries `Tabs.Panel`, `Tabs.Tab`, …; kept at
`/tmp/tabs-probe/`). The strip re-attempt stays cancelled per HQ
(variants philosophy in `API-STANCE.md`). If recipe classes go
missing again, append the exact missing utilities + the recipe shape
and reopen against styletrace.

## Why it mattered (framing retired)

HQ's no-V2 contract once pushed visual presets toward Book recipes
over kernel props (the Tabs `variant` strip was the first attempt).
That direction is closed: `variant` retention is permanent kernel
design, not a fallback. The fix stays load-bearing regardless —
userland variant overrides ride the same member-form collection.
