IN PROGRESS — RED-TT (Tooltip r19 pair). Owns Tooltip/ + Overlay/ trap/dialog code only. Box: 90 min hard.

## T+15: baseline + D9d RE-PROVEN on r19 (temp zz-diag spec)
- `pnpm agentct Tooltip` → `E2E: 15 | Passed: 13 | Failed: 2 / react19: 13 passed | 2 failed / Unit: passed | 3 tests` (log /tmp/red-tt-baseline.txt). Reds exactly TT-CLOSE-01 (`toBeVisible` tip) + TT-FOCUS-03 (`toHaveAttribute data-focus-visible`).
- Diag (log /tmp/red-tt-diag2.txt):
  - `post-dialog-open active=nested-tooltip-trigger ring=false tip=0 hasFocus=true`
  - `post-blur active=nested-tooltip-trigger ring=false tip=0 hasFocus=true` (blur NEVER moved focus)
  - `EVTS-BLUR ["blur","focus","focusin","focusin-doc:nested-tooltip-trigger"]` (sync reclaim, same tick)
  - `EVTS-ALL [...,"keydown-tab"]` (Tab wraps to self, ZERO focus events) → `post-tab ring=false tip=0`
- Mechanism chain (all read firsthand): `.blur()` → FocusLock `handleFocusOut` (relatedTarget=null) → `reclaimToFallback()` → sync `safeFocus(trigger)` [FocusLock.tsx:506-526,453-463]; Tab → `handleKeyDown` preventDefault + `safeFocus(first===active)` early-return [FocusLock.tsx:416-451,83-87]. Downstream correct: ring only on focusin [focus-visible.ts], tip only on React onFocus+isFocusVisible [Tooltip.tsx:209-218].
- Hypothesis dispositions: H1 Overlay-props fix DEAD (Content.tsx only renders FocusLock, no prop alters wrap/reclaim); H2 Tooltip-opens-on-Tab DEAD (wrong layer + ring unset in shared core); H3 FocusLock reclaim-timing change OUT OF BOX (FocusLock.tsx is neither Tooltip/ nor Overlay/); H6 untest-context tricks (initialFocus=false etc.) REJECTED as weakening.
- H4 LIVE (in-box vehicle, WK-crew precedent): single-tabbable trap + sync reclaim make the spec's assumed blur-out/Tab-back trajectory nonexistent — no product bug, vehicle must produce a REAL keyboard focus arrival. Add 2nd (sr-only, zero-pixel) tabbable to NestedOverlay + Tab-away/Shift+Tab-back via pressTab (dir-aware, WK-safe). Contracts preserved: CLOSE-01's blur+Tab is setup (Escape is the assert); FOCUS-03's "open on Tab with a ring" becomes MORE honest (real Shift+Tab arrival vs blur trick).

## T+30: H4 implemented — FOCUS-03 green; CLOSE-01 behavioral green, ONE stale baseline
- Files: `Tooltip.story.tsx` (+22: `nested-dialog-sr-next` sr-only button after the Tooltip; absolute/1px/clipped/borderless = zero painted pixels) + `Tooltip.ct.spec.ts` (both tests: blur+Tab → `pressTab(page)` / assert sr-next focused / `pressTab(page,'back')`; pressTab already imported by MOD crew). Zero product code.
- `sync` run per skill CAUTION: no stylesheet diff (inline-style-only change, as predicted).
- Iso (log /tmp/red-tt-fix1.txt): TT-FOCUS-03 PASSED; TT-CLOSE-01 fails ONLY at `toHaveScreenshot(nested-dialog-tooltip-open.png)` — `620 pixels (ratio 0.01)` — all behavioral asserts (tip visible, Escape→tip gone + dialog stays) pass.
- Viewed firsthand: diff PNG = trigger outline only (the focus-visible ring); actual = tip open WITH ring (correct TT-FOCUS-01 state); old baseline = tip open with NO ring.
- Archaeology: baseline adopted in c983e676f, PREDATES the focus-visible gate (4cdee7af7 `gate focus-open on focus-visible`). Under the current product, keyboard-arrival tip-open ⟺ ring NECESSARILY (ring set on focusin w/ keyboard modality; no trajectory opens the tip ringless — hover-split or attribute-stripping hacks rejected as weakening). Old baseline depicts an unsatisfiable state → stale, adoption is the only path.
- Policy: did NOT run `--update-snapshots` (human-gated; cannot self-confirm) and did NOT game the trajectory. Dismissed baseline already shows the ring → `nested-dialog-tooltip-dismissed` matches post-adoption (no second churn expected).

## T+60: proof complete — verdicts
- r19 full ×2: `E2E: 15 | Passed: 14 | Failed: 1 / react19: 14 passed | 1 failed / Unit: passed | 3 tests` (logs /tmp/red-tt-full1.txt, /tmp/red-tt-full2.txt) — sole red is the stale open-snap, identical 620px both runs. TT-FOCUS-03 green 3× (iso+full+full).
- Back-major legs (FINISH-02 vehicle, fresh ports 3127/3128, --ignore-snapshots): r17WK `2 passed` (/tmp/red-tt-17wk.txt), r17FF `2 passed` (/tmp/red-tt-17ff.txt), r18WK `2 passed` (/tmp/red-tt-18wk.txt), r18FF `2 passed` (/tmp/red-tt-18ff.txt). The HELD F28/F29 r17 FF+WK legs are GREEN under the new vehicle (pressTab WK chords traverse natively; trap ignores modified Tab; DOM order trigger→sr-next cooperates).
- Zero transients absorbed; sibling RovingFocus/Menubar files in-tree throughout, never touched. Temp diag spec deleted. Sweep ports closed post-run.

## Per-finding dispositions
| ID | Verdict | Rationale + repro |
|---|---|---|
| TT-FOCUS-03 (r19 + r17/r18 FF+WK) | FIXED green | Vehicle fix (above); ring+tip asserted in-path, unscoped. Green 3× r19 + 2/2 all four back-major legs. |
| TT-CLOSE-01 behavior (r19 + r17/r18 FF+WK) | FIXED green | Same vehicle; tip-visible + Escape-dismissal asserts pass everywhere (r19 3× identical, back-majors 2/2). |
| TT-CLOSE-01 `nested-dialog-tooltip-open.png` (r19 only) | ADOPTION-PENDING (captain) | Baseline stale (predates focus-visible gate; depicts impossible tip-without-ring). Delta viewed firsthand = ONLY the contract-mandated ring. Needs captain firsthand verify + `pnpm agentct Tooltip --e2e --update-snapshots --confirm`, then re-run to 15/15. NOT a hold of the fix; human-gated file write only. |
| 02-F28/F29 hold (r17 FF+WK) | SUPERSEDED green | Same two tests; previously held on D9d trap-timing. New vehicle produces real focus arrivals on all majors/engines → hold rationale dissolved; recommend close on adoption. |

## Resume checklist
1. Captain: verify diff firsthand (`git diff` — mine: Tooltip.story.tsx, Tooltip.ct.spec.ts + this log; sibling RovingFocus.tsx + Menubar ZZDiag NOT mine), view actual/diff PNGs cited above, run the adoption command, re-run `pnpm agentct Tooltip` to confirm 15/15, commit per-arc.
2. Expected post-adoption: TT-CLOSE-01 fully green incl. dismissed snap (baseline already ringed); no other snapshot churn (sr-only control paints zero pixels; all other 13 tests green throughout).
3. Logs: /tmp/red-tt-baseline.txt, -diag1.txt, -diag2.txt, -fix1.txt, -full1.txt, -full2.txt, -17wk.txt, -17ff.txt, -18wk.txt, -18ff.txt. Test-results dirs hold actual/diff PNGs + videos.
4. No product code touched → no wide re-proof (Overlay/FocusLock/Popover) triggered; no FocusLock change proposed (sync reclaim + self-wrap are correct trap behavior).
