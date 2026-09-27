# defaultValue removal — DateField (controlled-only crew)

HQ stance: `docs/MISSIONS/API-STANCE.md` — no defaultValue catalog-wide;
value + onChange required, breaking NOW, in-repo migration in same change.
Branch: `reference-system` (stay; never switch; never commit).

## Checkpoint plan

1. [x] Recon: DateField.tsx uncontrolled branch, all in-repo consumers,
       docs/tests mentions, NumberField/Calendar/Slider precedent.
2. [ ] DateField.tsx: delete `defaultValue`, `internalValue`, `isControlled`;
       `value` + `onChange` required with `[reference-ui]` throws.
3. [ ] Migrate Icon.book.tsx Overview (only uncontrolled consumer).
4. [ ] Scrub docs (SPEC gap, DECISIONS non-decisions, DateField.md onChange);
       add required-throw unit tests (DF-FMT-06 style).
5. [ ] `pnpm agentct DateField` unit+e2e green; snapshots unmodified.
6. [ ] ux-designer review (nested; self-review by method if pool-full).
7. [ ] Report.

## Recon findings (checkpoint 1)

- Uncontrolled surface in `DateField.tsx`: prop `defaultValue?` (L12),
  destructure `defaultValue = null` (L415), `isControlled` fork +
  `internalValue` useState (L437-439), `!isControlled` branches in
  `handleDateSelect` (L478) + `handleInputChange` (L490), optional
  `onChange?.` calls.
- Consumers: every `<DateField` in stories/books/Showcase/Field/tests is
  already value+onChange+locale controlled — EXCEPT
  `Icon.book.tsx:207` (`<DateField defaultValue="2026-09-05">`, no locale:
  latent crash — compound path throws on missing locale today).
- Leave alone: `Icon.book.tsx:217` Combobox defaultValue (Combobox crew);
  `DateField.md:260` `"defaultValue"` in DateFieldManagedProp = inner
  input-slot strip list (still correct: inner input stays controlled,
  explicit defaultValue must keep being stripped — tsx L241 kept).
- Precedent: NumberField/Calendar/Slider all have `value` required but
  `onChange?` OPTIONAL. Task + HQ stance ("value + onChange required
  everywhere", "no silent-frozen controlled") explicitly require onChange
  here → onChange required + throwing. Throw style follows this file's
  existing `[reference-ui] DateField requires an explicit …` + `== null`
  (value uses `=== undefined` since null is the legal empty value).
- Docs already describe controlled-only as the design (DateField.md
  L356, L372-373); SPEC L91 gap + DECISIONS L45-50 non-decisions go stale
  and get updated, not deleted (history annotated SUPERSEDED).
- No defaultValue/uncontrolled mentions in DateField.test.tsx or e2e spec.

## Progress

- Checkpoint 1 done (recon).
- Checkpoint 2 done: DateField.tsx — `defaultValue` prop + destructure
  deleted; `value`/`onChange` required; `isControlled`/`internalValue`
  deleted; value/onChange throws added; `onChange?.` → `onChange`.
- Checkpoint 3 done: Icon.book.tsx Overview → useState-controlled +
  locale (only uncontrolled consumer in repo).
- Checkpoint 4 done: DateField.md (onChange required x2, Defaults),
  SPEC.md gap closed, DECISIONS.md non-decisions SUPERSEDED,
  DateField.test.tsx DF-CTL-01/02 added.
- Checkpoint 5 done: `pnpm agentct DateField` — unit 30/30 green;
  e2e 20/22 then 2/2 on re-run (transient daemon module-fetch flake,
  zero assertion failures) → 22/22. Snapshots unmodified, git-clean.
- Checkpoint 6 done: nested ux-designer accepted but timed out at 5min
  (cancelled) → SELF-REVIEW by the method (flagged): LOOK pass
  (zero render-code touched, 8/8 snapshots pixel-identical green,
  baselines resting/picker-open eyeballed sane); FEEL approve
  (uncontrolled removal is the briefed HQ break; all stories already
  controlled so runtime behavior identical; missing value/onChange now
  fail-closed with explicit throws); A11Y no findings (no ARIA/focus/
  keyboard code touched; DF-CAL-01/03 green).
