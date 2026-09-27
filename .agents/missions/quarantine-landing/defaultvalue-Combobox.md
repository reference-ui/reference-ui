# defaultValue → controlled-only: Combobox crew log

Branch: `reference-system` (stay; never switch, never commit).

## Checkpoint plan
1. ✅ Inventory: root `defaultValue` sites (Combobox.tsx:117,941,958) + all consumers.
2. ⬜ Read story/test/book/e2e in full (incremental), noting which fixtures rely on uncontrolled commit state.
3. ⬜ Delete root `defaultValue` + `internalValue` + `isControlledValue` fork; `value` + `onChange` required (type + dev-throw, Accordion precedent). Keep `Combobox.Input` ban (lines ~154-182).
4. ⬜ Migrate in-dir consumers (story/book/test) to `useState`-controlled.
5. ⬜ Migrate out-of-dir consumers: `Icon.book.tsx:217` only (Field.* + Showcase already controlled).
6. ⬜ Scrub stale root-`defaultValue` docs (SPEC/Combobox.md/TESTS.md/DECISIONS.md as warranted; keep Input-ban mentions).
7. ⬜ `pnpm agentct Combobox` green (unit + e2e); snapshots unmodified.
8. ⬜ UX review (nested ux-designer; self-review fallback) + report.

## Contract (Accordion precedent, freshest sweep)
- `value: string | null` REQUIRED, `onChange: (v) => void` REQUIRED.
- Dev-gated throw when either is `undefined` (Accordion lines 204-218 shape; via existing `globalProcess` — no node types here).
- `handleSelect`: drop `setInternalValue` branch; `onChange(nextVal)` direct.
- `authored.ts` untouched (`rootHasOnChange` still meaningful at runtime).
- Sibling `defaultInputValue`/`defaultOpen` NOT touched (await HQ call).

## Consumer inventory
- OUT: `Field.story.tsx` (3 sites, already controlled ✔), `Showcase.book.tsx:476` (controlled ✔), `Icon.book.tsx:217` (`defaultValue="option-1"` → MIGRATE; adjacent DateField site is NOT mine).
- IN: `Combobox.book.tsx` (3 sites), `Combobox.story.tsx` (~25 sites), `Combobox.test.tsx` (~15 sites), e2e mounts stories (check for direct JSX).
- DOCS: SPEC.md:51, Combobox.md:129, TESTS.md:143, DECISIONS.md:90 (verify each).

## Files changed
- `packages/reference-lib/src/components/Combobox/Combobox.tsx` — root `defaultValue` deleted; `value`/`onChange` required (type + dev-throw, Accordion shape); `internalValue`/`isControlledValue` gone; `handleSelect` calls `onChange` directly. Input ban untouched.
- `Combobox.story.tsx` — 11 sites controlled (DisabledReadonly×3, FixedClosed static null/noop; Conflict/Multiple/NestedChange/TreePopup/TreeTrigger/Recover/InvalidFrame useState-wired; Empty/NoPopover static).
- `Combobox.test.tsx` — Harness/SelectHarness default `value=null`+noop; ~20 direct sites fixed; freeze-pin rewritten as controlled-value test.
- `Combobox.book.tsx` — no change needed (already controlled). E2E specs — no direct JSX (mount stories).
- `packages/reference-lib/src/components/Icon/Icon.book.tsx` — `defaultValue="option-1"` → `useState` controlled (ONLY out-of-dir edit; Field.* + Showcase already controlled).
- Docs: SPEC.md, Combobox.md, TESTS.md, DECISIONS.md scrubbed (Input-ban mentions kept).
- Snapshots: UNMODIFIED (verified via empty `git diff` on `__e2e__`).

## Evidence
- `tsc --noEmit`: zero errors in Combobox files + Icon.book.
- `pnpm agentct Combobox`: Unit 77 passed; E2E 65/65 react19, 0 failed. No `--update-snapshots`.
- UX (nested child 01a0df74): LOOK PASS (7 pinned PNGs intact); FEEL all 7 items approved; A11Y no findings. WebM unreadable here — ruled on PNGs+snapshots+diff.

## Flags
- Concurrent Tree-crew edits landed in MY story file mid-session (`Tree value/onChange` in TreePopupLog/TreeTriggerLog — visible in story diff, NOT mine). No clobber; gate green covers the combination.
- Observed (not mine): `Showcase.book.tsx:411` still passes `defaultValue` to Accordion — Accordion crew's migration.
- UX non-blocking note: missing-prop guard is dev-only (Accordion precedent); untyped prod consumers omitting props get `undefined` through comparisons instead of the guided error. Accepted per precedent.
- Videos: `.webm` unreadable via available tools; motion judged via PNGs + green snapshots.
