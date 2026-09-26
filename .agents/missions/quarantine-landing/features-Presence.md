# Presence FEATURES crew log

Mission: Presence FEATURES #1 — GSAP completion wait (decided: DELETE).
Branch: reference-system (stay; never switch; never commit).
Scope: touch ONLY `packages/reference-lib/src/components/Presence/` + this log. Read-only elsewhere.

## Inputs read (first pass only)
- `.agents/missions/quarantine-landing/features-triage.md` Presence section (lines 100-101): "#1 GSAP completion wait — IMPLEMENT-NOW decided delete: no proven in-repo consumer; a third-party lib has no place in the exit contract."
- `packages/reference-lib/src/components/Presence/FEATURES.md` item 1: keep-exit-mounted-until-finite-GSAP-tweens vs delete `finiteGsapTweens` + branches; maintainer lean delete; rumored consumer: Collapsible measured-height work (unproven).
- `docs/MISSIONS/API-STANCE.md`: breaking NOW, no shims, simplest forever-contract wins.

## CHECKPOINT — plan (written before further reads)
1. Grep-verify zero in-repo GSAP consumers of Presence:
   a. `finiteGsapTweens` references repo-wide (expect Presence-only).
   b. `gsap` references repo-wide (imports, tween props, docs rumors).
   c. Collapsible measured-height rumor: grep Collapsible dir for gsap/tween.
   Decision gate: delete ONLY if zero in-repo consumers confirmed; else STOP + flag.
2. Incremental read: Presence.tsx exit path + Presence.md/SPEC/DECISIONS GSAP mentions (one file at a time, log line between).
3. Delete: `finiteGsapTweens` helper + every branch consulting it + doc contract traces; no shim (breaking NOW per stance). Presence is headless exit infra — expect zero snapshot changes; STOP+flag if any change.
4. Proof: read test-component skill, then `pnpm agentct Presence` (unit+e2e green).
5. UX: nested ux-designer review (read skill first; pool-full → self-review by method + flag).
6. Report: landed/blocked, test evidence, UX verdict, exact files changed, flags.

## Log
- Tick 1: first-pass reads done (triage Presence section + FEATURES.md + API-STANCE.md). Branch verified `reference-system`, Presence tree clean. Plan checkpointed above; proceeding to grep gate.
- Tick 2: grep `finiteGsapTweens` repo-wide → hits in `motion/gsap.ts` (def), `motion/index.ts` (re-export), Presence.tsx (2 use sites), Presence SPEC/FEATURES docs, AND Collapsible.tsx (import + 1 use site). Collapsible rumor CONFIRMED as direct helper consumer — must now determine whether it consumes Presence's GSAP wait (composition) or only the shared helper. Next: repo-wide `gsap` grep.
- Tick 3: repo-wide `gsap` grep (packages/) → meaningful hits ONLY in `motion/gsap.ts`, `motion/collapse.ts`, `motion/index.ts`, Presence.tsx, Collapsible.tsx (+package.json dep + tsup noExternal). No other component imports gsap or the helper. Noise: icons-metadata matched "settingsapplications" (irrelevant). Next: does Collapsible compose Presence?
- Tick 4: Collapsible DOES compose Presence (`Collapsible.tsx:413 <Presence present={context.isOpen}>`) AND uses gsap directly (import line 7, `finiteGsapTweens` guard line 332, `killTweensOf` line 354). Gate question is now precise: does Collapsible start finite GSAP tweens on the exiting element Presence watches, making Presence's GSAP-wait branch load-bearing? Or does Collapsible kill/guard its tweens independently? Next: read Collapsible.tsx gsap region (read-only).
- Tick 5: Collapsible.tsx:311-356 read. `CollapsibleContentPanel` runs `animateCollapse(node, {open: isOpen, ...})` in a layout effect on `isOpen` change, on the SAME node Presence wraps (child of `<Presence present={isOpen}>`). `finiteGsapTweens(node)` at line 332 is only a ResizeObserver stutter guard; `killTweensOf` at 354 is effect cleanup. The load-bearing question moves to `motion/collapse.ts`: does the CLOSE path start a finite GSAP tween on that node? Next: read `motion/collapse.ts` + `motion/gsap.ts` (read-only).
- Tick 6: `motion/collapse.ts` read — SMOKING GUN. Header comment (lines 11-12): "Height-collapse used by Collapsible (and Accordion through it). Presence observes these tweens and holds the node until they finish." Close path (`open:false`, lines 85-95) returns a finite `gsap.to(element, {height:0, ..., duration, ease:'power2.out'})` on the exiting node. Triage premise "no proven in-repo consumer" is FALSE: Collapsible is a proven consumer, Accordion transitively. Gate outcome leans STOP+flag; next: read `motion/gsap.ts` helper def + Presence.tsx exit branches to nail the mechanism precisely before filing the block.
- Tick 7: `motion/gsap.ts` read. `finiteGsapTweens(el)` = active, unpaused, incomplete, positive-duration tweens on the element; collapse close tween (0.32s, `power2.out`, unless reduced-motion→0) qualifies. Next: read Presence.tsx exit branches (lines ~250-300, ~430-480).
- Tick 8: Presence.tsx:240-298 read. Exit gate: `hasFiniteGsap = !prefersReducedMotion && finiteGsapTweens(el).length > 0` (line 279); if NO finite CSS animation AND NO finite transition AND NO finite GSAP → immediate `unmounted` (line 288). Collapsible close sets inline height via GSAP only (no CSS transition/animation on the node) → without the GSAP branch, Collapsible close would unmount immediately, cutting the 0.32s height animation. Mechanism nailed on the gate side; next: second use site (~line 440-480, the completion waiter).
- Tick 9: Presence.tsx:420-474 read. Completion waiter (lines 451-457): `Promise.all(gsapTweens.map(t => t.then())).then(() => handleExitComplete())` — Presence unmounts exactly when the finite GSAP tweens resolve. Both consumer-side mechanisms confirmed (gate + waiter). Two loop-closers left: (a) confirm Collapsible node has NO independent CSS exit transition/animation that would hold Presence open anyway; (b) confirm Accordion→Collapsible composition for the transitive claim. Next: grep Collapsible dir for transition/animation CSS.
- Tick 10: literal-vs-regex trap caught and corrected (first two CSS greps used literal alternation → false zero; re-ran as regex). Only `transition` in Collapsible.tsx is line 204: the Trigger chevron's `transform 0.2s` rotate — NOT on the exiting Content node. Content panel (lines 378-390) carries no CSS transition/animation; close motion is purely the GSAP height tween. Loop-closer (a) CONFIRMED: the GSAP branch is the SOLE holder of the Collapsible close exit. Next: Accordion→Collapsible composition grep.
- Tick 11: Accordion→Collapsible CONFIRMED (`Accordion.tsx:8` imports Collapsible, `:40` renders `<Collapsible>` items; SPEC "each item is a Collapsible"). Loop-closer (b) done. Gate verdict: **BLOCKED — STOP per orders.** Zero-consumer premise disproven; deleting would cut Collapsible/Accordion close animation. Filing verify-block below; no code touched.

## VERDICT: BLOCKED (verify-block, STOP per gate)

**Item:** Presence FEATURES #1 — GSAP completion wait (triage: IMPLEMENT-NOW decided DELETE, premise "no proven in-repo consumer").
**Outcome:** NOT deleted. Gate condition FAILED — proven in-repo consumers exist. Per crew orders ("delete only if confirmed, else STOP and flag"), all implementation STOPs here. Zero Presence files changed.

**Precise evidence (consumer chain, all verified by read):**
1. `packages/reference-lib/src/motion/collapse.ts:11-12` — contract documented in-repo: "Height-collapse used by Collapsible (and Accordion through it). Presence observes these tweens and holds the node until they finish."
2. `motion/collapse.ts:85-95` — CLOSE path (`open:false`) starts a finite `gsap.to(element, {height:0, paddingTop:0, paddingBottom:0, duration:0.32, ease:'power2.out'})` on the content node.
3. `Collapsible.tsx:413` — `<Presence present={context.isOpen}>` wraps `CollapsibleContentPanel`; the GSAP-tweened node IS Presence's exiting child. Panel starts the tween in a layout effect on `isOpen` change (`:339-356`).
4. `Presence.tsx:279` — exit gate: `hasFiniteGsap = !prefersReducedMotion && finiteGsapTweens(el).length > 0`; lines 281-293: no CSS anim + no CSS transition + no GSAP → immediate `unmounted`.
5. `Presence.tsx:451-457` — completion waiter: `Promise.all(gsapTweens.map(t => t.then()))` → `handleExitComplete()`; Presence unmounts exactly when the collapse tween resolves.
6. No CSS fallback: only `transition` in Collapsible.tsx is the Trigger chevron rotate (`:204`); Content panel (`:378-390`) has no CSS transition/animation — GSAP branch is the SOLE exit holder.
7. Transitive: Accordion items are Collapsibles (`Accordion.tsx:8,40`; SPEC `:34` "each item is a Collapsible") — Accordion inherits the dependency.

**Predicted breakage if deleted:** Collapsible close (and every Accordion item close) would hit the line-281 immediate-`unmounted` path — the 0.32s measured-height close animation cut to an instant vanish; `animateCollapse`'s tween orphaned and killed by effect cleanup (`Collapsible.tsx:354`). Also contradicts the documented contract in `collapse.ts:11-12`.

**Flag for captain/HQ:** triage premise "no proven in-repo consumer" is factually incorrect — the FEATURES.md "rumored" Collapsible consumer is real and load-bearing. Triage line for Presence #1 needs re-decision: either (a) HOLD/DECLINE the delete and bless the GSAP wait as the documented exit contract (the FEATURES.md alternative, incl. `Presence.md` doc + `PR-*-GSAP` proof case), or (b) re-scope as a joint Presence+Collapsible migration (replace GSAP close with CSS/WAAPI exit, then delete) — NOT a Presence-local delete. Recommend (a): the contract is already documented at the producer site and has two component consumers.

**Proof/UX:** N/A — nothing changed, so no `agentct` run and no UX review were triggered (no behavior/visual delta to prove or review). Presence dir untouched; `git status` clean apart from this log.
**Files changed:** this log only (`.agents/missions/quarantine-landing/features-Presence.md`). Presence dir: zero changes.
