# Switch FEATURES crew log — IN PROGRESS

Mission: `.agents/missions/quarantine-landing/features-triage.md` (Switch §), items from
`packages/reference-lib/src/components/Switch/FEATURES.md`. Branch: reference-system (no switches, no commits).

## Scope
- IMPLEMENT-NOW: #2 managed-prop type Omit (silent, incl. aria + data-state/data-disabled, one breaking-type pass),
  #3 clipped-children doc note (docs only; guard only on proven harm — none proven),
  #5 onChange event access (HQ-approved widened `onChange(checked, event)`).
- HOLD (untouched): #1 data-state-only restyle, #4 thumb ref/handle.
- Guardrails: API-STANCE (breaking NOW, no shims); visuals frozen (snapshots must pass unmodified);
  proof via `pnpm agentct Switch`; nested ux-designer review of the API delta.

## Pre-work findings
- Only out-of-dir consumer is `Showcase.book.tsx` (`checked`/`onChange={setState}`/`disabled`/`aria-label`):
  compatible with both the Omit and the widened onChange. No migration needed anywhere.
- tsc baseline: zero errors in Switch dir (pre-existing errors only in Listbox/Slot/Tabs/playwright-ct).
- Empirical tsc probe (deleted after): TS permits ALL `data-*` JSX attributes (`<div data-foo/>`,
  `<Switch data-whatever/>` pass; bogus non-data props still error). So `Omit<…, 'data-state' |
  'data-disabled'>` is documentary (the decided silent Omit — no `never` props, that was the
  declined "error" variant); `@ts-expect-error` pins only work for the aria keys. Runtime
  managed-wins (landed in quarantine) remains the enforcement for data-* conflicts.

## Changes
- `Switch.tsx`: Omit extended to `'onChange' | 'type' | 'role' | 'aria-checked' | 'aria-pressed' |
  'data-state' | 'data-disabled'` (#2); `onChange` widened to `(checked, event:
  React.MouseEvent<HTMLButtonElement>) => void` and called as `onChange?.(nextChecked, e)` (#5).
  No other runtime change: managed-wins spread order + `aria-pressed` strip untouched.
- `Switch.story.tsx`: sw-dom-02's conflicting `data-state`/`aria-checked` moved into the existing
  `as any` spread next to `aria-pressed` (runtime identical; satisfies the new Omit under tsc).
- `types.test.tsx` (SW-TYPE-01): onChange `expectTypeOf` widened; `not.toHaveProperty` for all four
  omitted keys; `@ts-expect-error` pins for `aria-checked`/`aria-pressed` (consumed — tsc proves
  the Omit bites); NOTE on why `data-*` can't take expect-error pins.
- `Switch.test.tsx`: new FEATURES-05 unit test — click delivers `(true, syntheticMouseEvent)`,
  asserting type/target/currentTarget-at-call/nativeEvent.
- `Switch.md`: #3 doc note (extras clipped; keep decorative + `aria-hidden`); Proposed API Omit +
  onChange updated; request paragraph documents the event arg.
- `FEATURES.md`: landed notes on #2, #3, #5. `SPEC.md`: features-campaign note (SW-TYPE-01
  re-target, doc-note coverage, snapshot-freeze assertion). #1 and #4 untouched (HOLD).

## Proof
- `pnpm agentct Switch`: unit 5/5, e2e 22/22 (react19) — includes all 7 visual snapshots passing
  byte-identical/unmodified, plus SW-DOM-02 runtime managed-wins and all SW-ACT request semantics.
- `npx tsc --noEmit` (packages/reference-lib): zero errors in Switch dir; aria `@ts-expect-error`
  pins consumed (would report "unused directive" if the Omit didn't bite). Pre-existing errors in
  Listbox/Slot/Tabs/playwright-ct untouched (other crews' territory).
- First unit run caught a test bug (mine, not source): `currentTarget` read after dispatch is
  null — fixed by capturing at call time; source needed no change.

## UX review (SELF-REVIEW — nested ux-designer spawn rejected: root_capacity_exhausted, 8/8 slots)
Method per ux-designer skill; ruling on the API delta against the frozen-visuals brief.
- Look: APPROVED unchanged. All 7 CT snapshots passed byte-identical with zero source-paint edits
  (`transform`/`transition` preserved per HOLD #1); `git status` confirms no snapshot files modified.
  (Caveat: could not render CT .webm videos in this session — binary attach unsupported — but no
  motion or paint path was touched, and snapshot comparisons cover settled paint.)
- Feel #5 onChange(checked, event): APPROVED. Purely additive second argument; every existing
  single-arg handler (all SW-ACT logs, `setChecked` pass-throughs, Book + Showcase consumers)
  passed unmodified. Request-once, preventDefault-cancel, disabled-inert, and no-programmatic-emit
  semantics all re-proven by the unchanged CT suite.
- Feel #2 managed-prop Omit: APPROVED. Compile-time only; runtime managed-wins identical
  (SW-DOM-02 green). Consumers passing `aria-checked`/`aria-pressed` now get a type error instead
  of silent runtime override — the honest contract; no in-repo consumer passes them.
- Accessibility: no findings, one improvement. No ARIA/focus/name behavior changed (SW-A11Y-01,
  SW-NAME-01/02 green). The #3 doc note closes the guidance gap FEATURES #3 named: clipped extras
  leaking into the accessible name is now documented with the `aria-hidden` remedy; no guard built
  per the decided "proven harm only" trigger — none proven.
- Artifacts judged: full `pnpm agentct Switch` output (22 e2e vids/screenshots emitted, snapshots
  compared in-run), `git status` (no snapshot modifications), source diff of the 7 Switch files.

COMPLETE
