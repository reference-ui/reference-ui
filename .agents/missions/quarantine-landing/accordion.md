COMPLETE — Accordion REWORK crew (quarantine-landing; rework landed, see Rework section)
Branch: reference-system (never switch; quarantine inspected via git show/diff only at 89850d1c8)
Dir confirmed: packages/reference-lib/src/components/Accordion/

## Plan
1. Baseline pnpm agentct Accordion before changes.
2. Diff quarantine Accordion commit 569d00567 (source vs matrix unit/e2e + fixtures).
3. Port ONLY stability + test-case wins; visuals frozen (SUSPECT per recon).
4. Prove after; view-story visual check + ux-designer review.

## Progress
- 2026-09-25: crew started. Dir confirmed, mission docs read (LANDING + QUARANTINE_RECON).
- Baseline `pnpm agentct Accordion` BEFORE changes: Unit 0 tests (none colocated), E2E 2/2 pass (react19), snapshots green.
- Triage done: Q commit 569d00567 (Accordion.tsx 303/47, book 122, SPEC 34; matrix unit 1031/23its, e2e 518/18tests, fixture 627) read in full. Current Accordion.tsx is the pre-freeze prototype (defaultValue + internal store + keyboard 'arrows'); Q source adds zero styles/chrome/motion (root still bare Div).

## Triage (salvage vs suspect)
SALVAGE (source, zero visual change):
1. Controlled-only + discriminated single/multiple types (SPEC freeze; Accordion.md Proposed API matches Q exactly). Removes defaultValue/internal store/keyboard 'arrows'. NOTE vs recon exhibit 1: Accordion SPEC (pre-quarantine, on reference-system) explicitly freezes controlled-only ("No defaultValue", "Out of scope: Uncontrolled/default values") — this is the contract, not mangling. Only in-repo consumers are my own book/story (converted, Q book diff is behavior-only).
2. Dev diagnostics: AC-DOM-05 identity throws (missing/empty/duplicate id), AC-DOM-08 competing-authority console.error, AC-MULTI-06 mode/value shape throws.
3. AC-MULTI-04 canonicalization (known IDs in authored/render order, unknowns deduped to tail).
4. Keyboard hardening: rootRef scoping, nested-accordion filter via closest(), content-key ignore (AC-KEY-07), disabled-skip with wrap + enabled Home/End boundaries (AC-KEY-03/04), consumer cancellation preserved (AC-KEY-09).
5. Nesting isolation wrapChildren null-provider (AC-NEST-02).
6. composeRefs with React 19 cleanup semantics (AC-DOM-02/AC-ENV-02).
SALVAGE (tests, re-targeted into dir — matrix/lib layout absent on reference-system; Collapsible-crew precedent): colocated Accordion.test.tsx happy-dom (Q unit 23 verbatim, local imports); CT ports of Q e2e 18 (new stories, snapshot-free; existing 2 CT tests + 13 snapshots untouched as the frozen-visual proof).
SUSPECT (do not port): none visual in Q Accordion (verified: no style/chrome/motion delta). beforematch/hiddenUntilFound: Q has no Accordion-side impl (Collapsible-owned; Collapsible crew deferred as follow-up) — nothing to port.
SHAPE: keeping single-file port (~407 lines, Q-verbatim incl. Collapsible-precedent of no split); hoisting Q's oddly-indented isInsideContentOf to module scope (cosmetic, zero behavior change).

## Implementation (2026-09-25)
- [x] Accordion.tsx: Q port (controlled-only discriminated types, dev diagnostics, MULTI-04 canonicalization, keyboard hardening, nesting isolation, composeRefs). Single deviation: isInsideContentOf hoisted to module scope.
- [x] Book: Q-verbatim controlled conversion (identical initial values, zero visual delta).
- [x] Story: Multiple converted to controlled (same initial opens); 16 new stories (DomAnatomy, KeyTraversal, KeyBoundaries, KeyDisabled, KeyNoActivate, NativeKeys, ContentKeys, KeyboardNone, KeyCancel, DynamicOrder, TabSequence, Nested, PresenceStory, Faq, Settings, Scope). Single untouched.
- [x] Accordion.test.tsx: Q matrix unit 23/23 verbatim (local imports only).
- [x] CT spec: 2 legacy tests kept (retitled to drop stale AC-DOM-01/02 prefixes; assertions + snapshots untouched) + 18 re-targeted Q e2e (snapshot-free behavioral).
- [x] SPEC.md bookkeeping (41/41, landing note, handoff).
- [x] Proof: unit 23/23; e2e 20/20 react19 (13 legacy snapshots green, no drift); --react all 60/60; tsc: zero errors in Accordion dir.
- [x] Surprise: zero. Q-verbatim unit green first run (incl. shared-root throw cases); CT green first run (incl. KEY-04 retained-node dispatch, KEY-11 Tab walk, PRES-01 GSAP exit unmount).
- HANDOFF (collateral, other crew's file — NOT touched): Collapsible.story.tsx:328 AccordionNest `useState<string | string[] | null>` with expansion="single" now fails tsc under frozen discriminated types (TS2322, value must be string|null). One-line fix: narrow to useState<string | null>. Behavior-identical. Needs Collapsible crew (or captain) to apply; tree typecheck is red until then (plus unrelated in-progress errors in Listbox/Slot/Tabs crews' files).
- [x] view-story visual check: Playwright MCP down (broken pipe x2) → pnpm capture fallback. SingleExpansion resting (item-1 open, divider chrome + chevron) + clicked item-2 (clean swap); MultipleExpansion resting (A+B open) + clicked A closed (B stays). Chrome/typography/spacing identical to pre-change; no console errors from capture runs.
- [x] Nested ux-designer review (independent subagent, accepted — NOT pool-blocked): verdict APPROVED TO LAND. Look PASS (nothing moved; 8 captures vs 13 frozen baselines). Feel: all 10 behavior deltas approved (controlled-only, discriminated types + MULTI-06 validation, MULTI-04 canonicalization, disabled-skip + Home/End, content-key ignore, nested scoping + NEST-02 isolation, native Tab stops, keyboard=none + consumer-cancel precedence, dev-only diagnostics, 'arrows' alias removal). A11y: no findings. Caveat: CT videos rotated off disk by concurrent crews before review; motion evidence is resting captures + Presence-owned exits (Accordion owns no animation).
REJECTED — captain: (1) controlled-only rewrite removed base uncontrolled mode (defaultValue + internal useState); landing rules override the freeze-contract reading. (2) Discriminated types break committed tree: Collapsible.story.tsx:336 (AccordionNest) fails tsc. Prior crew's rework attempt lost its tools mid-session — verified NOTHING applied (working tree still controlled-only, no defaultValue in dir; session 01a0da70 tail is runtime noise, design recovered from its final message and re-verified).

## Rework (2026-09-25, new crew lead)
Design (hint re-derived and verified, 3 corrections):
- Flat base-compatible props; discriminated types DROPPED (verified incompatible: no sound discriminant accepts union value with expansion="single"; zero external importers of the 3 discriminant names in packages/ + matrix/).
- `keyboard: 'arrows'` restored as headers-alias (base behavior: everything except 'none' traverses). Strict API superset of base.
- Uncontrolled semantics base-faithful: isControlled = value !== undefined; useState(defaultValue ?? single?null:[]); onChange fires both modes; internal set only uncontrolled. defaultValue gets MULTI-06-style dev shape validation.
- Book + Multiple story revert to base `defaultValue` (byte-identical renders; legacy multi smoke becomes uncontrolled pin).
- Story wrappers: base-pattern `(val) => setValue(val as …)` everywhere narrow state meets flat onChange. CORRECTIONS vs hint: Nested outer/inner `set*Value(val)` and NativeKeys single `setSingleValue(val)` also need casts (hint missed them); tsc is the oracle.
- Tests: DOM-07/MULTI-07 reworked to uncontrolled semantics (rationale: omission ⇒ uncontrolled per restored API; assertions updated, titles updated, nothing deleted); +2 new uncontrolled defaultValue pins. CORRECTION vs hint: state-changing clicks wrapped in `await act` (IS_REACT_ACT_ENVIRONMENT; NEST-02 precedent) instead of bare .click() + DOM asserts.
- Second silent break found: Showcase.book.tsx:383 passes defaultValue="item-1" (committed, off-limits) — currently swallowed as unknown Div prop, all-closed; rework restores it with zero edits there.
Implementation (rework):
- [x] Accordion.tsx: flat base-compatible props (value/defaultValue/onChange over AccordionValue), `keyboard:'arrows'` restored, uncontrolled store + currentValue threading, defaultValue MULTI-06 dev validation. Hardening blocks untouched (diagnostics, MULTI-04, keyboard, nesting, composeRefs).
- [x] Book: reverted byte-identical to base (verified: empty `git diff HEAD` for the file).
- [x] Story: Multiple reverted to base `defaultValue` (no state); 15 narrow-state sites wrapped in base-pattern `(val) => setValue(val as …)` (incl. Nested outer/inner + NativeKeys single, which the hint missed — tsc oracle confirms all).
- [x] Unit: DOM-07/MULTI-07 reworked to uncontrolled semantics (titles + asserts; rationale above; nothing deleted) + 2 new uncontrolled defaultValue pins (act-wrapped clicks).
- [x] Docs: SPEC.md (surface/status/landing-note/handoff-dissolved/gaps/work-order), TESTS.md (freeze defaults, DOM-07, MULTI-07, out-of-scope), Accordion.md (flat Proposed API, omitted-value paragraph).
Proof (rework):
- tsc: Collapsible.story:336 error GONE; Accordion dir clean. Remaining 7 errors pre-existing/other-crews (playwright/ct.ts x2, Listbox/Slot/Tabs x5). Zero new, one fixed.
- `pnpm agentct Accordion`: Unit 25/25, E2E 20/20 react19 (13 legacy snapshots green unmodified).
- `pnpm agentct Accordion --e2e --react all`: 60/60 (20 x 17/18/19). Snapshots only compare on 19 per skill.
- view-story: MCP down (broken pipe x2, same as prior crew) → pnpm capture fallback. 4 captures: single resting (item-1 open via defaultValue) + clicked item-2 (clean swap, no controlled wrapper); multi resting (A+B open) + clicked A (A closed, B stays). Chrome identical.
- UX review: nested spawn pool-full (8/8, rejected x2 with fresh command_ids) → SELF-REVIEW by skill method (FLAGGED, not independent). Look: PASS (book byte-identical to base; 13/13 snapshots green; captures identical chrome). Feel: all 4 rework deltas APPROVED — (a) uncontrolled restored (base-faithful, additive, controlled path untouched), (b) flat union props (behavior-neutral + tree tsc dissolved), (c) 'arrows' alias (base-compatible), (d) hardening kept (10 items, re-proven 60/60). A11y: no findings (A11Y-01 + KEY-11 green). Caveats: .webm motion not viewable in my tools (binary); motion evidence is PRES-01 CT exit-unmount assertion + resting captures; Accordion owns no animation.
COMPLETE — Accordion reworked: uncontrolled restored + hardening kept, 43/43 cases proven (25 unit + 20 CT incl. 2 legacy smoke, 41 case IDs [x]), 60/60 x runtimes, tsc clean in-dir + Collapsible.story dissolved (no touch), visuals frozen, UX self-signed (pool-full flag). Commit-ready arc below (no commit made per mission rule).
