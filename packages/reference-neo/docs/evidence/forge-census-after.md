# Forge Slice 5 — Book census after (§14 host surface)

Date: 2026-09-19. Tree: HEAD `1895dce72` (Slice 1 fixup) plus uncommitted
Slice-5 (§14) work; the shared tree also carries in-flight Slice-4
harvest code, which this census proves warning-neutral (zero added rows).

Method (mission Part III/C1): `pnpm --dir packages/reference-lib sync`,
counted by code with `rg -c "ATM-W-"` on the Slice-0 printer lines
(`[neo] sync warning ATM-W-*: …`, stderr). Before ran on the prebuilt
`darwin-x64` binding (Slices 0–3, 7 min before the S1 fixup); after ran
on a fresh `ensure-native` rebuild with Slice 5. The after set is a
strict subset of the before set, so the S1 fixup is warning-neutral on
lib: brace-carrying values stay silent under both spellings.

## Counts by code

| Code | Before | After | Delta |
|---|---|---|---|
| `ATM-W-UNFOLDABLE-SPREAD` | 74 | 74 | 0 |
| `ATM-W-UNKNOWN-TOKEN-PATH` | 31 | 31 | 0 |
| `ATM-W-UNKNOWN-COLOR` | 30 | 30 | 0 (triaged, Slice-1 defect) |
| `ATM-W-DYNAMIC-MEMBER` | 13 | 13 | 0 |
| `ATM-W-DYNAMIC-IDENTIFIER` | 7 | 5 | −2 (§14 owned) |
| `ATM-W-DYNAMIC-TEMPLATE` | 2 | 2 | 0 |
| `ATM-W-DYNAMIC-EXPRESSION` | 2 | 0 | −2 (§14 owned) |
| `ATM-W-NON-OBJECT-JSX-STYLE` | 1 | 1 | 0 |
| Total | 160 | 156 | −4 |

Before: 160. After: **156**. Added rows: **zero**.

## The four removed rows (all §14-owned)

Set-diff of the two warning sets (located lines) removes exactly:

- `ReferenceLibrary.tsx:167` `gap` (DYNAMIC-EXPRESSION) — host `ToastHost`
  declares `gap?: number` in its own `ToastHostProps` (`ToastSystem.tsx:846`).
- `ReferenceLibrary.tsx:168` `offset` (DYNAMIC-EXPRESSION) — host `ToastHost`
  declares `offset?: ToastOffset` (`ToastSystem.tsx:847`).
- `Tooltip.tsx:414` `offset` (DYNAMIC-IDENTIFIER) — host `Overlay.Content`
  declares `offset?: number` via `OverlayContentGeometry` (`Overlay/types.ts:78`).
- `Overlay.book.tsx:1432` `offset` (DYNAMIC-IDENTIFIER) — same owner.

This is the map's S4-1 note realized: the §14 owned-props drop of
`gap`/`offset`. Member tags match by the concatenated host name
(`Overlay.Content` → `OverlayContent`), mirroring `allows_jsx_tag`.

## Zero mission-gap rows

After log contains none of: `rgba(`/`translateX` token paths,
`TOKEN-CATEGORY-MISMATCH` (retired, zero hits), `UNKNOWN-PROPERTY`
(`css`/`style` bags), `focusRing`, radii-longhand stories, `sm`/`lg`
radii stories. The 31 token paths are exactly the mission's named
missing set (`ui.button.mutedBackground` ×18, `design.positive.text`
×5, `ui.status.error.text` ×3, `ui.status.error.border` ×2,
`ui.panel.background` ×2, `design.bg.muted` ×1). The 74 spreads and
remaining 21 dynamics are byte-identical to before.

## Why 156, not the mission's 131

131 is 213−82 from the mission text. The tree reconciles exactly:

- −1: the "StyleTrace failed to read `react.d.mts`" row cannot fire:
  `hosts::resolve` uses the engine surface (reads no files) and Slice 3
  gave styletrace the Skip ladder policy. Zero trace diagnostics in both
  censuses. The mission row is retired, not missing.
- −4: §14-owned `gap`/`offset` sites go silent (above; S4-1 anticipated).
  The mission noise table predates §14 and still lists `offset` as noise.
- +30: `ATM-W-UNKNOWN-COLOR` "`transparent !important`", all from
  `disclosureChrome.ts` (`borderBottomColor: 'transparent !important'`
  ×3 sites ×10 trigger spreads). `transparent` IS CSS; the Slice-1
  §11 true-warning fires because const-object lowering
  (`extract/expressions/object/entries.rs` `push_entry_leaves`) pushes
  recorded leaves verbatim without `split_important_flag`, so resolve
  classifies the unsplit string. Slice-1 defect, triaged S3-14-style
  for a fixup commit; out of the Slice-5 lane (not touched here).

131 − 1 − 4 + 30 = 156. Every remaining line is honest except the 30
triaged color lies, which need the one-line important-strip fixup.

## Slice-5 implementation (this lane)

- styletrace: `StyleSurface.owned_props` (host → own declared prop
  names) plus `with_owned_props` seed builder; `TraceOutcome.owned_props`;
  analyzer threads `Option<owned>` (traced-ness unchanged — all 29 prior
  styletrace cargo tests green, B8 zero-drift); parser records owned from
  each host's props annotation; resolver gains surface-pruned
  `collect_declared_prop_names` (`StyleProps`/`PrimitiveProps` references
  contribute nothing, so `color` keeps extracting while colliding `size`
  shadows). Unannotated hosts own nothing (fail closed).
- atomic: `ResolvedHosts.owned_props`; `ExtractContext.host_owns(tag, name)`
  (exact then dot-stripped, mirroring `allows_jsx_tag`);
  `is_style_attr_name` host-aware with the owned short-circuit BEFORE
  macro/style-prop checks, plus the same gate on every direct
  `is_known_style_prop` JSX path and the missing-graph check. Spread bags
  stay host-blind per §12 (deliberate scope cut, mission-prescribed).
- Stations: `ATM-SITE-85` (traced Button owns `size`/`variant`: no
  `size:sm` want, no diagnostics from shadowing; `Div size="2r"` folds
  to `width`/`height`; inherited `color` extracts; the one diagnostic is
  Button's own honest rest-spread) and `styletrace/src/tests/owned_props.rs`
  (3 tests: declaration-minus-surface, unannotated fail-closed, seed union).

## Gates observed

- cargo: styletrace 32/32, atomic 323/323 (includes sibling harvest tests).
- vitest: SITE-85 green; styletrace 28/28, canon 15/15; atomic suite has
  30 reds, all sibling-cone harvest-golden churn (additions-only diffs:
  harvested atoms + `ATM-I-HARVEST-SINK` infos; zero removal lines
  sampled across the full failure set — Slice 5 only removes, and only
  the 4 owned sites above).
- `pnpm agentrs q` on the 20 Slice-5 files: 0 violations, 18 warnings,
  all pre-existing complexity in untouched functions.
- Goldens: single-station bootstrap for SITE-85 only
  (`UPDATE_GOLDENS=1 -t ATM-SITE-85`); no sweeps; goldens verified by
  content (3 classes, no `sm` leak, 1 located spread diagnostic).

## Fixup: S5-2 important-strip (2026-09-19, parent commits)

Fix: `atomic/src/extract/expressions/object/entries.rs`
`push_entry_leaves` now splits string leaves through
`literal::split_important_flag` (new `split_entry_leaf` helper, mirroring
`walk/branch.rs push_folded_want` and `fold/call_lower.rs push_call_leaf`):
the stripped value mints with `important=true` and the authored plan
carries `ctx.important || is_imp`. Unit pin in the same file:
`const_leaf_important_suffix_mints_flagged_and_silent` (base +
`_hover` const leaves mint stripped + flagged, zero non-info
diagnostics, sheet keeps both `!important` declarations). Verified red
pre-fix (`transparent !important` unsplit), green post-fix.

Method: same as above (`pnpm --dir packages/reference-lib sync`,
`rg -c "ATM-W-"` on stderr), pre-fix capture on the existing native
binary (hash-fresh for the pre-fix tree, 156 reproduced exactly) and
post-fix on a fresh `ensure-native` rebuild after the fix.

Counts by code, post-fix: UNFOLDABLE-SPREAD 74, UNKNOWN-TOKEN-PATH 31,
DYNAMIC-MEMBER 13, DYNAMIC-IDENTIFIER 5, DYNAMIC-TEMPLATE 2,
NON-OBJECT-JSX-STYLE 1, UNKNOWN-COLOR **0**, DYNAMIC-EXPRESSION 0.
Total: **126**. Set-diff of pre/post warning sets: zero new rows, one
removed unique line (×30):
`[neo] sync warning ATM-W-UNKNOWN-COLOR: \`transparent !important\` is
neither a color token nor a CSS color`. 131−1−4 = 126 holds (S5-3).

Factorization (settles the map's 3×10-vs-15 question): the 30
UNKNOWN-COLOR lines are resolve-phase and carry **no location**
(`warn_unknown_color` emits file-less diagnostics), so the 10 lowering
spreads are identified by elimination, all firsthand: (a) the 3
`...disclosureTrigger` alias spreads refuse as located
UNFOLDABLE-SPREAD (`Showcase.book.tsx:373/385/393`), contributing zero;
(b) `Accordion.story.tsx` (5 spreads), `Accordion.book.tsx` (5),
`Collapsible.book.tsx` (3), `Collapsible.story.tsx` (2) hold zero
located rows of any code; (c) post-fix `jsx-elements.json` (configured
∪ traced) contains `CollapsibleTrigger` but no `AccordionTrigger`, so
the 5 `<Accordion.Trigger {...dividerTrigger}>` spreads drop silently
at `allows_jsx_tag` while the 10 `<Collapsible.Trigger>` spreads lower
(5 + 3 + 2 = 10); (d) the sheet holds exactly 3 deduped
`border-bottom-color: transparent !important` rules. 30 = 3
(`disclosureChrome.ts:51/55/59`) × 10. The silent 5 are the
Accordion.story non-host spreads; sibling `0px !important` leaves stay
silent throughout (non-color prop). Harvest is excluded as a source:
`classify_harvest_value` rejects the suffixed string, same as resolve.

Sheet evidence (`important=true`): the 3 color rules persist with
identical declarations while their stems rename from flag-in-value
(`…:bd-b-c_transparent_\!important`) to flag-form
(`…:bd-b-c_transparent\!`), matching inline-literal important atoms;
same for the 3 width rules (`bd-b-w_0px\!`). Both bundles agree
(`styled/styles.css:3091-3096`, `react/styles.css`, 3 + 3 rules each);
runtime map keys ride the `…_transparent!` stems.

Gates: atomic cargo 328/328 (327 + new pin), atomic vitest 271/271
(224 station cases), `pnpm agentrs q` on the touched file clean (0
violations, 0 warnings; 365-line soft cap held). Goldens: zero repins
(zero station inputs carry important-suffixed const leaves — all four
`!important` station inputs are inline literals), zero
`UPDATE_GOLDENS` runs.
