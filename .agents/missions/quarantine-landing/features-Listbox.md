IN PROGRESS — Listbox FEATURES crew
Mission: quarantine-landing Listbox IMPLEMENT-NOW items #1 #2 #3 (skip #4 pending post-Combobox-F)
Branch: reference-system (stay, never switch, never commit)
Scope: Listbox dir + this log + consumer call-site migrations only

## Plan
- #1 typed onChange: discriminated overloads keyed on selection (single→T|null, multiple→T[]), generic shared incl. virtual items.
- #2 RovingFocus re-convergence: internal only, zero public API; ATTEMPT, verify-block if seams absent.
- #3 Section/Header/Empty fate: REMOVE outright iff audit confirms zero in-repo consumers + cases, else STOP/flag.
- #4 isInsideCombobox: SKIP (do not delete), report pending.

## Progress
- #1 LANDED (types-only): discriminated ListboxSingleProps/ListboxMultipleProps
  keyed on selection (single→TValue|null, multiple→TValue[]); TValue shared
  by Option, VirtualFocusItem/Adapter, validateVirtualAdapter,
  computeNextMultipleSelection; Listbox root generic call signature (per-site
  inference); 'defaultValue' added to root Omit (restores DECLINED
  uncontrolled ban + dead @ts-expect-error). Unknown multi values stay in
  TValue (no widening). Zero runtime/DOM change.
- #2 VERIFY-BLOCKED: getDirection + shouldIgnoreTypeaheadKey seams exist only
  as uncommitted RovingFocus-crew work (HEAD has getDirection private, no
  guard export); only committed seam is TypeaheadModel, whose semantics
  diverge from Listbox typeahead (no empty-buffer cycle branch, different
  repeat detection) — a partial swap would fork behavior, not converge.
  No seams invented; local kernel untouched.
- #3 STOPPED + FLAGGED: audit refutes "zero consumers + zero cases".
  Consumers: Combobox.tsx re-exports (Combobox.Section/Empty), Combobox.book,
  Combobox.test.tsx, Listbox.story Sections, mcp library-catalog. Cases:
  listbox-sections.png snapshot + Section/Empty CT coverage. Removal would
  break Combobox public API mid-flight. Nothing removed.
- #4 SKIPPED per orders: isInsideCombobox untouched (pending post-Combobox-F).
- Proof: tsc Listbox-dir clean (also fixed 2 pre-existing dir errors);
  pnpm agentct Listbox E2E 25/25 react19, Unit 12/12, 8 snapshots unmoved.
- UX: nested ux-designer review APPROVED ("ship the types") — look PASS
  (no paint/DOM line touched, 8 snapshots unmoved), feel PASS (runtime
  line-for-line identical; defaultValue Omit narrowing approved, no
  behavior loss), a11y: no findings. Artifacts: full git diff of the 5
  files + snapshot dir listing + cited agentct/tsc runs. No re-pin needed.

## Files changed (Listbox dir + this log only; zero consumer call-site edits needed)
- packages/reference-lib/src/components/Listbox/Listbox.tsx (#1 types)
- packages/reference-lib/src/components/Listbox/Listbox.test.ts (#1 type tests + React19 children fix)
- packages/reference-lib/src/components/Listbox/Listbox.md (Proposed API block)
- packages/reference-lib/src/components/Listbox/SPEC.md (gap bullet + work-order #1 DONE)
- packages/reference-lib/src/components/Listbox/FEATURES.md (§1 LANDED status)

## Flags for captain/HQ
1. #3 triage premise ("zero consumers + zero cases") is stale: Combobox
   re-exports Section/Empty as public API and consumes them in book/tests;
   listbox-sections snapshot exists. Removal needs a joint Listbox+Combobox
   decision, not a solo cut. Recommend HOLD-FOR-HQ (joint design).
2. #2 needs RovingFocus #7 to land first (getDirection export +
   shouldIgnoreTypeaheadKey guard are its uncommitted work, explicitly
   naming Listbox as consumer); plus TypeaheadModel semantic gaps
   (empty-buffer cycle, repeat detection) must be reconciled before any
   kernel swap. Recommend re-queue post-RovingFocus-F.
3. Tree-wide tsc is red at baseline (ct.ts harness, Slot, Tabs) from
   concurrent flights — Listbox dir is clean; other dirs are not mine.

COMPLETE
