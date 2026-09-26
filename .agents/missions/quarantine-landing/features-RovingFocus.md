IN PROGRESS — RovingFocus FEATURES crew (quarantine-landing mission)
Branch: reference-system (never switch; never commit). Dir: packages/reference-lib/src/components/RovingFocus/

## Brief
Implement-NOW per .agents/missions/quarantine-landing/features-triage.md (RovingFocus §):
#3 anatomy THROW (+ consumer audit), #4 pointer→current currentness-only (+ Menu composition note),
#5 controlled current-id STRIP, #6 CUT RF-ENV-02 (Tabs PATCHES #2 stays Tabs-local),
#7 consumer forks Listbox-first (IME) then Tabs dedup. HOLD #1 (2D grid), #2 (slot) — untouched.

## Consumer audit (pre-change, read-only)
- Live Root/Item TSX consumers: Menu ONLY (Menu.tsx Root→single Div; Item→single Div; no
  conditional/null children). Book/matrix/stories: zero other usages.
- Controlled props (currentId/defaultCurrentId/onCurrentIdChange): zero in-repo users (only
  RovingFocus.tsx itself + docs). Strip is consumer-free.
- TypeaheadModel consumer: Tree (direct `../RovingFocus/typeahead` import; additive-only change safe).
- Listbox fork (Listbox.tsx:374-393): printable-char path checks key.length/modifiers ONLY — no
  isComposing guard (repo-wide grep: zero isComposing hits outside RovingFocus kernel) → live IME
  bug CONFIRMED in code (composing keys preventDefault'd + stopPropagation'd into the buffer).
  Listbox triage #2 sequences its migration on RovingFocus exporting the seams → migration is
  Listbox crew's landing; my #7 = export seams + verify-block the rest.
- Tabs fork (Tabs.tsx:256-332): hand-rolled List keydown; Tabs triage #2 sequences on kernel
  stability → Tabs crew's landing; verify-block.
- Tree fork (Tree.tsx:731-746,872-886): TypeaheadModel reuse WITHOUT isComposing guard → same
  latent IME bug; Tree #4 is HOLD (no engine visible-set support) → flagged, not touched.
- Menu click-open policy (MenuItem handleClick: close + restoreFocusToTrigger): currentness-only
  pointer press (no .focus() call) cannot fight focus-restore; composition reconciliation stays
  with Menu crew. Menu suite rerun proves no regression.

## Landed (all in RovingFocus dir; zero consumer-dir edits)
- #3 THROW: `assertSingleElementChild` in RovingFocus.tsx — omitted/null/false/text/
  number/Fragment/multi-element all throw descriptive errors at render; gate runs after
  hooks but registration is effect-based so a throw = no partial registration (RF-DOM-06).
  `children` type tightened to required `React.ReactElement`. Gotcha fixed in-pass:
  `Children.count(false)===1`, so nullish/booleans normalize to zero before measuring;
  `Children.only` (throws its own invariant on non-element singles) replaced by `toArray`
  for the single-child read. Menu audit: Root→single Div, Item→single Div, no
  conditional children → throw-safe; Book/matrix/stories have zero other Root/Item users.
- #4 pointer→current, currentness-only: Item composes `onPointerDown` → `setCurrentId`,
  never `.focus()`; skips disabled, no-ops when already current, consumer preventDefault
  opts out, primary-button-only gate (UX-review Q1 answered in code — right-click never
  moves the stop). Menu click-open policy (close + restoreFocusToTrigger) keeps full
  authority by construction; composition-level reconciliation stays with Menu crew.
- #5 STRIP: `currentId`/`defaultCurrentId`/`onCurrentIdChange` deleted; internal
  `useState<string|null>(null)`; settlement effect simplified. Zero in-repo users (grep).
- #6 CUT RF-ENV-02: TESTS.md entry rewritten as CUT (case text kept for the record,
  revisit condition named, Tabs PATCHES #2 noted unaffected); SPEC.md gaps/work-order/
  case-index annotated. No kernel code — nothing shadow-specific existed.
- #7 seams exported (Listbox-first unblock): `shouldIgnoreTypeaheadKey` (new, in
  typeahead.ts; kernel's handleTypeahead refactored onto it, behavior-identical) +
  `getDirection` (new export) + `TypeaheadModel` (already exported). Unit-pinned incl.
  the IME-composing case. Consumer migrations VERIFY-BLOCKED on sibling crews (see below).
- HOLD #1 (2D grid), #2 (slot): untouched. No other files touched (list below).

## #7 verify-block (do not invent work — evidence)
- Listbox migration (typeahead routing + IME fix) = Listbox triage #2, explicitly
  "sequenced on RovingFocus exporting the seams" → Listbox crew's landing. Seam map:
  Listbox.tsx:374-393 printable path → guard with `shouldIgnoreTypeaheadKey(e)` before
  feeding keys; Listbox.tsx:885-928/951-1000 buffer forks → `TypeaheadModel`; local
  `getComputedDirection` → `getDirection`. Live IME bug reconfirmed: no isComposing guard
  anywhere in Listbox (repo-wide grep: only the kernel has one).
- Tabs dedup (delete Tabs.tsx:256-332 hand-rolled List keydown, compose Root/Item) = Tabs
  triage #2, "sequenced on kernel stability" → Tabs crew's landing. Kernel stable as of
  this pass (#3/#4/#5 landed, 27/27 unit + 6/6 CT green).
- Touching Listbox/Tabs dirs here would collide with those crews' triaged items → stayed out.

## Proof
- `pnpm agentct RovingFocus --unit`: 27/27 (7 pre-existing + 14 RF-DOM-06 anatomy matrix
  + 1 no-partial-DOM/stale-registration + 5 seam guards incl. IME-composing).
- `pnpm agentct RovingFocus --e2e` (react19): 6/6 incl. new RF-TAB-04 (real click moves
  focus+currentness; synthetic pointerdown flips tabindex with focus unmoved; disabled +
  right-click presses ignored; Tab-out/Shift-Tab-back re-enters on pressed item). No
  `snap()` in the new spec (Listbox-crew precedent); all 10 frozen snapshots green,
  `__snapshots__/` untouched per git status.
- Shared seams: Menu unit 8/8 + Menu e2e 30/30 (sole kernel consumer — unaffected);
  Tree unit 3/3 (typeahead.ts importer — additive-only change safe). Listbox/Tabs suites
  NOT rerun: neither imports the kernel (forks pending their crews' landings).
- `tsc --noEmit`: 0 errors in RovingFocus files (9 pre-existing errors in other crews'
  files: ct.ts, Listbox/Slot/Switch/Tabs tests — untouched by me). Fixed one of mine
  in-pass (`unknown` → `ReactNode` for the anatomy gate).
- Artifacts: RF-TAB-04 test-finished screenshot viewed (Blueberry focused, ring visible);
  video preserved at /tmp/rf-tab04-video.webm (test-results/ is pruned by concurrent
  sibling runs; no webm viewer/ffmpeg in this env — noted, not hidden).

## UX review (nested ux-designer subagent — real nest, pool had room)
- LOOK: PASS — headless confirmed (no DOM/classes/styles added), 10 snapshots untouched.
- FEEL: all 5 changes APPROVED (anatomy throw "strictly better debuggability";
  currentness-only "Menu keeps authority by construction"; strip in-contract, zero
  consumers; shadow cut no-op; seams behavior-identical extraction).
- A11Y: positives (one-tab-stop invariant, disabled excluded from press, throw replaces
  keyboard-dead silent render); 1 non-blocking watch → fixed in-pass (primary-button gate).
- Questions: Q1 answered in code (+ CT pin, 6/6 re-green); Q2 video preserved at the /tmp
  path above. Verdict: SIGN OFF. Full text in subagent session log (see work-tree record).

## Flags / handoffs
- Tree has the SAME latent IME bug (Tree.tsx:731-746,872-886 reuse TypeaheadModel with no
  isComposing guard) but Tree #4 is HOLD → flagged for captain, not touched.
- tsc has 9 pre-existing errors in other crews' files (listed above) — someone owns cleanup.
- Infra noise (not findings): `Children.count(false)===1` quirk; test-results pruning by
  sibling runs (Listbox crew hit the same); no ffmpeg/webm viewing in this env.

## Files changed (RovingFocus dir + this log ONLY; no consumer call-site edits)
- M packages/reference-lib/src/components/RovingFocus/RovingFocus.tsx (throw gate,
  pointer currentness + button gate, controlled-strip, guard refactor, seam exports)
- M packages/reference-lib/src/components/RovingFocus/typeahead.ts (shouldIgnoreTypeaheadKey)
- M packages/reference-lib/src/components/RovingFocus/RovingFocus.test.tsx (14 anatomy +
  1 no-partial-DOM + 5 seam tests; happy-dom pragma)
- M packages/reference-lib/src/components/RovingFocus/__e2e__/RovingFocus.ct.spec.ts (RF-TAB-04)
- M packages/reference-lib/src/components/RovingFocus/TESTS.md (RF-ENV-02 CUT)
- M packages/reference-lib/src/components/RovingFocus/SPEC.md (strip/CUT bookkeeping)
- M packages/reference-lib/src/components/RovingFocus/RovingFocus.md (press + seams docs)
- ?? .agents/missions/quarantine-landing/features-RovingFocus.md (this log)

COMPLETE
