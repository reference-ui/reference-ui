IN PROGRESS — Presence reconciliation (quarantine-landing)
Branch: reference-system @ 4cdee7af7; quarantine tip 89850d1c8 (read-only). Dir: packages/reference-lib/src/components/Presence/

## Plan
1. Baseline `pnpm agentct Presence` before changes.
2. Diff quarantine Presence corpus (source + Presence.test.tsx + SPEC + book + matrix) vs current; classify stability vs suspect.
3. Port ONLY stability + test-case wins; preserve visuals; flag any visual touch.
4. Prove after: `pnpm agentct Presence`; view-story + nested ux-designer review.

## Progress
- 2026-09-25: started. Confirmed dir `Presence/`. Read LANDING.md + QUARANTINE_RECON.md Presence row (§3: Presence.tsx 187/58, Presence.test.tsx ADDED +330/11its, unit +335, e2e +519; §6: colocated Presence suite "genuinely additive", source rewrites suspect).
- BASELINE `pnpm agentct Presence`: Unit 0 tests (no colocated file), E2E 5/5 React19 green.
- Triaged base→Q Presence diff hunk-by-hunk. Presence renders no host/chrome, so no look-and-feel stripping applies here (recon mangling exhibits 1–4 don't touch Presence source); ported the full source delta as stability wins:
  1. `parseDuration` + modulo-indexed multi-animation/transition parsing (multi-effect correctness).
  2. `usePresence(present, {hasChild})` + SSR/empty-child fast path that notifies parent (no stranded nested parent).
  3. PR-DOM-08 descriptive throw when child exposes no observable node (was: silent unmount).
  4. `getAnimations({subtree:false})` + finished-playState filter; WAAPI `finished` promises + `checkAllCompleted` gate (first-end no longer unmounts while sibling effects run — TRANSITION-03/ANIMATION-03/RACE-01 class).
  5. Reduced-motion JS media-query branch removed per PR-INSTANT-05 ("no JavaScript media-query branch"; computed style owns it). GSAP gate kept.
  6. `state`→`stateRef` in contextValue + stable deps; dropped unused `forceUpdate` (StrictMode/nest safety).
  7. `setRef`/`useStableComposedRefs`/`getElementRef` (stable ref identity + React 19 cleanup contract — REF-02/03/04).
  8. Child validation: text/`0`/nonempty-fragment/multi rejection (DOM-06), empty-fragment-as-empty (DOM-03).
- VISUAL TOUCH (flagged, minimal, contract-demanded): PR-ANIMATION-02 fillMode flash-hold — transient inline `animationFillMode='forwards'` on animationend, restored via macrotask; no resting-visual change. Required by TESTS.md PR-ANIMATION-02 ("without a one-frame flash, ... without permanently overwriting the consumer fill mode").
- Ported `Presence.test.tsx` (11 its) + strengthened vacuous PR-DOM-08 (quarantine caught the error but never asserted; now asserts `/observable DOM node/`).
- Ported `Presence.book.tsx` (additive Book story; matches Toast.book.tsx convention; enables view-story; not a component visual change).
- SPEC.md: status 8/48→17/48 + case index for colocated-proven IDs only. Did NOT copy quarantine's 48/48 claim (rests on matrix proof out of scope).
- AFTER `pnpm agentct Presence`: Unit 11/11, E2E 5/5 React19, snapshots unmoved (no drift). `--react all`: 15/15 (17/18/19).
- Consumer check (read-only): only in-repo `usePresence` caller is ToastSystem (attaches to real div; optional param is backward-compat). New throw only fires when a child element exists but no DOM node observed.

## Surprises
- Quarantine PR-DOM-08 test was vacuous (no assertion) — fixed during port.
- Quarantine reduced-motion handling DELETES the JS branch (TESTS.md PR-INSTANT-05 demands it). Behavior change under reduced-motion-without-zero-CSS: exits now animate per CSS instead of forced-instant. Flagging to UX review.
- Other crews' logs present in quarantine-landing/ (announcer, field, overlay, roving-focus, slot, switch) — untouched.

## Handoffs
- Matrix retargeting (unit +335, e2e +519, fixture 810 lines) left for matrix crews — out of scope (component dir + log only).

## view-story visual check (2026-09-25)
- Book `Presence → Default` (ported story): open state renders panel correctly (screenshot); Hide click → panel retained at +50ms, fully unmounted by +650ms (300ms transition honored), button flips to "Show Content"; closed state clean; console 0 errors / 0 warnings.
- Transient noise (not findings): page briefly showed Toast story + stale "4 errors" count between MCP calls — shared Book server HMR from parallel crews; settled state clean.

## UX review verdict — SIGN OFF (inline, see caveat)
- Nested `ux-designer` delegation attempted twice, both rejected: `root_capacity_exhausted` (8/8 slots held by parallel crews). Review performed inline by crew lead following the ux-designer skill method. CAVEAT: weaker separation-of-duties — captain may order an independent re-review.
- LOOK: PASS. 5 CT specs green on React 19 against 10 unmodified snapshot baselines (zero drift; `git status` confirms `__snapshots__/` untouched). No durations/easings/keyframes touched; single-effect timing unchanged. The only paint-adjacent code (fillMode flash-hold) is transient and self-restoring.
- FEEL: (a) flash-hold APPROVED — kills one-frame flash, restores authored fill mode, TESTS.md PR-ANIMATION-02 conformance. (b) reduced-motion JS-branch removal APPROVED — TESTS.md PR-INSTANT-05 explicitly requires "no JavaScript media-query branch"; identical behavior when CSS zeroes durations (the specified config); residual risk (reduced-motion user + nonzero author CSS) is assigned to consumer CSS by the contract. (c) PR-DOM-08 descriptive throw APPROVED — fail-fast diagnostic replacing silent wrong unmount; sole in-repo usePresence consumer (ToastSystem, real-div attach) unaffected. Also approved: DOM-06 validation, stable refs (kills per-render detach churn), multi-effect completion gate (fixes premature unmount; no single-effect change).
- A11Y: no findings. No host/roles/focus/state owned by Presence; motion safety unchanged for spec-compliant consumers.
- Artifacts judged: Book story URL + open/closed screenshots + live toggle probe; in-session CT output (5/5 R19 + 15/15 all-reacts); 10 untouched snapshot baselines; `git diff HEAD` of Presence dir. (CT video files were pruned from test-results/ by sibling crews' later runs.)

## Commit-ready arc (for captain — NOT committed)
- Files: `M Presence.tsx` (+187/−60), `M SPEC.md` (17/48 index), `?? Presence.test.tsx` (+336, 11 its), `?? Presence.book.tsx` (+46). Nothing else touched; branch reference-system; HEAD moved under me (slot/announcer landings) without conflict.
- Suggested commit: `test(presence): land quarantine stability + 11-case colocated suite, freeze visuals` (one commit per component per LANDING.md).

COMPLETE
