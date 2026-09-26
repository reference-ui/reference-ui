# Splitter FEATURES cluster A — API contract

Mission: reference-ui. Branch: reference-system (never switch, never commit).
Scope: FEATURES #1 (required controlled value + Root contract), #2 (Panel min/max + DOM-order registration), #12 (root disabled REMOVE), #10 (5% floor pin). NOT #3–#9 (cluster B), NOT HOLD #11.
Guardrails: visuals frozen; any snapshot change needs view-story inspection + UX sign-off else STOP+flag. Prove with pnpm agentct Splitter. Nested ux-designer review of API delta.
Touch-only: Splitter dir + this log (+ in-repo Splitter-consumer call sites ONLY for #1/#2 migration, listed).

## Log
- [START] session opened on reference-system; skills read (test-component, ux-designer); Splitter dir clean per git status
- [PLAN] recon done: target = Splitter.md Proposed API; order via registration+compareDocumentPosition (quarantine c7bdd1f7c pattern, re-targeted not copied); min/max typed number|string with strings falling back + dev diagnostic until #3 (cluster B seam = toSolverConstraints); SSR/first-frame = safe fallbacks (size 50, ARIA 50/0..100), corrected pre-paint by layout effects; only in-repo consumer outside dir = Showcase.book.tsx
- [START] #1 required controlled value + Root contract (value required; DELETE defaultValue/disabled/display/flexDirection; onChange/onChangeEnd semantics kept, uncontrolled branches deleted)
- [START] #2 Panel min/max + DOM-order registration (min/max number|string; DELETE index; flex overrides omitted from Panel/Handle surface)
- [START] #12 root-level disabled REMOVE (Root prop + data-disabled + group inheritance deleted; per-Handle disabled stays)
- [START] #10 default min floor KEEP 5% (constant kept + comment; pin with test next)
- [LAND-impl] #1+#2+#12 in Splitter.tsx: required value; registration+compareDocumentPosition order; toSolverConstraints seam (strings warn+fallback); unregistered safe ARIA; Root data-disabled gone
- [LAND-impl] consumer migration: Splitter.story.tsx (60 index, 12 min/max, Lifecycle disabled→Handle), Splitter.book.tsx (14 index, 3 defaultValue→useState), Showcase.book.tsx DataLayoutRow (defaultValue→useState + index removal) — the only in-repo consumer outside the dir
- [LAND-impl] tests: Splitter.contract.test.tsx rewritten (new SP-TYPE-01 + SSR-safe SP-ENV-01 + 2 client registration pins); CT +1 floor slice (FEATURES #10)
- [BEFORE-TEST] running pnpm agentct Splitter --unit first (type errors need tsc; vitest strips types — will run lib typecheck too)
- [AFTER-TEST] unit 18/18 green (14 math + 4 contract incl. 2 new client-registration pins); tsc: 0 Splitter errors (18 total all in other crews' in-flight files: Field/Icon/NumberField/Slot/Showcase-non-Splitter/playwright-ct) — all 15 @ts-expect-error pins hold, migrated call sites compile
- [BEFORE-TEST] running pnpm agentct Splitter --e2e (React 19 + snapshots; visuals frozen — any diff = STOP+view-story+UX)
- [AFTER-TEST] e2e React19 37/37 green (36 prior + 1 new floor slice; all 7 snapshots unchanged = zero visual drift); React17 37/37 + React18 37/37 green (behavioral, snapshots no-op off 19)
- [START] artifact inspection (CT video) + nested ux-designer review of the API delta
- [LAND] artifact inspection: floor-test finished screenshot viewed (95%/5% End state correct, focus ring + thumb visible); .webm not viewable in this harness (binary) — motion unchanged this cluster, all snapshots green
- [LAND] nested ux-designer review: VERDICT SHIP IT — look PASS (nothing moved; Root data-disabled loss has no paint hook), all 5 feel deltas approved (uncontrolled removal + Root-disabled removal with stated author-side costs, DOM-order + SSR-fallback + 5%-floor as improvements/no-change), a11y pass with 1 pre-existing open question carried (aria-disabled call = cluster B #7)
- [LAND] #1 required controlled value + Root contract — value required; defaultValue/Root-disabled/display/flexDirection deleted; onChange per-change + onChangeEnd once-per-interaction kept (proven by 37 CT incl. Rejecting/SP-END paths)
- [LAND] #2 Panel min/max + DOM-order registration — min/max number|string, index deleted, flex/flexGrow/flexShrink/flexBasis omitted from Panel/Handle surface; strings warn+fallback via toSolverConstraints (cluster-B #3 seam)
- [LAND] #12 root-level disabled REMOVE — prop + data-disabled + group inheritance deleted; per-Handle disabled path retained (Lifecycle story migrated to Handle-level)
- [LAND] #10 default min floor KEEP 5% — constant kept, pinned by new SP-DOM-03 CT slice (Home→5/95, End→95/5) + existing ARIA bound assertions; SPEC.md updated
- [DONE] cluster A complete: 4/4 items landed, 0 blocked; unit 18/18, CT 37/37 (r19) + 37/37 (r17) + 37/37 (r18), tsc 0 Splitter errors, UX ship-it; branch reference-system untouched (no switch, no commit)
- [FLAG] Showcase.book.tsx carries concurrent Tabs-crew hunks (Tabs.recipes migration, disjoint from my DataLayoutRow hunk — verified intact); the 18 lib tsc errors are all in other crews' in-flight files, 0 in Splitter
