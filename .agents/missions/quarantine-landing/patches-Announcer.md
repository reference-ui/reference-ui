# Announcer PATCHES crew — log

Branch: reference-system (never switch; never commit). Touch ONLY Announcer dir + this log; read-only elsewhere.

## Inputs (read first, per orders)
- `packages/reference-lib/src/components/Announcer/PATCHES.md` (2 items)
- `docs/MISSIONS/API-STANCE.md` (no V2; breaking NOW pre-release; in-repo consumers migrate in same change — but crew is scoped to Announcer dir only, so out-of-dir migration needs are FLAG, not edit)
- `.agents/missions/quarantine-landing/features-triage.md` (Announcer FEATURES triage; PATCHES sanity scan: Announcer not flagged)
- `.agents/missions/quarantine-landing/announcer.md` (prior reconciliation note: port baseline, 12/12 unit, testid aliases kept pending PATCHES #1)

## CHECKPOINT PLAN (before further reads)
Item 1 — Drop `data-testid` aliases:
- Edit `Announcer.tsx`: remove both `data-testid` attributes; keep `data-reference-announcer` contract selectors.
- Edit `Announcer.test.ts`: retire `ANN-DOM-05` migration assertion (re-point to contract-only assertion).
- Acceptance names Toast / ReferenceLibrary / matrix tests asserting contract selectors only — those trees are READ-ONLY for this crew. Verify by search; if any still use Announcer testids, FLAG to parent/captain (cannot edit). Breaking ONLY as written: selector removal, no API change.
Item 2 — Dev-gated, deduped ambiguous-call diagnostic:
- Edit `Announcer.tsx` (~lines 49-56): gate `announcerDiagnostic` on `NODE_ENV !== 'production'` via `globalThis` pattern; warn once per message shape, not once per call (sibling pattern: `Toast/toastRuntime.ts:116-120`, read-only reference).
- Update/extend `Announcer.test.ts` for: zero warnings in production on ambiguous untargeted calls; exactly one dev warning for repeated same-shape calls.
- Breaking: none (diagnostic-only); behavior change is dev-only + dedup.

Proof: read `test-component` skill first, then `pnpm agentct Announcer` unit+e2e green. Visuals frozen: Announcer is a live-region (unit-only, no `__e2e__`); if any snapshot changes, STOP and flag.
UX: nested `ux-designer` review (read skill; spawn; if pool-full, self-review by the method and flag it).

## Log
- [x] checkpoint written; starting incremental reads
- read Announcer.tsx: testids at L272/L281; diagnostic at L49-51 + call at L56 (ungated, per-call)
- read Announcer.test.ts: 12 tests, no ANN-DOM-05 assertion colocated (migration assertion must live in matrix/read-only); no diagnostic tests yet
- read DECISIONS.md (traceability only) + index.ts (export *): no mechanical remainder there
- read Toast/toastRuntime.ts:111-120 (sibling dev-gate pattern: globalThis-process read, NODE_ENV check inside diagnostic)
- SEARCH polite-announcer: Announcer.tsx (source) + Toast CT spec (9 uses) + ReferenceLibrary CT spec (1 use) — consumers NOT yet on contract selectors; both CT files read-only for this crew
- SEARCH assertive-announcer: Announcer.tsx + Toast CT spec (2 uses). SEARCH ANN-DOM-05: only PATCHES/TESTS/SPEC refs; migration assertion itself not colocated (matrix corpus unported per recon note)
- ITEM 1 VERDICT (pending doc-section confirm): trigger "all consumers on contract selectors" NOT met (Toast CT 11 uses, RL CT 1 use, both read-only) → removing testids would turn sibling specs red; tree-stays-green forbids. Expect BLOCKED + flag.
- read TESTS.md API+DOM-05 + SPEC.md defects/freeze: freeze L150-151 "no-op with one development diagnostic" confirms item-2 shape; ANN-DOM-05 is the migration assertion to retire only when item 1 lands (stays open while blocked)
- read test-component skill; implementing item 2 (dev-gated + per-shape dedup, Toast-mirror semantics)
- LANDED item 2 in Announcer.tsx (globalThis gate + warned-set dedup); added 3 ANN-API-05 unit tests (dev same-shape x1, dev per-shape, production silence); running pnpm agentct Announcer
- PROOF: pnpm agentct Announcer unit 15/15 pass; e2e "No tests found" (expected, no __e2e__ dir — same as baseline); tsc zero Announcer errors; diff scope mine-only (Announcer.tsx +9, Announcer.test.ts +64; other tree mods are sibling crews'); host JSX untouched, no snapshots exist/changed
- read ux-designer skill; spawning nested review
- NESTED UX REVIEW (child 01a0deb9-831b-7470, ux-designer method, read-only): Look PASS (9-line diagnostic-only hunk; host JSX/styles/roles/attrs byte-identical; no CT artifacts exist — diff is the look artifact). Feel: dev-gate APPROVED (Toast-identical semantics, matches freeze "development diagnostic" + RL-ROOT-08); per-shape dedup APPROVED as enhancement (closer to freeze "one development diagnostic" than per-call spam; repeats carry zero new info; deliberate divergence from Toast per-call noted+accepted). A11y: none (console-only). Artifacts: Announcer.tsx diff, SPEC freeze L145-151 + ANN-API-05, Toast gate, host JSX. No self-review — nesting succeeded.

## Result
- Item 1 (drop data-testid aliases): BLOCKED — trigger "all consumers on contract selectors" unmet. Toast CT (`Toast/__e2e__/Toast.ct.spec.ts`: 1053, 1054, 1130, 1172, 1328, 1329, 1334, 1379, 1394, 1423, 1426, 1441) + ReferenceLibrary CT (`ReferenceLibrary/__e2e__/ReferenceLibrary.ct.spec.ts:40`) still select via testid; both files read-only for this crew. Removing testids would turn sibling specs red. No Announcer-dir edit made (SPEC defect 5 + ANN-DOM-05 stay open). FLAG to captain: needs a consumer-migration change (Toast/RL crews or follow-up) before the aliases can drop.
- Item 2 (dev-gated, deduped diagnostic): LANDED + PROVEN. `Announcer.tsx`: globalThis-process gate (production silent; Toast-mirror semantics) + warn-once-per-shape Set. `Announcer.test.ts`: 12 -> 15 tests (3 new ANN-API-05: dev same-shape x1 warning, dev per-shape x2, production zero warnings).
- Proof: `pnpm agentct Announcer` unit 15/15; e2e "No tests found" (expected — no __e2e__, same as baseline); tsc zero Announcer errors; host JSX untouched; no snapshots exist/changed (visuals frozen, no STOP triggered).
- UX: nested APPROVE (see above).
- Files changed (mine only): `packages/reference-lib/src/components/Announcer/Announcer.tsx` (+9), `packages/reference-lib/src/components/Announcer/Announcer.test.ts` (+64), this log. Branch untouched (reference-system, no commit).
