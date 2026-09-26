# features-NumberField — FEATURES crew log

Branch: reference-system (never switch; never commit).
Scope: NumberField FEATURES IMPLEMENT-NOW #1 (controlled-only + required locale),
#2 (redundant onChange suppression, decided any-no-change). Touch ONLY NumberField
dir + this log (+ in-repo consumer call sites for the #1 migration).
Proof: pnpm agentct NumberField (unit+e2e green). UX: nested ux-designer review.

## Timeline (append-only; one line per start/land/test)
- START log header written; reading contract docs.
- PLAN #1: type value+locale required, delete defaultValue; runtime throw on missing value/locale (DateField ==null precedent, this file's prefix); delete isControlled/internalValue + all branches.
- PLAN #2: suppress onChange when next===current in increment/decrement/handleInputChange/Home/End; keys keep preventDefault, emit nothing.
- PLAN proof: types.test freeze titles; NF-MATH-02 rewrite; NF-EDIT-13 controlled; new FEATURES-#2 unit trio; UncontrolledFixture->UnboundedFixture; delete uncontrolled CT; migrate Field.story x4 + Showcase.book x1 + book/story; SPEC.md status flip.
- BEFORE baseline run: pnpm agentct NumberField
- AFTER baseline: green — Unit 24 passed; E2E 17/17 react19.
- START #1 implementation in NumberField.tsx (types + engine).
- LAND #1 engine+types+migrations (all JSX sites carry locale; zero defaultValue/uncontrolled paths).
- LAND #2 suppression in increment/decrement/handleInputChange/Home/End + unit trio.
- FLAG (not mine): tsc TS2339 data-pressed x2 pre-existing (PATCHES §7 lines, zero overlap with my diff); DateField missing-locale in Field.story x2 + Showcase x1 belongs to DateField-F.
- BEFORE verification run: pnpm agentct NumberField
- AFTER verification: green — Unit 27 passed (24 + 3 new #2 trio); E2E 17/17 react19; all frozen snapshots pass unmodified.
- START nested ux-designer review of the delta.
- NOTE: CT video artifacts rotated away by concurrent Combobox-F agentct run; evidence = terminal 17/17 PASSED incl. snapshot titles (zero drift by construction: render output identical).
- UX VERDICT (nested child): look PASS (zero paint diff, snapshots byte-unmodified); feel APPROVE x2 (#1 one-authority/one-grammar + fail-loud migration; #2 coherent request semantic, keys stay handled); a11y: standing pre-existing spinbutton finding only (PATCHES §8, untouched). Caveat: no fresh CT video (artifacts rotated by parallel run); Tabs/Combobox/Splitter hunks out of scope.
- DONE: #1 + #2 landed; unit 27 + e2e 17/17 green; branch reference-system; no commits. Files: NumberField.tsx/story/book/test/types/ct.spec/SPEC.md + Field.story.tsx (4 locales) + Showcase.book.tsx (1 locale) + this log.
