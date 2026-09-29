IN PROGRESS — FINISH-02F-OV fix crew (Overlay + Measure). Box: 90 min hard. Branch reference-system, clean tree.

### Mount cluster (02-F44 + 02-F45) — ROOT CAUSE PROVEN, one mechanism
- `packages/reference-lib/playwright/runtimes/react-17/client.ts` = `export const createRoot: undefined = undefined` — r17 CT aliases react-dom/client to a shim WITHOUT createRoot (intentional; r17 path is legacy ReactDOM.render).
- Call sites crashed unconditionally: `Measure.story.tsx:99` (iframe mount effect → all 10 fail) + `Overlay/fixtures/exotica-fixture.tsx:250-251` (twin-root effect → all 18 Exotica fail).
- Fix: Announcer/Toast-blessed `renderInto` fallback (createRoot when function, else legacy render + unmountComponentAtNode). Identical semantics on dep-change (old code also created fresh roots per run).
- 02-F44 FIXED: r19 `pnpm agentct Measure` 10/10 + unit passed; r17 FF 10/10 ×2 + r17 WK 10/10 ×2 (gallery proven GALLERY_RUNTIME=17.0.2). Logs: /tmp/finish02f-ov-measure-17-{ff,wk}.txt.

### r19 gate note (pre-existing reds, NOT mine, NOT in scope)
- `pnpm agentct Overlay` r19: 118/120 + unit 34/34. The 2 reds fail IDENTICALLY with my two files stashed (clean tree):
  - OV-DOM-01: toHaveScreenshot, 8269px ratio 0.03 — snapshot drift (baselines need human --confirm; out of lane).
  - OV-EDGE-06: `expect(finalScrollY).toBe(200)` behavioral on Chromium r19 — pre-existing, not among 02-F44..F56, out of box scope. Noted for captain.
- My change adds zero new r19 reds (r19 path is byte-identical behavior: createRoot branch).

### 02-F45 FIXED (+ unmasked LAYER-07 r17 dup)
- Same renderInto fallback applied to exotica-fixture twin-root effect → Exotica r17 FF 16/18 (was 0/18).
- Unmasked: OV-LAYER-07 `root-a-content resolved to 2 elements` (reproduced Chromium-r17 too → r17 mechanism). Root cause: effect tore down + recreated roots on every openA/openB toggle; under legacy ReactDOM the exiting OPEN portal outlives unmountComponentAtNode, fresh mount duplicates it. Fix: STABLE twin roots (create once, .render on update, unmount on unmount-only). LAYER-07 green Chromium-r17 iso.
- Exotica r17 now 17/18 both engines; sole red = OV-SCROLL-06 = owned 02-F56 (see below).
- r19 regression: `pnpm agentct Overlay` steady 118/120 + unit 34/34 (same 2 pre-existing reds, zero new).

### r17 dismiss/escape/edge class (02-F46/F47/F48/F49) — ROOT CAUSE = unstable useId shim
- `playwright/runtimes/react-17/hooks.ts useId()` returned `` `:ct${++count}:` `` FRESH ON EVERY RENDER (contract violation: useId must be lifetime-stable). Overlay keys stack layers + parentId nesting by `React.useId()` (Overlay.tsx:62,88) → every re-render added zombie layers with stale parent links → Escape deepest-first over-dismissed (F46), outside-dismiss misrouted (F47), edge index/count wrong (F48), DOM-08/09 click timeouts (F49).
- Fix: `useState(() => ...)` initializer → lifetime-stable. One-line, strictly contract-restoring.
- GOTCHA (for all crews): 'react' is in optimizeDeps.include → shim is PRE-BUNDLED into `node_modules/.vite-ct-react17/deps/`; source edit alone went stale (proven: old `:ct${++count}:` in chunk-A2PRRUYM.js; full-suite re-run still 9-red). Fix requires `rm -rf .vite-ct-react17` cache bust. Sibling crews closed already (TO dispo'd, CB closed) — no mid-flight collision.
- Post-fix r17FF main: 94/97 (was 88/97); r17WK: F46/F47/F48/F49 ALL green + F50-WK17 green. Residuals are exactly the cross-leg singles (F50/F51/F53 FF; F53/F54/F55 WK).

### 02-F53 FIXED (ref-as-prop gap, product bug in 5 Overlay parts)
- FOCUS-08: initialFocus RESOLVER reads `focus08NodeRef` set by a PUBLIC ref callback on `<Overlay.Content ref={...}>`. All 5 parts read user ref via `(props as {ref}).ref` (r19 ref-as-prop) with NO forwardRef → on r17/r18 React strips `ref` for plain function components → userRef undefined → nodeRef null → resolver null → focus falls to first tabbable, target never focused. Proved: red r17+r18 × all engines (incl. Chromium iso), green r19 × FF/WK/Chromium.
- Fix: `React.forwardRef` on Content/Trigger/Backdrop/Arrow/Handle, `userRef = forwardedRef ?? propsRef`. Same ref value on r19 (zero behavior change — r19 suite steady 118/120 + unit 34/34); restores delivery on r17/18.
- Green: Chromium r17+r18 iso 2/2; r17FF+r17WK+r18FF+r18WK full mains green ×2 each (F53 absent from all red lists).

### Singles triage
- 02-F50 LAYER-04 (FF r17+r18): `locator.dispatchEvent: TouchEvent is not defined` — FF desktop lacks the TouchEvent constructor the test's dispatch needs. H-class harness gap (same family as sweep H1). WK-r17 leg went green via useId fix. → SCOPED (test-owner: touchscreen.tap/CDP rewrite or engine gate). Repro in FINISH-02.
- 02-F51 POS-06 (FF r17+r18): product publishes live `referenceRect.width` (45px); test's later `boundingBox()` reads 44.99998474121094px — exact-string compare of two time-separated measurements of settling sub-pixel layout. Same spec-tolerance family as sweep F64. No product defect. → SCOPED (test-owner: float-tolerant compare).
- 02-F52 SCRL-01/02 (r18FF): flip-flop on IDENTICAL tree (full green ×2, iso pass ×1 + fail ×2 at :2313 right after programmatic scroll reset at :2305-2308). Queued ancestor-scroll event lands after the closeOnScroll=true open → product CORRECTLY dismisses. Test-sequencing race. → SCOPED (test-owner: settle-wait after reset; product must not grace-swallow real scrolls).
- 02-F54 FOCUS-03 + 02-F55 TRG-05 (WK all majors): toBeFocused→inactive; BOTH reproduce on r19-WK (probes) → WK-engine class, major-independent. F54 fails at :1747 immediately after `.click()` on an inside button (WK never moves focus on button click — sibling TO F18/F19/F20 identical root). TRG-05 Tab-bridge = sweep WK Tab-traversal class (F8/F12...). Cross-component D1 shape shared with RovingFocus 02-F31..36, Tooltip 02-F24..27, Popover 02-F14/15. Overlay-only patch would diverge semantics. → HELD (vehicle-level decision per brief).
- 02-F56 SCROLL-06 (r18 FF+WK + r17 masked): test constructs `new Touch()`/`new TouchEvent()` in evaluate — FF: `TouchEvent is not defined`; WK: `Illegal constructor`. Product never executes. H-class. → SCOPED (test-owner: touchscreen.tap/CDP touch or Chromium gate).
- 02-F30 Announcer (r18): CARRIED — still reproduces iso (confirmed r18FF just now); story mounts a TOAST fixture (`components/Toast/Toast/HardenShadow`) and diagnosis points Toast-side; sibling owns Toast/, and box has no room left for cross-component diagnosis. Repro: `-g "ANN-HOST-03" --project=react18-firefox` + CT_REACT=18 CT_PORT=3118.

### Observed, unlisted, pre-existing (not mine, noted for captain)
- OV-DOM-01 r19 snapshot drift (8269px/0.03) + OV-EDGE-06 r19 `finalScrollY toBe(200)` — both fail identically with my files stashed. Baselines need human --confirm; EDGE-06 behavioral needs its own crew.
- OV-HND-02 r18WK: green full-1 → red full-2 + red iso ×2 (with AND without my part edits — stash-proven NOT my regression). Slow-drag snap-back vs dismiss velocity marginal on WK. Repro: `-g "OV-HND-02" --project=react18-webkit` + CT_REACT=18 CT_PORT=3118.

## Per-finding dispositions

| ID | Verdict | Proof |
|---|---|---|
| 02-F44 Measure r17 mount | FIXED | r19 10/10 + r17 FF+WK 10/10 ×2 (gallery 17.0.2); logs /tmp/finish02f-ov-measure-17-* |
| 02-F45 Exotica r17 mount | FIXED | r17 FF+WK 17/18 ×2-3 (sole red = scoped F56); stable twin roots fixed unmasked LAYER-07 dup |
| 02-F46 ESC-01/04 | FIXED | stable useId; absent r17 FF+WK mains ×2 |
| 02-F47 LAYER-02/03/05/11 | FIXED | stable useId; absent r17 FF+WK mains ×2 |
| 02-F48 EDGE-04 | FIXED | stable useId; absent r17 FF+WK mains ×2 |
| 02-F49 DOM-08/09 | FIXED | stable useId; absent r17WK mains ×2 |
| 02-F50 LAYER-04 | SCOPED (H-class) | TouchEvent-undefined FF; WK17 green via useId fix |
| 02-F51 POS-06 | SCOPED (spec-tolerance) | 45px vs 44.99998px two-measurement compare; sweep-F64 family |
| 02-F52 SCRL-01/02 | SCOPED (test race) | flip-flop identical tree; :2313 vs :2305 scroll-reset race |
| 02-F53 FOCUS-08 | FIXED | forwardRef ×5 parts; green all 4 r17/r18 legs ×2 + Chromium iso |
| 02-F54 FOCUS-03 | HELD (D1 WK-focus) | r19-WK red; :1747 post-click; cross-component, needs vehicle decision |
| 02-F55 TRG-05 ×2 | HELD (D1 WK-focus) | r19-WK red both variants; Tab-traversal class |
| 02-F56 SCROLL-06 | SCOPED (H-class) | new Touch/TouchEvent unrunnable FF+WK; product never executes |
| 02-F30 Announcer | CARRIED | Toast-side diagnosis needed; sibling owns Toast/; box out |

Changed files (8, uncommitted per orders): playwright/runtimes/react-17/hooks.ts (stable useId) + Measure.story.tsx + exotica-fixture.tsx (renderInto/stable roots) + Overlay parts ×5 (forwardRef). r19 gate: agentct Overlay 118/120 steady (2 pre-existing, stash-proven) + unit 34/34; agentct Measure 10/10. Runtime regression sanity: Tabs r17FF 26/26. Artifact PNGs restored via checkout; tree holds only owned edits + this log.
CLOSED — fix crew done. No commits (captain verifies firsthand, commits per-arc).

## Captain verification (firsthand 2026-09-29)
- r19: Measure 10/10; Overlay 118/120 with ONLY OV-DOM-01 (snap drift) + OV-EDGE-06 (behavioral) — both stash-proven pre-existing, zero new reds.
- r17FF: Measure 10/10; Exotica 17/18 (only scoped F56 pinch); main 95/97 stable (F50 LAYER-04 + F51 POS-06 only).
- RACE EXTENSION: OV-SCRL-01/02 flip-flops on r17FF too (94→95→94 across 3 runs, iso-GREEN) — F52's scope extends from r18FF to r17FF, same test-owner settle-wait disposition.
- r17WK main 93/97: F54 + F55×2 (held) + OV-HND-02, which is iso-red AND stash-proven pre-existing on r17WK (pristine tree, same velocity-marginal signature as r18WK) — not this arc's regression. Follow-up owns HND-02 both majors.
- F53 absent from every red list I ran (r19 + r17FF/WK); crew's ×2 all-4-legs + Chromium iso stand.
- Stale `.vite-ct-react17` dep cache confirmed (old useId in chunk) and busted by captain; existing checkouts need the same `rm -rf` (harness-only, consumers unaffected).

## Resume checklist
1. Captain: verify diffs firsthand (`git diff`), commit per-arc (mount arc = Measure.story + exotica-fixture; useId arc = hooks.ts + cache-bust note; ref arc = 5 parts).
2. Vehicle decisions: WK click/Tab-focus specs (F54/F55 + RF/Tooltip/Popover/Toast same shape); touch-constructing tests on FF/WK (F50/F56); POS-06 float tolerance; SCRL-02 settle-wait.
3. Follow-ups: F30 Toast-side diagnosis (with Toast owner); HND-02 r18WK gesture-velocity marginal; r19 DOM-01 baseline + EDGE-06 behavioral (pre-existing).
4. All proof logs in /tmp/finish02f-ov-*.txt (never committed). Galleries: per-run boot, none left running; 3119 used for r19 probes.
