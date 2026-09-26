# Portal FEATURES crew log — reference-system, no branch switch, no commit

## CHECKPOINT PLAN (written after triage-Portal + Portal/FEATURES.md + API-STANCE.md only)

Item: Portal #1 Shadow-portal event contract — IMPLEMENT-NOW, decided PORTAL-OWNS.
- Placement into ShadowRoot already works (PT-DOM-05, PT-ENV-03, PT-COMP-03).
- Gap: key/pointer event delivery across the shadow boundary is unowned — native
  targets retarget to the host under React container delegation, so item handlers
  never fire (ENV-03 skips in tree, menu, date-field DF-COMP-04/ENV-01, combobox
  CB-COMP-04 modal+shadow).
- Fix shape: Portal attaches shadow-root listeners / a retargeting shim for the
  event half. No per-consumer forks. Breaking NOW per API stance; no
  deprecation/migration shims ("no shims" = no back-compat shims; the retargeting
  listener IS the feature mechanism, not a migration shim).

Steps:
1. Incremental reads of Portal dir (impl, SPEC/tests) with log lines between.
2. Reproduce: find the skipped ENV-03 tests / Portal shadow tests; confirm the
   retarget gap with a failing-first test if one doesn't exist.
3. Implement in Portal dir only: shadow-root event listener / retargeting so
   React synthetic handlers on portal content fire when container is in shadow DOM.
4. Migration sweep (stories/books/Showcase/tests) ONLY if API changes; expect
   internal-only change → likely no call-site edits. Consumer ENV-03 un-skips are
   other crews' scope — do NOT touch consumer dirs; flag the unblock instead.
5. Prove: read test-component skill, run pnpm agentct Portal (unit+e2e green).
   Headless infra: STOP+flag if any snapshots change.
6. UX review: read ux-designer skill, attempt nested review; self-review by the
   method + flag if pool full.
7. Report: landed/blocked, test evidence, UX verdict, exact files, flags.

## Log
- [plan] checkpoint written; starting incremental Portal-dir reads.
- [probe] MN-ENV-03/CB-ENV-03/DF-ENV-01/DF-COMP-04 all PASS; zero skips repo-wide. FEATURES.md "handlers never fire" premise is stale for mount.
- [root-cause] react-dom 17/18/19 all run preparePortalMount -> listenToAllSupportedEvents(portalContainer) on HostPortal mount (verified in bundles). Shadow-container mounts already get true-target dispatch; no retarget shim needed for the mount path.
- [gap-found] preparePortalMount runs ONLY when current===null. Container SWITCH (A->B) never re-attaches listeners on the new container: harmless in light DOM (root-container bubble covers it), fatal into a ShadowRoot (retarget to host -> host-fiber dispatch -> inner handlers lost). PT-REACT-05 already blesses A->B as "one documented subtree replacement" with no state promise, so container-keyed remount is contract-aligned.
- [plan] Portal-owned live proof for PT-DOM-05/PT-ENV-03/PT-COMP-03 (zero shadow CT at Portal level today) + switch-into-shadow event test (expect FAIL first), then container-keyed remount fix in Portal.tsx. No snap() in new tests (event contract, zero snapshot risk).
- [finding] Mount AND switch paths already deliver: React attaches listeners per portal container on mount, and containerInfo change remounts the portal (verified live: post-switch target-b carries _reactListening marker). No shim needed; none added. A Portal-level suppression would break composed outside-press/Escape — documented as must-not.
- [finding] Real artifact pinned: React ancestors at/above the shadow host observe shadow-portal events twice (true-target + host-retargeted dispatch). PT-COMP-03 asserts content-once + ordered triple; FEATURES.md documents idempotent-ancestor guidance.
- [tests] pnpm agentct Portal: unit 4/4; e2e react19 15/15, react18 15/15, react17 15/15. New tests use no snap(); __snapshots__/ untouched (git-clean). Consumer shadow suites re-verified green: MN-ENV-03, CB-ENV-03, DF-ENV-01, DF-COMP-04.
- [unit] Portal.test.tsx += PT-REACT-05 replacement test (switch resets state/reruns effects; same-container rerender preserves).
- [docs] FEATURES.md #1 LANDED (PORTAL-OWNS, no-shim rationale); DECISIONS.md updated; TESTS.md += PT-SHADOW-01; Portal.md += Shadow-DOM-events section. Zero Portal.tsx change; zero consumer call-site edits (no API change; Overlay resolves stable container identities).
- [ux] Nested ux-designer review APPROVE (look unchanged, feel additive-only, a11y none). No pool-full fallback needed.
- [done] Item landed. Files: Portal.story.tsx, Portal.test.tsx, __e2e__/Portal.ct.spec.ts, FEATURES.md, DECISIONS.md, TESTS.md, Portal.md. No commit, still on reference-system.
