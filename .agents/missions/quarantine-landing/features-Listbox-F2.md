IN PROGRESS — Listbox FEATURES F2 micro-crew
Mission: quarantine-landing Listbox F2 items #2 (RovingFocus re-convergence) + #4 (isInsideCombobox sweep); #3 HOLD (do not touch)
Branch: reference-system (stay, never switch, never commit)
Scope: Listbox dir + this log only; read-only elsewhere
Context: v1 flags in features-Listbox.md; RovingFocus seams committed (0163ca7df); Combobox-F done

## Plan
- #2: migrate Listbox typeahead/nav onto kernel seams (getDirection, shouldIgnoreTypeaheadKey, TypeaheadModel) — internal only, zero public API; reconcile TypeaheadModel gaps (empty-buffer cycle, repeat detection); verify-block if behavior-identical swap impossible.
- #4: grep isInsideCombobox — claimed by Combobox → leave + report; dead → delete.
- Guardrails: visuals frozen (snapshot move → view-story + UX sign-off or STOP); prove with pnpm agentct Listbox; nested ux-designer review.

## Progress
- (log opened; header first per orders)
- Read v1 flags (features-Listbox.md), API-STANCE, test-component + ux-designer skills.
- Seams confirmed at HEAD: `getDirection` (RovingFocus.tsx:96), `shouldIgnoreTypeaheadKey` + `TypeaheadModel` (typeahead.ts:35,41; re-exported RovingFocus.tsx:4-5) via 0163ca7df.
- #4 grep: `isInsideCombobox` hits ONLY Listbox.tsx:185 (decl) + :1095 (provider) + Listbox docs. Zero Combobox hits in working tree (incl. uncommitted Combobox-F). ListboxContext is module-private (not exported) so no external consumer CAN read it. Verdict: still dead → DELETE.
- #2 analysis: kernel `handleKey` lacks Listbox's empty-buffer cycle branch; LB-KEY-04 CT (Listbox.ct.spec.ts:382-400) pins it: focus apple + type 'a' → avocado. Kernel would return apple (findFirstMatch from current). Direct swap breaks pinned CT → TypeaheadModel BLOCK expected; proving via swap experiment + /tmp differential probe next.
- #2 partial-land candidates: `getDirection` (body line-identical to local `getComputedDirection`) + `shouldIgnoreTypeaheadKey` on the printable-char branch (delta = composing keys skipped; the kernel crew's "Listbox live bug").
- PROBE (real kernel, /tmp/listbox-f2-probe.mts): (A) `handleKey('a', apple)` → `apple`, CT expects `avocado` — DIVERGE, no empty-buffer cycle branch. (B) buffer `σ` + key `ς` → kernel appends (`σς`), Listbox collator says repeat/cycle — DIVERGE (collator σ~ς equal, toLowerCase differ; node confirms compare=0, tolower=false).
- SWAP EXPERIMENT (repo oracle): standalone handler driven by real `TypeaheadModel` → `pnpm agentct Listbox "LB-KEY-04"` FAILED (avocado inactive, focus stuck on apple). Reverted via `git checkout -- Listbox.tsx`; dir verified clean. #2-model BLOCK proven twice (probe + CT).
- LANDED (Listbox.tsx): kernel `getDirection` import (local helper deleted, 2 call sites), `shouldIgnoreTypeaheadKey` printable-char guard, `isInsideCombobox` field+provider deletion. Docs: FEATURES §2 PARTIAL / §4 LANDED-deleted, SPEC gaps bullet, DECISIONS #7 DECIDED(delete).
- tsc: Listbox dir zero errors (tree red only in other crews' dirs: NumberField, Slot).
- PROOF: `pnpm agentct Listbox` Unit 12/12; E2E first run 15/25 (environmental flake — concurrent Menu react17 load, ~24s/test), re-run `pnpm agentct Listbox --e2e` 25/25 react19 exit 0 (/tmp/listbox-f2-e2e.log). 8 snap() baselines pass unmoved — visuals frozen.
- Nested ux-designer review spawned (Listbox F2 UX review); awaiting verdict.
- UX VERDICT: APPROVE (all deltas). Look PASS (zero render/style lines touched, 8 snapshots pass unmoved). Feel: getDirection APPROVE zero-delta (pinned LB-KEY-02/03); IME-composing skip APPROVE as convergent bug fix/enhancement (composing keystrokes no longer corrupt buffer/yank focus; LB-KEY-04/05, LB-VIRT-05 green); isInsideCombobox deletion APPROVE zero-delta (unobservable); docs APPROVE. A11y: no findings; composing fix reduces surprise focus moves for IME+SR users. Artifacts: full Listbox diff, /tmp/listbox-f2-e2e.log, kernel sources. Recommendation (out of scope): future CT pin for composing behavior.

## Files changed (Listbox dir + this log only; no consumer edits; never committed)
- packages/reference-lib/src/components/Listbox/Listbox.tsx (#2 seams + #4 deletion)
- packages/reference-lib/src/components/Listbox/FEATURES.md (§2 PARTIAL, §4 LANDED-deleted)
- packages/reference-lib/src/components/Listbox/SPEC.md (gaps bullet → partial convergence)
- packages/reference-lib/src/components/Listbox/DECISIONS.md (#7 OPEN → DECIDED-delete)

## Flags for captain/HQ
1. #2-model stays VERIFY-BLOCKED: TypeaheadModel needs an empty-buffer cycle branch (LB-KEY-04 semantics) + collator-based repeat detection before Listbox can converge without forking pinned behavior. Kernel-side change; Listbox crew must not invent seams.
2. #3 untouched per orders (HOLD — joint design).
3. Tree-wide tsc still red at baseline in other crews' dirs (NumberField, Slot); Listbox dir clean.
4. E2E flake note: one 15/25 run under concurrent-crew load (Menu react17 in parallel, ~24s/test); clean 25/25 re-run. No code changed between runs.

COMPLETE
