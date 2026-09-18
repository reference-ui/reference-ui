# StyleTrace Slice #1 — Traced-vs-53 Evidence

Date: 2026-09-18. Slice: Neo decl-root resolution (survey gap #0 + #5).
Method: rebuilt NAPI engine (`pnpm agentrs b`), then the survey §3 probe
strategy — `trace(<lib>/src, <lib>)` via `dist/styletrace.mjs` — diffed
per-name against the 53 hand-listed `jsxElements` in
`packages/reference-lib/ui.config.ts`. Probe scripts (re-runnable, /tmp-only):
`/tmp/styletrace-survey-probe.mjs`, `/tmp/st-slice1-diff.mjs`.

## Probe result

- `control:fixture-src: OK count=2` (core-shaped fixture unchanged)
- `experiment:lib-src: OK count=53` (was `ERROR missing StyleProps declaration entrypoint`)
- `experiment:lib-bindings: OK count=113` (module-qualified bindings, incl. barrel re-exports)

## Per-name diff: traced == hand-listed, exactly

traced=53, handListed=53, tracedIn53=53. Missing: 0. Extra: 0.

| # | Name | Traced |
| --- | --- | --- |
| 1 | Accordion | yes |
| 2 | Calendar | yes |
| 3 | CalendarGrid | yes |
| 4 | CalendarHeader | yes |
| 5 | CalendarHeading | yes |
| 6 | CalendarNextButton | yes |
| 7 | CalendarPrevButton | yes |
| 8 | CollapsibleContent | yes |
| 9 | CollapsibleTrigger | yes |
| 10 | ComboboxInput | yes |
| 11 | ComboboxOption | yes |
| 12 | ComboboxTrigger | yes |
| 13 | DateField | yes |
| 14 | DateFieldInput | yes |
| 15 | Field | yes |
| 16 | ListboxEmpty | yes |
| 17 | ListboxHeader | yes |
| 18 | ListboxOption | yes |
| 19 | ListboxSection | yes |
| 20 | MenuItem | yes |
| 21 | MenuSeparator | yes |
| 22 | MonoText | yes |
| 23 | NumberField | yes |
| 24 | NumberFieldDecrement | yes |
| 25 | NumberFieldIncrement | yes |
| 26 | NumberFieldInput | yes |
| 27 | OverlayArrow | yes |
| 28 | OverlayBackdrop | yes |
| 29 | OverlayContent | yes |
| 30 | OverlayHandle | yes |
| 31 | OverlayTrigger | yes |
| 32 | PopoverClose | yes |
| 33 | Slider | yes |
| 34 | SliderRange | yes |
| 35 | SliderThumb | yes |
| 36 | SliderTrack | yes |
| 37 | Splitter | yes |
| 38 | SplitterHandle | yes |
| 39 | SplitterPanel | yes |
| 40 | SplitterThumb | yes |
| 41 | Switch | yes |
| 42 | SwitchThumb | yes |
| 43 | Tab | yes |
| 44 | TabPanel | yes |
| 45 | TabsList | yes |
| 46 | ToastDescription | yes |
| 47 | ToastHost | yes |
| 48 | ToastRoot | yes |
| 49 | ToastTitle | yes |
| 50 | Tree | yes |
| 51 | TreeExpander | yes |
| 52 | TreeGroup | yes |
| 53 | TreeItem | yes |

## Notes for slice #2 / #3

- Zero residue on lib src: gaps #2–#4 have no outstanding lib names. The
  exact match is expected, not luck — the 53 were carried verbatim from
  core's traced `local` array, and the engine now reproduces core's
  discovery on the Neo tree.
- `ToastHost` (gap #2 suspect) traces by the name-matched forwarding rule:
  it destructures `gap`/`offset` (`ToastSystem.tsx:873-874`) and passes
  `gap={gap}` into a `<Div>` (`:974,:994`); `gap` is in the Neo
  style-prop set, so the boundary counts as style-bearing — same as core.
  Slice #2 can classify it traced-by-design rather than vestigial.
- Gaps #3 (primitive aliases) and #4 (member spellings) concern
  matrix/namespace shapes outside lib src; unaffected by this slice.
- Incidental engine hardening (required for a non-empty lib trace): the
  type tracer now treats unresolvable module specifiers as contributing
  no names instead of failing the whole trace, matching the analysis
  layer's long-standing `Ok(None)` behavior. Trigger was the phantom
  `@reference-ui/types` import in `Reference/*.tsx` (no such package in
  the workspace). Entrypoint-level errors (missing decl root) still fail
  explicitly.
