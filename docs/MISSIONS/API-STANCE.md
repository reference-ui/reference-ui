# API stance (HQ)

Recorded 2026-09-26. Governs the FEATURES campaign and everything after.

HQ: "There is no V2 here. These components need to be pretty much
shippable and stable from the get go. We can't afford to change the
API contract at all. There are no consumers of this library right
now, but once we release there will be."

## The rule

- Post-release the API contract is frozen. No V2 escape hatch.
- So ALL breaking API decisions happen NOW, pre-release, while there
  are no external consumers. In-repo consumers migrate in the same
  change. No deprecation shims for never-released API.
- Simplest contract that can hold forever wins (e.g. Splitter:
  required controlled value).
- Phase distinction: landing FROZE APIs (port stability/test wins
  only — the Accordion lesson); the features campaign FINALIZES them.

## Agreed (HQ review — approved in principle for implementation)

- Splitter FEATURES.md — "I fully agree with this" (2026-09-26).
  NOTE: the doc's "v2 major" maintainer-take framing is VOID under
  this stance — the breaking items ship as v1 or not at all.
- Slot reactive API — clean breaking redesign approved (2026-09-26);
  `scan` vocabulary leaves the consumer surface, in-repo consumers
  migrate in the same change.
- Switch `onChange` event access — approved, widened
  `onChange(checked, event)` (2026-09-26). Switch thumb-ref —
  HELD, weird-use-case smell.
- Tabs `keepMounted` — approved OPT-IN ONLY, never default
  (2026-09-26).

## Campaign directive 2026-09-26 (HQ out for the day)

- Land PATCHES + obvious FEATURES across all components today.
  Crews roll all day; tree stays green, 1 commit per component unit.
- Themes: controllability + customization.
- Controlled-only RULE (HQ confirmed EOD 2026-09-26: "no
  defaultValue across them... old school stuff"): value + onChange
  required everywhere; defaultValue deleted catalog-wide with
  in-repo migration (sweep crews 147-150: Tree/Accordion/Combobox/
  DateField; Tabs/Splitter/NumberField/Calendar already clean;
  Slider-F carries #1). Sibling uncontrolled props (defaultOpen,
  defaultChecked, defaultInputValue, defaultView, ...) AWAIT HQ
  call — reported, not started.
- EXCEPTION (HQ EOD 2026-09-26, refined): Accordion + Tabs are
  OPTIONAL-VALUE, not dual-mode. There are NO defaultValue props
  anywhere in the library — `value` is simply optional, and
  omitting it means self-managed from the component's natural zero
  state (minor difference, important: no seeding API, no default*
  vocabulary). Accordion purge cancelled + reverted, optional-value
  crew dispatched; Tabs defaultValue restoration SUPERSEDED by
  optional-value crew (value optional, onChange notification).
