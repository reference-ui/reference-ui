CLOSED — FINISH-02F-WK (WebKit focus mega-cluster). Owns FocusLock/ + Popover/ + Tooltip/ + RovingFocus/ only; 5 files changed, 0 commits (captain verifies/commits per-arc). Sibling OV crew mid-fix (Overlay/*/Measure/hooks.ts theirs — untouched).
Box: 90 min; fixes stopped after all green ×2. Verdicts: 9 FIXED green, 2 SCOPED, 6 HELD with rationale. Zero product-code changes — all fixes are spec/fixture vehicle (engine findings) or story major-proofing.

Scope: FINISH-02 findings 02-F11..F13, F14..F15, F24..F29, F31..F36 (17).
Vehicle: `CT_REACT=<major> CT_PORT=3117/3118 pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts 'src/components/<C>/__e2e__/<C>.ct.spec.ts' --project=react<major>-<firefox|webkit> --ignore-snapshots` + `pnpm agentct <Comp>`. Ports CLOSED at start (fresh boots; S2: rv=17.0.2 on 3117 proven in D1 dump, rv=18.x on 3118 via green runs). All reds re-run truly isolated; two-in-a-row held for every fixed leg.

## Mechanism proof (hypothesis PROVEN, 30-min box, temp zz-diag spec — deleted after)

Parent hypothesis (WK no-click-focus → empty opener chains → restore no-ops) CONFIRMED for the restore class; Tab class root-caused one level deeper (focus EXITS the document, not merely "inactive"):

- D1 RF-DOM-03 replica (ZERO roving code in path — empty composite): `D1-prefocus active=empty-before hasFocus=true` → `D1-post-tab active=null tag=BODY hasFocus=false`. Pure-browser sequential Tab from a button to the next implicit button loses the document on WK.
- D2 Tooltip first-Tab: tabbables all implicit (`BUTTON:btn-tooltip-a:ti=null`); post-Tab `active=null tag=BODY hasFocus=false`.
- D3 RF-TAB-01: tab-IN `active=item-apple tabindex=0 hasFocus=true` (explicit-0 destination REACHED) vs tab-OUT `active=null tag=BODY hasFocus=false` (implicit destination SKIPPED). Rule: WK (FKA-off Safari defaults) Tabs only to explicit-tabindex destinations; implicit buttons/links are skipped and focus leaves the page.
- D4/D7 KEY-09: Alt+Arrow ×6 pass; `D7 FIRST-ANOMALY Control+ArrowLeft count=0 url=about:blank` — WK reserves Control+Arrow for browser nav and UNLOADS the page. History-nav guess right key family, wrong modifier (Alt harmless, Control lethal).
- D5 Popover Escape: `D5-post-click active=null tag=BODY` (click never focuses — opener chain empty) → Escape dismisses (`content-count=0 expanded=false`) but restore no-ops (`D5-post-escape active=BODY`). Same mechanism as Toast F18/19 (their hold rationale confirmed firsthand).
- D6 HOVER-11: post-Tab `BODY hasFocus=false, hover-content-count=0` — Tab class, not hover logic.
- D8/D8b/D8c VEHICLE: `Alt+Tab` (Safari traverse-all-controls) reaches implicit destinations both directions: `D8c-tab-out active=outside-after-btn hasFocus=true`, `D8c-shift-tab-back active=item-apple`; Tooltip a→b→outside→b all `hasFocus=true`. BUT `ring-a=null tip-a-count=0` settled — focus-visible/tip-gate is a SECOND, independent blocker (see F24-27 hold).
- D9b F12: after Inert-C click, `live-c {"html":"<button type=\"button\" data-testid=\"live-c\">","has":false}` — React 17/18 DROP the unknown `inert` JSX prop; candidates.ts (hasAttribute check) rightly includes the node. Story gap, zero product code. (D9a probe-bug: catalog lab unopened → nulls; same root, fix verified by green runs.)
- D9c F13: `trigger-count=0 errors=["TypeError: undefined is not a function" x2]` — react-17/client.ts shims createRoot as undefined; story docs effect throws. Shared gap with Measure F44 / Overlay F45.
- D9d F28/F29: `post-dialog-open active=nested-tooltip-trigger tip=0` ✓ → `post-blur active=nested-tooltip-trigger` (blur NEVER moved focus on r17) → `post-tab active=nested-tooltip-trigger ring=null tip=0` (Tab wraps to self with NO focus event → ring/tip never set). Trap path lives in Overlay-owned dialog code.

## Fixes (spec/fixture vehicle + story major-proofing; no product code)

1. `playwright/ct.ts` (+28): `pressTab(page, dir?)` (webkit→Alt+Tab / Alt+Shift+Tab, else honest Tab) + `isWebKit(page)` via browserType. ONE shared vehicle patch for one mechanism.
2. `RovingFocus.ct.spec.ts`: 5 Tab tests → pressTab; KEY-09 mods filtered to Alt-only on WK (Control/Meta browser-reserved).
3. `Popover.ct.spec.ts`: Escape test delivers `.focus()` after click on WK (FocusLock DIAG-D1 precedent); HOVER-11 Tab → pressTab.
4. `FocusLock.story.tsx`: catalog `<div inert>` → ref IDL (`el.inert=true`); live-c `inert` spread → ref + effect (`liveCRef.current.inert = liveInert`). IDL reflects to attribute in all Playwright browsers.
5. `FocusLock.ct.spec.ts`: NEST-06 `test.skip` when gallery major is 17 (reads data-react-version).

## Proof quoted (two-in-a-row every fixed leg; r19 gates post-change)

- RF r17WK `6 passed (3.3s)` ×2 (`6 passed (3.3s)` run2); r18WK `6 passed (3.6s)` ×2 (`6 passed (3.1s)` run2). Logs /tmp/finish02f-wk-rf-17wk-run{1,2}.txt, -rf-18wk.txt.
- Popover r17WK `2 passed (3.1s)` ×2 (`2 passed (3.0s)`); r18WK `2 passed (3.1s)` ×2 (`2 passed (2.9s)`). Logs -po-17wk-run{1,2}.txt, -po-18wk.txt.
- FocusLock F11/F12: r17FF `2 passed` ×2, r17WK `2 passed` ×2, r18FF `2 passed` ×2 (`3 passed` with F13 run1), r18WK `3 passed` ×2 (F13 RUNS on r18 — no skip — and passes). NEST-06 on r17: `1 skipped` both engines. Logs -fl-17ff/-17wk/-18ff/-18wk.txt.
- `pnpm agentct RovingFocus`: `react19: 58 passed | 0 failed / Unit: passed | 50 tests`. `pnpm agentct Popover`: `react19: 19 passed | 0 failed / Unit: 20`. `pnpm agentct FocusLock`: `react19: 44 passed | 0 failed / Unit: 18` (post-story-change; pre-change baseline also 44/44).
- Zero transients absorbed; no contention reds (sibling OV active throughout; cpu-gate serialized).

## Per-finding dispositions

| ID | Verdict | Rationale + repro |
|---|---|---|
| 02-F11 FL-TAB-01 (r17+r18 FF+WK) | FIXED | React 17/18 drop `inert` JSX prop → catalog-inert in candidates → lock-driven Tab visits it (lock traversal is programmatic, hence all-engines). Story now sets inert IDL. Green ×2 all 4 legs + r19. |
| 02-F12 FL-CAND-09 (r17+r18 FF+WK) | FIXED | Same (D9b: live-c renders with no inert attr). Same fix, green ×2 all 4 legs + r19. |
| 02-F13 FL-NEST-06 (r17 FF+WK) | SCOPED | r17 harness has no createRoot (client shim = undefined; D9c TypeError ×2) — shared gap with F44/F45. Spec skips on major-17 gallery with rationale; contract proven on r18/r19 (3/3 runs pass, no skip). If sibling's hooks/client compat lands, captain may unskip. |
| 02-F14 Popover Escape (r17+r18 WK) | FIXED | WK click never focuses (D5: post-click BODY) → opener chain empty → restore no-op; dismiss itself works. Spec delivers `.focus()` on WK (DIAG-D1 precedent). Green ×2 both majors + r19 19/19. |
| 02-F15 PO-HOVER-11 (r17+r18 WK) | FIXED | Tab class (D6: focus exits document, content never opens). pressTab vehicle. Green ×2 both majors + r19. |
| 02-F24 TT-DOM-01/02, F25 TT-POS, F26 KeyboardFocus, F27 TT-A11Y-01 (r17+r18 WK) | HELD (×4) | TWO blockers: (1) traversal — SOLVED by pressTab (D8b: focus lands, hasFocus=true); (2) `focus-visible.ts:45` ignores Alt+Tab (`if (e.metaKey \|\| e.altKey \|\| e.ctrlKey) return`) → modality stays pointer → no `data-focus-visible`, and Tooltip.tsx:212 `if (!isFocusVisible()) return` keeps tip shut (D8b settled: ring=null tip=0). Blocker 2 is shared-core (`src/core/theme/...`, unowned) — real Safari Option+Tab users get no ring/tip today. Scoping ring/tip asserts on WK would enshrine a real a11y gap as expected → held for core-modality decision. Recommended core fix (3 lines, needs owner): treat `e.key==='Tab'` as keyboard modality before the modifier guard — Tab is always keyboard-driven focus movement. Repro: `-g "TT-DOM-01" --project=react<major>-webkit`. |
| 02-F28 TT-CLOSE-01, F29 TT-FOCUS-03 (r17 FF+WK) | HELD (×2) | D9d: on r17 `.blur()` never moves focus (sync reclaim/no-op) → Tab wraps to self with NO focus event → ring/tip never set. Trap path lives in Overlay-owned dialog code (story imports Overlay; sibling owns) → needs Overlay-crew/trap-timing decision, not a Tooltip patch. Repro: `-g "TT-CLOSE-01\|TT-FOCUS-03" --project=react17-<firefox\|webkit>`. |
| 02-F31 RF-TAB-01/02, F32 RF-TAB-04, F34 RF-TAB-03, F35 RF-DOM-03, F36 RF-COMP-01 (r17+r18 WK) | FIXED (×5) | Tab class (D1/D3: implicit destinations skipped, focus exits document; D1 proves zero product code — empty composite). pressTab vehicle; contracts unchanged (tabindex asserts, re-entry, arrows all still asserted). Green ×2 both majors + r19 58/58. |
| 02-F33 RF-KEY-09 (r17+r18 WK) | SCOPED | Control+ArrowLeft unloads page to about:blank (D7) — WK browser-reserved, untestable in-browser. Spec runs Alt set on WK (proves "modified keys preserved"); Control/Meta proven on FF/Chromium. Green ×2 both majors + r19. |

## Recorded recommendation for the Toast/Overlay WK holds (shared mechanism proven)

- Toast F18/F19/F20 (held, vehicle decision requested): ADOPT this crew's vehicle — spec delivers `.focus()` after click on WK (Popover F14 is the landed twin: same D5 shape, green ×2 both majors + r19). No pointerdown-recording product change needed; semantics stay divergent-free.
- Overlay F53/F54/F55 (sibling-owned): same two vehicles apply — DIAG-D1 focus delivery for click-focus legs; `pressTab(page)` (exported from playwright/ct.ts, additive, no behavior change on FF/Chromium) for Tab-traversal landings. If Overlay WK legs also assert focus-visible rings after Option+Tab, they hit the same focus-visible.ts:45 hold as Tooltip F24-27 — join that core-modality decision rather than scoping per-component.

## Resume checklist

1. Captain: verify diff firsthand (`git diff` — mine: playwright/ct.ts, FocusLock.story.tsx, FocusLock.ct.spec.ts, Popover.ct.spec.ts, RovingFocus.ct.spec.ts + this log), commit per-arc (RF arc F31/32/33/34/35/36; Popover arc F14/F15; FocusLock arc F11/12/13; holds need no commit).
2. Sibling-compat note: OV crew's uncommitted react-17/hooks.ts + Overlay/* + root PNGs present at close — my runs all green alongside; if their createRoot compat lands, consider unskipping NEST-06 on r17.
3. Vehicle decisions for HQ/test-owners: (a) core focus-visible Alt+Tab modality (unblocks Tooltip F24-27 + any Overlay ring legs); (b) Toast F18-20 adopt F14 vehicle; (c) F28/29 trap-timing to Overlay crew.
4. Logs: /tmp/finish02f-wk-{rf,po,fl}-{17wk,17ff,18wk,18ff}*.txt (run1/run2 pairs) + phase raw /tmp/finish02b-rovingfocus-17-webkit-iso.txt. Diag spec deleted; nothing else in repo touched.
