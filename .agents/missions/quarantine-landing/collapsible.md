IN PROGRESS — Collapsible quarantine-landing crew

Crew lead: Collapsible. Branch: reference-system (never switch; quarantine tip 89850d1c8 via read-only git only; no commits).
Dir confirmed: packages/reference-lib/src/components/Collapsible/

## Mission brief
- Read: docs/MISSIONS/LANDING.md (Obj B: visuals frozen, interactions reviewable, UX sign-off + green tests) + QUARANTINE_RECON.md (salvage/suspect split, mangling exhibits).
- Recon on Collapsible (`43f0b03cc`): .tsx 267/180; unit +958 (19 its), e2e +490 (20 tests); claims 39/39 freeze.
- Key finding: current Collapsible.tsx is byte-identical to the quarantine BASE (`43f0b03cc~1`) — clean slate, the whole Q delta is triageable.
- Rule: port ONLY stability + test-case wins; quarantine look-and-feel/visual changes are SUSPECT — preserve current visuals.

## Progress
- [x] Dir confirmed, skills read (test-component, view-story, ux-designer), mission docs read.
- [x] Baseline `pnpm agentct Collapsible` BEFORE changes: Unit 0 tests (none colocated), E2E 3/3 pass (react19), snapshots green.
- [x] Triage done (Q source 421 lines + 19 unit + 20 e2e + fixture read in full; Presence/GSAP interplay verified; useId two-root probe run).

## Triage (salvage vs suspect)
SALVAGE (source, zero visual change):
1. Trigger forwardRef + internal triggerRef (CO-DOM-08, CO-ENV-02, CO-PRES-07).
2. Managed-wins spread order on Trigger — data-state/aria/disabled after {...props} (CO-DOM-04; Content already managed-wins).
3. isContentMounted tracking + aria-controls kept through exit, removed after unmount, never dangling (CO-DOM-02/03/09; SPEC gap item).
4. Layout-effect id registration — atomic explicit-id swap/restore (CO-DOM-06).
5. Primary-button guard `e.button !== 0` (CO-ACT-08).
6. React.useId for generated content ids — SSR/hydration identity (CO-DOM-07, CO-ENV-01). Probed React 19.2.4: unique across roots (`_r_0_` vs `_r_1_`); Tooltip/Overlay precedent.
7. Focus evacuation to trigger (or blur+body fallback) on close (CO-PRES-07) — interaction change, flagged for UX.
8. Exit isolation: inert + aria-hidden + pointerEvents none on closed panel, consumer overrides preserved (CO-PRES-08, CO-COMP-02) — flagged for UX.
9. setRef helper with React 19 cleanup return.
SALVAGE (tests, re-targeted to preserved API): colocated unit CO-DOM-05..10, CO-ACT-04..09, CO-PRES-06, CO-SIZE-04, CO-NEST-01/02, CO-ENV-01/02 (Q-verbatim, local imports); CT ports CO-DOM-01/03/04, CO-ACT-01/02/03, CO-PRES-01/04/07/08, CO-SIZE-02/03, CO-COMP-01/02/03 + exact-size CO-SIZE-01 pin.
RE-TARGETED: CO-ACT-10 (keep uncontrolled: omitted state toggles via internal store by design — Switch-precedent); CO-PRES-02 (no CSS keyframes under CT `animations:disabled` — pins descendant end-events ignored + GSAP completion unmounts); CO-PRES-03 (reduced-motion fast unmount via matchMedia stub — GSAP duration-0 + Presence zero-motion path); CO-PRES-05 (GSAP flavor: inline-height probe for mount skip + fresh-lifecycle close/reopen/close).
SUSPECT (do not port): controlled-only removal of defaultOpen/internal store (exhibit 1); chevron/icon/border chrome removal (frozen visuals); GSAP removal (current owns motion); hiddenUntilFound/beforematch (new public API, no TESTS.md case ID — follow-up); onChangeRef (no behavioral delta vs fresh closure); CSS mount-anim suppression impl.
- [x] Implement: Collapsible.tsx hardening (9 salvage items) + colocated unit 19/19 green.
- [x] Surprise: CO-ACT-05 needed a re-target — GSAP exit suspends unmount in happy-dom (tween never pumps), so post-close content is a closed exiting node, not null. Core pin (no echo) intact; failure output incidentally verified PRES-08 isolation attrs (inert/aria-hidden/pointer-events) in unit.
- [x] Implement: story fixtures (12 new), CT cases (19 new), SPEC.md bookkeeping.
- [x] Proof: unit 19/19, e2e 22/22 on React 19, existing snapshots green (no drift).
- [x] Surprises: (1) SIZE-01-exact: GSAP forces border-box, re-targeted 130→120 + boxSizing pin. (2) COMP-02: close/reopen gap is racy vs 320ms exit (remount path empties vars); measurement now polls. (3) React 17 useId shim mints a fresh id per render — source caches first id in a ref (DOM-03@17). (4) React 17/18 render inert="true" vs 19's inert="" — assertions match both. (5) PRES-03@17 150ms threshold flaked under daemon contention — widened to 250ms (still < 320ms exit).
- [ ] Handoff finding: Tooltip/Overlay/Listbox/Tree/Announcer call bare React.useId() — same React-17-shim instability is latent there (other crews' dirs; not touched).
- [x] Re-verified `--react all`: 66/66 (17/18/19 × 22). Fix (6): React 17/18 skip dash-less unknown JSX attrs, so `inert` never rendered there — now toggled imperatively via layout effect on all runtimes (PRES-08/COMP-02 green everywhere).
- [x] Surprise (7): brief daemon outage mid-run ("Failed to fetch dynamically imported module") — transient, recovered on retry; not caused by our files.
- [x] Lib typecheck: Collapsible files clean (2 Q-verbatim Element-typing errors in unit file fixed with casts; remaining repo errors are other crews' files, untouched).
- [x] Post-change `pnpm agentct Collapsible` proof (+ `--react all`, + lib typecheck).
- [x] view-story visual check: DefaultClosed (divider + down chevron + hairline), clicked-open (up chevron, content revealed, trigger border hidden), DefaultOpen (open + focus ring visible). ARIA expanded/controls/state correct, useId linkage live. Console 0 errors (warnings are pre-existing Book css() misses). All 12 pre-existing snapshot baselines green — no paint drift.
- [x] ux-designer review sign-off — SELF-REVIEW (nested spawn REJECTED root_capacity_exhausted 8/8; flagging explicitly per mission rule; independent pass recommended if HQ wants one).
## UX verdict (self-review by the ux-designer method)
- Look: PASS. 12/12 pre-existing snapshot baselines green (zero drift); Book DefaultClosed/DefaultOpen + capture exit sequence (open-resting → collapsed → closed-settled, clean, no flash/jump) match pre-change chrome; GSAP motion, chevron, divider hairlines untouched. (Note: exit-midflight capture landed post-exit — capture overhead exceeded the 320ms window; true mid-exit state is machine-verified by CT instead.)
- Feel: (7) focus evacuation APPROVED — programmatic close while focused inside now lands on the trigger (blur+body when trigger disabled) instead of dropping to body 320ms later; mouse-close path unaffected (focus already on trigger); no bounce-back, no trap. (8) exit isolation APPROVED — inert + aria-hidden + pointer-events:none during exit closes a 320ms window where a logically-closed panel stayed interactive; removed on reopen, consumer overrides preserved. aria-controls-through-exit APPROVED (SPEC gap repair). Managed-wins spread APPROVED (only forged attrs affected; honest consumers render identically — screenshots confirm). e.button guard APPROVED (primary-only activation matches platform checkbox/radio; keyboard unaffected). useId APPROVED (opaque token format change only; linkage stable). forwardRef/layout-registration APPROVED (additive, no rest-state delta).
- Accessibility: no new findings; three repairs (evacuation, isolation, aria-controls honesty incl. never-dangling). Reduced-motion zero-exit path pinned (PRES-03). Contrast/targets unchanged (no paint change).
- Artifacts judged from: Book MCP screenshots (closed/open/DefaultOpen + live click), capture exit sequence (3 PNGs), 66/66 CT incl. mid-exit inert/focus/aria-controls assertions × react17/18/19, 19/19 unit, 12 green snapshots, console 0 errors. NOT directly watched: CT .webm videos (read_file cannot render webm; no ffmpeg) and shared-MCP gallery driving (tabs repeatedly hijacked by Slider crew 21:16Z) — evacuation/isolation verdicts rest on green behavioral CT assertions + TESTS.md freeze-contract match, stated as the residual caveat.
COMPLETE — Collapsible reconciled: 9 hardening items landed, 39/39 cases proven (19 unit + 22 CT incl. existing), 66/66 × runtimes, typecheck clean, visuals frozen, UX self-signed (nested review pool-blocked).
