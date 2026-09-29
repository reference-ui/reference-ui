# SMOKEREDS — objective log

IN PROGRESS

Scope: the 3 foreign consumer-smoke reds (reproduced firsthand by
captain, NOT 4a-caused): (1) zero-unexpected-console-errors — Tabs
renders Tab/Panel parts with no Tabs.List diagnostic; (2)
zero-b03-noise — 1 element.ref error (B-03, presence); (3)
zero-race-style-warnings — 10 dev-race warnings (H-6 class,
timing-flaky?). Diagnose each (baseline: they reproduce on the
landed tree; fix-or-scope per finding; flake → prove with repeats
+ quarantine-or-tolerance per house rules, never silent skip).
Repro: `pnpm --dir packages/reference-lib run smoke` (captain log
/tmp/smoke-4a.txt). Gate: full smoke exit 0. Box: 45 min. No API
shape changes. Crew writes below.

## 00:41 UTC — crew on deck, box open (T+0/45, hard stop 01:24, wrap at 01:16)
- Read `run.mjs` + `probe.mjs`: gate = pack → scaffold → tsc → vite build →
  dev-server probe (mount-all + B-11 + zero-errors + style-warning buckets).
- Captain baseline (/tmp/smoke-4a.txt): 4 console errors (2 allowlisted
  Splitter + 1 Tabs unexpected + 1 B-03), 10 race-noise style warnings,
  0 true gaps. So: red1 = Tabs TB-DOM-13 diagnostic false-firing on a
  CORRECT template (exactly one TabsList in app.tsx:305-314); red2 = one
  React-19 `element.ref` getter trip somewhere in the mount-all tree;
  red3 = 10 `css(): no compiled class` warns whose values ARE in the
  served sheet (probe buckets them race/H-6).
- Kicked fresh full-gate repro → /tmp/smoke-reds-1.txt (background).
- Next: read emitting code per red (Tabs listCount ordering; `.ref`
  readers; css() warn path), then fix-or-verdict each within its 15-min cap.

## 00:56 UTC — T+15, all 3 reproduce exactly (2/2 runs identical)
- Fresh repro EXIT=1, same signature as captain: 4 errors (2 allowlisted
  Splitter + 1 Tabs + 1 B-03), 10 race-noise warns, 0 true gaps.
  Quoted: `FAIL zero-unexpected-console-errors — Reference UI: Tabs renders
  Tab/Panel parts with no Tabs.List...`, `FAIL zero-b03-noise — 1
  element.ref errors (B-03, presence crew)`, `FAIL zero-race-style-warnings
  — 10 dev-race warnings (H-6 class, timing-flaky)`.
- RED1 mechanism (Tabs.tsx): Tab/Panel register in LAYOUT effects
  (:978,:1239) but TabsList registers in a PASSIVE effect (:811-814);
  the parent diagnostic is passive (:540). Child passive runs
  setListCount(0→1) first, parent diagnostic runs same flush with stale
  listCount=0 + populated registries → exactly 1 spurious console.error
  per Tabs mount. Template is CORRECT (one TabsList) → real component
  bug, not consumer artifact. Candidate fix: register the List in a
  layout effect (same hook file already defines, :269) so the count
  settles before passive diagnostics. Needs `pnpm agentct Tabs` before+after.
- RED2: scaffold React is 19.3.0 (element.ref getter arms only when the
  element carries a ref). Direct `.ref` readers on elements: RovingFocus
  getChildRef (:257-258); Combobox:1055 is VirtualItem-only (not mounted
  in smoke); Slot/Presence/FocusLock clean. Culprit TBD — running a debug
  probe on the kept scaffold for the full React component stack.
- RED3: emitter chain = reference-neo css.ts (holds candidates until
  load, :92-107) → reference-rs namer miss.ts (microtask scan of
  `@layer utilities` classes only, re-arms on load while linked sheets
  read empty). Smoke probe buckets value-present-in-sheet as "race", but
  that label assumes timing — a rule OUTSIDE `@layer utilities` would
  also read value-present yet never be collected (deterministic, NOT a
  race). Forensics next: locate each warned value's rule + layer ancestry
  in the live dev sheet to split timing (H-a) vs layer-scope (H-b).
- Next: debug probe + layer forensics on kept scaffold (port 5201);
  `pnpm agentct Tabs` baseline in parallel; then fix red1.

## 01:08 UTC — T+27, forensics in; red3 HELD, fixing red1+red2 now
- B-03 culprit CONFIRMED by code: Tabs Tab renders
  `<RovingFocus.Item><Button ref={setRefs}>` (Tabs.tsx:1146-1150) and
  RovingFocus.Item reads `(child).ref` (RovingFocus.tsx:257-258, used at
  :657/:749) on the ref-carrying element → React 19.3 warns (deduped to
  exactly 1). Debug probe on kept scaffold printed the raw
  `Accessing element.ref was removed in React 19` error (no component
  stack — React logs it bare). Fix: use presence crew's safe
  descriptor-based `getElementRef` (Presence/elementRef.ts) in
  `getChildRef`. Combobox:1055 has the same trip but is VirtualItem-only
  (not in smoke path) → NOT touching (minimal; logged as follow-up).
- RED3 forensics: template imports styles.css statically FIRST; lib has
  ZERO runtime style injection; warned value `repeat(3, 1fr)` rule sits
  INSIDE `@layer reference-ui > utilities` post-hoc. So the namer miss
  probe (reference-rs/.../namer/miss.ts) warns for classes whose rules
  ARE present — a constructed-class vs collected-class match failure
  (spelling/collection), deterministic 10/10, NOT a timing race despite
  the bucket's label. Fix lives in reference-rs (agent-rs gates) — out
  of this 45-min box. HELD with evidence; no silent skip, no probe
  tolerance (the check exists to force the namer fix; tolerating hides
  consumer-visible noise from every dev consumer).
- FILES ABOUT TO EDIT (logged pre-edit per HQ): (1)
  packages/reference-lib/src/components/Tabs/Tabs.tsx — TabsList
  registration passive→layout effect (:811-814); (2)
  packages/reference-lib/src/components/RovingFocus/RovingFocus.tsx —
  getChildRef safe read (:254-259) + import. No API shape changes.
- Box math: wrap at 01:16. Skipping pre-fix agentct baselines (do not
  fit; pre-fix smoke /tmp/smoke-reds-1.txt is the baseline) — running
  post-fix `pnpm agentct Tabs` + `pnpm agentct RovingFocus` + full smoke
  concurrently after the edits, reporting whatever completes by wrap.

## 01:22 UTC — T+41 FINAL REPORT (inside 45-min hard box, no commit)
### Per-red mechanism + fix-or-verdict
1. `zero-unexpected-console-errors` — FIXED (real component bug).
   Mechanism: TB-DOM-13 diagnostic (passive effect) reads `listCount`
   STATE, but the mount commit's passives flush before subscription
   setStates re-render — first run always saw 0 with populated
   registries → 1 spurious console.error per correct Tabs mount. A
   layout-effect registration alone did NOT fix it (smoke #2 still red —
   same flush rule). Fix: `listCountRef` mirror updated synchronously in
   `registerList`, diagnostic reads the ref (state kept as re-check
   trigger). Files: Tabs.tsx (~:411-427 registration, ~:548-570
   diagnostic, ~:809-819 layout subscription + why-comments). No API change.
2. `zero-b03-noise` — FIXED (real component bug). Mechanism: Tabs Tab
   renders `<RovingFocus.Item><Button ref={setRefs}>`; Item read
   `(child).ref` directly (RovingFocus.tsx:257-258) on the ref-carrying
   element → React 19.3 `Accessing element.ref was removed` (deduped to
   1). Fix: `getChildRef` now uses presence crew's descriptor-based
   `getElementRef` (`../Presence/elementRef`, leaf import, zero cycle
   risk). No API change.
3. `zero-race-style-warnings` — HELD with evidence (not a flake, not
   skippable). Deterministic 10/10/10 across 3 full runs. Forensics:
   template imports styles.css statically first; lib has no runtime
   injection; warned value `repeat(3,1fr)` rule provably lives INSIDE
   `@layer reference-ui > utilities` post-hoc — so the namer miss probe
   (reference-rs/modules/atomic/js/namer/miss.ts) fails to match
   constructed classes to present rules (collection/spelling, NOT
   timing; the probe's "race" bucket mislabels it). Fix belongs to
   reference-rs under agent-rs gates — out of this box. No probe
   tolerance applied (the check exists to force the namer fix; excusing
   it would hide consumer-visible dev noise). Evidence logs in /tmp
   (smoke-reds-*.txt, forensics scripts) — scaffolds + tarball removed.
### Quoted smoke output (final full gate, post-fix)
- Smoke #1 (pre-fix baseline): 3 FAILs, errors=4 (2 allowlisted+1+1).
- Smoke #3 (final): `PASS zero-unexpected-console-errors`,
  `PASS zero-b03-noise`, `PASS zero-true-gap-style-warnings`,
  `FAIL zero-race-style-warnings — 10 dev-race warnings (H-6 class,
  timing-flaky)`; json: errors=2, allowlisted=2, b03=0, unexpected=0,
  missRaceNoise=10. Final full-gate exit code: **1** (only held red3).
### Component proof (test-component)
- `pnpm agentct RovingFocus` (final tree): E2E 44/44 + Unit 50 pass, EXIT=0.
- `pnpm agentct Tabs` (layout-only state): E2E 26/26 + Unit 62 pass, EXIT=0;
  plus `pnpm agentct Tabs --unit` on the FINAL tree: 3 files / 62 tests
  pass incl. Tabs.cases.test.tsx (genuine no-List diagnostic still fires).
  Full-Tabs-CT on final tree not re-run (diff after it: diagnostic
  read-path state→ref only; smoke #3 proves the behavior) — 1-command
  resume item below. No snapshot updates (logic-only fixes).
### Resume checklist
- [ ] Red3: instrument `reportMissCandidates` with classNames in a scaffold
  copy; diff constructed vs `scanSheets()`-collected set; fix miss.ts
  (agent-rs: `pnpm agentrs` quality gates); full smoke must show
  missRaceNoise=0 with zero-true-gap still PASS.
- [ ] Optional: `pnpm agentct Tabs` (full) on final tree for the record.
- [ ] Follow-up (not smoke-path, same B-03 trip): Combobox.tsx:1055
  VirtualItem `(child)?.ref` → `getElementRef`.
- [ ] Tree state at handoff: `M Tabs.tsx, RovingFocus.tsx, SMOKEREDS.md`
  only; dist rebuilt (gitignored); residue removed; NOT committed (crew
  never commits); agentct daemon left warm on :3101 (shared infra).

## Captain verification + landing (reds 1+2)

- Firsthand: Tabs 26/26+62u (closes the crew's full-CT gap);
  RovingFocus 44/44+50u; smoke PASS zero-unexpected-console-errors
  + PASS zero-b03-noise, FAIL zero-race-style-warnings (10/10,
  identical signature — red3 confirmed real + deterministic).
- Diffs reviewed: ref-mirror diagnostic (state kept as trigger,
  deps verified) + descriptor-based ref read (leaf import, no
  cycle). Both minimal, commented, no API change.
- Committed (2-fix arc + this log). Red3 dispatched to NAMER
  (reference-rs, agent-rs lane) with the forensics + resume list.
