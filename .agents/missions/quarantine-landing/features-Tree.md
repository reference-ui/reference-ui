# Tree FEATURES crew log — reference-system, no branch switch, no commit

## CHECKPOINT PLAN (written after triage-Tree + Tree/FEATURES.md + API-STANCE.md + Portal contract only)

Items: Tree #2 shadow-root traversal + #3 slot/part registration. #1 HOLD (circular, HQ sequences), #4 HOLD (parked).

#2 shadow-root traversal — IMPLEMENT-NOW, owning-root reads only:
- Portal-F landed: NO shim needed; React attaches listeners per portal container on
  mount AND container switch (verified live). Tree rides that; no Tree event fork.
- Tree-side change shape: replace `document.activeElement` assumptions with owning-root
  reads (`getRootNode()`), per FEATURES.md. ENV-03 was skipped in quarantine landing
  as lib-wide retargeting concern — now verify whether owning-root reads + Portal
  contract make a REAL shadow CT pass; if a genuine gap remains, verify-block with evidence.
- Zero behavioral delta in light DOM; visuals frozen.

#3 slot/part registration — IMPLEMENT-NOW, follow SHIPPED Slot context:
- Tree still sniffs children (render-time scan) to learn branch-vs-leaf. Migrate parts
  to register through the Slot kernel (useSlot/useSlots) — same authored JSX, ZERO
  behavioral delta, hydration proof required (SSR-safe two-path branch/leaf DOM must
  stay hydration-safe under registration state).
- Read the shipped Slot context shape first; follow it, don't invent.

Steps:
1. Incremental reads of Tree dir (impl, SPEC/tests) + shipped Slot context with log lines between.
2. Baseline: pnpm agentct Tree before changes (after reading test-component skill).
3. Implement #2, then #3, each with failing-first/green proof.
4. Migration sweep (stories/books/Showcase/tests) only if API changes; expect internal-only.
5. Prove: pnpm agentct Tree unit+e2e green. STOP+flag if any snapshot changes
   (view-story inspection + UX sign-off required).
6. UX review: read ux-designer skill, nested review; self-review by method + flag if pool full.
7. Report: landed/blocked, test evidence, UX verdict, exact files, flags.

## Log
- [plan] checkpoint written; starting incremental reads.
- [read] Tree.tsx (969 lines): NO document.activeElement reads. Only `document` global is `document.dir` RTL fallback (L775); traversal is rootEl-scoped (shadow-safe by construction). #2 shape: root-aware dir resolution + REAL shadow CT.
- [read] Slot.ts kernel: useSlotRegistration registers in useLayoutEffect (L220-230) — effect-timed, no SSR registration. DateField pattern: parts render null + register; layout renders from registry (SSR HTML necessarily lacks part content pre-hydration).
- [read] Tree.test.tsx TR-ENV-01 pins SSR branch output: aria-expanded="true", role="group", aria-level="2" all in renderToString HTML. Tension with #3 noted; investigating.
- [read] Menu shadow pattern: story attachShadow + createPortal; locators pierce; toBeFocused works in shadow. test-component + ux-designer skills read.
- [baseline] pnpm agentct Tree: 52/52 e2e + 3/3 unit green (react19).
- [#2 impl] Tree.tsx: resolveIsRtl() host-chain walk (light-DOM identical: first closest() hit wins, document.dir fallback last); Shadow story (plain + rtl-wrapped hosts); TR-ENV-03 CT, no snap().
- [#2 proof] TR-ENV-03 green; failing-first verified (old logic fails exactly at RTL ArrowLeft-expand assert L1344). Pre-RTL section passed on old logic too — traversal rides the Portal-owned event path, no Tree event fork.
- [#3 BLOCKED] verify-block with real-kernel proof: temp colocated test (real createSlotRootContext/useSlotRegistration/useSlot, since deleted) showed a registering Group child is invisible to the parent's renderToString render — leaf-path SSR HTML, no aria-expanded/row. TR-ENV-01 (green) pins branch-path SSR HTML. Scan-replacement + zero-delta + hydration-proof jointly unsatisfiable; parent-first rendering is the wall. Finding recorded in FEATURES.md #3 for HQ (keep scan vs accept SSR cost). Zero Tree source changed for #3.
- [docs] FEATURES.md #2 LANDED + #3 finding; SPEC.md 55/64, Playwright 53, TR-ENV-03 [x]; DECISIONS.md candidate 2 LANDED.
- [sweep] In-repo consumers: package barrel re-export + Showcase (public props only). No API change → zero call-site edits.
- [proof] pnpm agentct Tree: 53/53 e2e + 3/3 unit (react19, snapshots green, __snapshots__/ git-clean); --e2e --react all: 159/159 (17/18/19). tsc: zero Tree errors (fixed one TS7022 in helper with explicit annotation).
- [ux] Nested ux-designer review: SIGN-OFF (look PASS nothing moved; RTL-shadow keys approved; light-DOM unchanged incl. dir=ltr-under-rtl-document edge approved as correctness alignment; no a11y findings).
- [done] #2 landed, #3 verify-blocked, #1/#4 untouched per HOLD. No commit, still on reference-system.
