# defaultValue → controlled-only: Accordion

Crew log. HQ stance: value + onChange, required, no uncontrolled branch.
Branch: reference-system (never switch, never commit).

## Checkpoint plan

- [x] CP0: scope grep (Accordion consumers) + read Accordion.tsx
- [x] CP1: read rest of Accordion.test.tsx (500→end) + e2e spec + Showcase cell + Collapsible consumers
- [x] CP2: edit Accordion.tsx (delete defaultValue, internalValue, isControlled fork, defaultValue validation; value+onChange required)
- [x] CP3: migrate consumers (book 2×, story Multiple/KeyDisabled/KeyCancel/DynamicOrder, Showcase cell, unit tests incl. new AC-DOM-09)
- [x] CP4: scrub docs (Accordion.md, TESTS.md AC-DOM-07/09 + AC-MULTI-07 + freeze defaults, SPEC amendment + 42/42, DECISIONS landed/non-decisions/walkthrough)
- [ ] CP3: migrate consumers (book 2×, story Multiple/KeyDisabled/KeyCancel/DynamicOrder, Showcase cell, unit tests)
- [ ] CP4: scrub docs (Accordion.md, SPEC/FEATURES/DECISIONS/TESTS/PATCHES mentions)
- [ ] CP5: `pnpm agentct Accordion` green (unit + e2e); typecheck via verify if needed
- [ ] CP6: UX review (nested designer or self-review + flag)
- [ ] CP7: report

Progress per step below.

## CP0 — scope (done)

`Accordion` consumer files (files_with_matches over `packages/reference-lib/src`):

- Accordion dir: Accordion.tsx, story, book, test, e2e, docs — in scope.
- `Showcase.book.tsx:411` — `defaultValue="item-1"` → MIGRATE (useState; Showcase e2e clicks Item 2 and expects content visible, so must stay interactive).
- `Collapsible.story.tsx` AccordionNest — already `value`+`onChange` controlled → no change.
- `Collapsible.test.tsx` CO-NEST-02 — already controlled → no change.
- `index.ts` re-export — check whether it re-exports prop types only (no change expected).
- Precedent check: NumberField `value` required / `onChange?` optional; Calendar same (CA-STATE-10 explicitly covers omitted onChange). Parent directive explicitly orders onChange REQUIRED here, so both required — deviation from precedent noted.

## INCIDENT 21:27 UTC bulk clobber + redo (done)

At ~21:27:25 UTC all six Accordion-dir files I had edited (tsx/story/test/book/md/TESTS) were bulk-restored to HEAD (identical mtimes), wiping CP2+CP3+partial CP4. Showcase.book.tsx (my lines), SPEC.md, DECISIONS.md, and this log survived. Cause unknown — shared tree with active sibling crews (Combobox/Tabs/DateField/Tree/Slider/Overlay all editing); no Accordion features crew active (their log: no code changed). Re-applied every edit from scratch and verified on disk with grep: `defaultValue` in Accordion src = only the DOM-Omit line; `uncontrolled` = only the controlled-only comment + AC-DOM-09 title. All 9 files show expected diffs.
