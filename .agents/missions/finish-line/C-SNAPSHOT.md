IN PROGRESS — C-SNAPSHOT flip crew (tolerance policy + regen + per-browser adoption). Branch reference-system, box 90 min. Runner only. NEVER commit.
Started: 2026-09-29 (UTC).

Brief: FINISH.md change-control 2026-09-29 (C-SNAPSHOT → 5a-modified + P6 explicit 19-only) + FINISH-04 CAPTAIN'S RULING (ADOPT per-browser r19 baselines, sequenced now). ONLY crew running — baselines are mine alone. Scope: snapshot/config surfaces ONLY (playwright config, per-call tolerances, __snapshots__ dirs, snap() vehicle if interim path needs it). NEVER component product logic, stories, or test assertions.

Evidence read: FINISH-07.md (0.001 rec + headroom math + 11-red flip-day list), FINISH-04.md (diff table + exact regen vehicle item 3 + drift sets), tolerance.md (audit P1–P5 + trio edits 2–4), FINISH-02F-OV.md (OV-DOM-01 8269px/0.03 pre-existing; brief adds captain eyeball APPROVAL: F53 warning-banner strip only).

## T+00 — kickoff
- Config target: `maxDiffPixelRatio: 0.02 → 0.001` in packages/reference-lib/playwright/playwright.config.ts + P6 comment (snapshots 19-only by design, snap() no-ops off-r19, no per-major baselines).
- Trio: FocusLock 3× 0.15 page snaps → ≤25px locator snaps or drop (audit edits 2–4).
- TOL-ban: no per-call ratio ≥0.01 without `// TOL:` comment naming noise source.
- Chromium regen + eyeball gate: FINISH-07 flip-day 11 (NF 5 probable NFLAST drift, Toast 5 nondet suspects, fl-live-open) + Field drifted set (≤5693px) + Collapsible 411px coherent set + OV-DOM-01 (APPROVED: F53 warning-banner strip only).
- Per-browser adoption (r19 only): FF + WK baselines via FINISH-04 exact vehicle (CT_REACT=19 CT_PORT=3119, snapshotPathTemplate {projectName} token), sets: Presence, Portal, Menubar first, then rest per 04 priority.
- Proof: every changed component re-green `pnpm agentct <Comp>` r19 full + unit; 11 flip-day reds + trio + DOM-01 explicitly green; no new reds (broad r19 sweep ≥ all 15 FINISH-01 components + Overlay/Measure/Announcer/Tooltip/Toast/FocusLock/RovingFocus/Slider).
- Approval record: captain's autonomy directive (user 2026-09-29 "take everything to its natural conclusion") + captain's firsthand DOM-01 eyeball + brief = explicit approval for `--update-snapshots --confirm` on scoped sets ONLY.
- Raw logs → /tmp/c-snapshot-*.txt. Reds attributed by name, isolated re-run, two-in-a-row.

## T+15 — CONFIG + TRIO + TOL-BAN done (all verified in tree)
- CONFIG: `playwright.config.ts:26` 0.02 → 0.001 + P1 headroom comment + P6 explicit-19-only comment (no per-major baselines; per-browser r19 live under {projectName}-suffixed paths). Policy live.
- TRIO (audit edits 2–4, literal): FocusLock.ct.spec.ts:257 `fl-dom-invalid-error` → locator `[data-testid="fl-dom-03-error"]` @ maxDiffPixels:25; :283 `fl-init-negative-focused` → locator `init-negative` @ 0.001; :612 `fl-stack-c-open` → locator `stack-c` @ 0.001. Same snap names (regen overwrites page-size PNGs with locator-size). Behavior assertions (toContainText/toBeFocused) untouched.
- TOL-BAN AUDIT: full census via rg = 35 per-call tolerances: 31× 0.001 (Tabs 9, Tree 4, Accordion 5, Field 3, Collapsible 7, NumberField 3 — all ≤0.01 legit noise guards), 1× 0.002 + 1× maxDiffPixels:5 (Overlay edge-sheet, legit tightest-in-repo), 3× 0.15 = THE TRIO (now fixed). ZERO per-call ratio ≥0.01 remains → ban holds with no `// TOL:` comments needed.
- ADOPTION DESIGN (locked): repo template `{arg}{ext}` → `{arg}-{projectName}{ext}` (one line) + bulk `git mv X.png → X-react19.png` (r19 Chromium project keeps resolving; snap() no-ops off-r19 so r17/r18 names never resolve) + place eyeballed FF/WK sets as `X-react19-firefox.png` / `X-react19-webkit.png`. Generation via FINISH-04 scratch vehicle (/tmp files persist: finish04-ct.config.ts + finish04-pm.mjs + candidates A/B).
- Tree: only owned edits (config + FocusLock spec + this log). No commits.

## T+30 — FocusLock load-flip hunt (major finding: parallelism-sensitive raster nondet)
- Full suite @0.001: 39/44. 5 reds attributed: trio (DOM-03/INIT-04/NEST-04 size-mismatch, expected) + CAND-09 fl-live-open 4538px (FINISH-07 suspect, count EXACT) + TAB-05 fl-tab-lab-open 4540px (UNEXPECTED — canary measured 0px at 09:23).
- Eyeball: both diffs = full-width band y50–147 text-AA fringing on fixture-catalog buttons; telemetry #919191→#909090 (1-LSB); actual/expected human-identical. Raster-only signature.
- Mechanism hunt (all logged, /tmp/c-snapshot-focuslock-*): canary ran 09:23, WK story landing 13:44 (proven innocent — touches live-c/catalog-inert only); stash-proven trio-innocent (TAB-05+CAND-09 fail with trio stashed too); TAB-05 passes isolated 3×; subsets pass (1–10+TAB, 11–20+TAB, TAB+after incl. CAND-09!); TRUE serial (--workers=1 via `pnpm agent playwright` + /tmp scratch config): ONLY trio fails, TAB-05+CAND-09 PASS. Parallel (8–10 workers): both fail bit-exact every time (7 runs).
- --disable-gpu parallel: TAB-05 PASSES, CAND-09 still fails 4538-identical-signature → two superimposed mechanisms (TAB-05 GPU-path-sensitive; CAND-09 parallelism-sensitive but GPU-independent). Root cause unidentified; both nondet-fixture class (never bake).
- FIX (in-scope, tol-ban-sanctioned): per-call `{ maxDiffPixels: 6000, maxDiffPixelRatio: 0.02 }` + `// TOL:` comments naming the noise source on both snaps. LESSON: Playwright applies BOTH pixels and ratio (pixels-only still failed at 4540<6000 until ratio restated). 0.02 needs the TOL comment it has.
- Trio regenned isolated (targeted --id -u ×3, authorized): 3 PNGs → locator-sized. Full FocusLock: **44/44** + unit 18/18. (`/tmp/c-snapshot-focuslock-verify2.txt`)
- INFRA (2×): daemon Vite :3101 died twice mid-box (clean exit, socket gone; no other crews — cause unknown, possibly runner port management or idle exit). Revived via agentct each time. Invalidated: w2 experiment + 2 Toast eyeball attempts (refused, no data). All accepted results come from runs with real snapshot diffs (server proven up).

## T+45 — NumberField: real drift, 1 regen (4 healed by C-NF)
- Parallel: 57/58, sole red `numberfield-keyboard-focused` 1086px (canary-exact), bbox input+ring. Serial: SAME 1086 → load-independent.
- Eyeball (expected/actual/diff): input box NARROWER + focus-ring/border restyle + "42"/stepper re-metrics. REAL NFLAST DRIFT, coherent. → ADOPT.
- -u whole component: ONLY keyboard-focused.png changed bytes — the other 4 canary drifters (306/310/300/32) now byte-identical to pinned (C-NF engine re-pin landed post-canary healed them). Verify: **58/58** + unit 131/131.

## T+55 — Toast: real card-chrome drift, 3 regen (2 healed by F30)
- Parallel: 57/60. 3 reds, counts bit-exact vs canary across 4 modes (parallel/serial/subset/canary): gate6-modal-a-paused-toast 711, gate7-card-resting 553, gate7-classnames 1164 → load-independent, NOT timer nondet.
- Eyeball (3 diffs): card top-edge/left-corner + title text (gate7-card 553, gate6 711); action-button backgrounds (Go/Crop) + corner (gate7-classnames 1164). Coherent single-component chrome drift. NOT digits/jitter. → ADOPT.
- -u: ONLY the 3 changed bytes — basic-stack-resting (102) + hover-expanded (330) byte-identical now (F30 flushSync healed post-canary). Verify: **60/60** + unit 52/52.
- NOTE: serial-only behavioral fails TO-HOTKEY-01 (toBe) + TO-A11Y-01 (axe) under my scratch config; both PASS parallel. Serial-harness timing artifacts, out of scope (assertions/product), not regressions.

## T+65 — Field: 6 regen incl. 2 abort-hidden (post-regen eyeball)
- Parallel (agentct "Field" fuzz = Field 33 + DateField 57 + NumberField 61 = 136 tests): 5 reds — 4 Field-file (resting 3633, mouse-focused 3637, prefix-suffix 1022, token-picker 416; all F04-exact) + NF keyboard-focused (known, other file). BONUS: DateField 57/57 green @0.001. Serial (Field file): same 4 → load-independent.
- field-keyboard-focused (5693) + field-prefix-suffix-focused (1026) absent: ABORT-HIDING (same tests, snaps after the failing first snap — proven via spec line order :294→:325, :864→:869).
- Eyeball round 1: resting = input-border restyle outlines (real); prefix-suffix = border + × clear buttons (real); token-picker 416 = human-identical actual/expected, stable sub-perceptual text-AA in ALL modes incl. serial → raster-only-but-stable → ADOPT (mouse-focused skipped visual: same bbox as resting ±4px, same drift).
- -u rewrote 6 (incl. the 2 hidden — -u reaches past aborts); compound (273) byte-identical (stable-0 now). Post-regen eyeball via /tmp/c-snapshot-pmdiff.mjs old-vs-new: kb-diff 5693 = same border/focus signature as resting ✓; psf-diff 1026 = same border/× signature ✓. Adoption STANDS.
- Verify: **136/136** circuit + unit Field 1/1, NF 131/131 (above), DateField 33/33.

## T+75 — Collapsible + Overlay DONE (box line; stop-adding)
- Collapsible parallel: 23/25, 2 reds (resting-closed 411, default-open-resting 413, F04 bboxes) + 4 abort-hidden. -u → 6 page PNGs changed exactly. Post-eyeball old-vs-new (411/413): ONE coherent element — divider/border line under trigger row + chevron AA. Real drift, adoption STANDS. Verify: **25/25** + unit 30/30.
- Overlay parallel: 119/120, SOLE red OV-DOM-01 dialog-basic-open 8269px (02F-OV-exact). EDGE-06 ABSENT (healed by VH instant-scroll-pins landing 09f4433f5 — no action).
- DOM-01 eyeball: diff = ONLY full-width bottom strip y465–479 (gray→black warning banner), everything else pixel-identical. ✓ Instance-verifies captain's APPROVAL (F53 strip only). Targeted -u (--id OV-DOM-01): only dialog-basic-open.png changed. Verify: **120/120** + unit 34/34.

## T+90 — CLOSE. Verdict: CHROMIUM REGEN COMPLETE, adoption + broad sweep CARRIED
- POLICY LIVE: 0.001 global + P6 19-only comment; trio → locator snaps; TOL-ban holds (only ≥0.01 = 2 TOL-commented FocusLock nondet snaps).
- CHROMIUM: 6/6 sets green — FocusLock 44/44+18u, Toast 60/60+52u, NF 58/58+131u, Field-circuit 136/136 (+1/33u), Collapsible 25/25+30u, Overlay 120/120+34u. 20 PNGs regenned, every drift classified in this log. 11 flip-day reds: NF5 (1 regenned real drift, 4 healed), Toast5 (3 regenned real drift, 2 healed), fl-live-open (TOL'd nondet) + fl-tab-lab-open (found, TOL'd nondet) + trio (regenned) + DOM-01 (regenned approved).
- Tree: 22 files (config + FocusLock spec + 20 PNGs + this log), all owned, NO commits (captain verifies + commits per-arc).
- CARRY 1 — PER-BROWSER ADOPTION (r19 FF+WK): design locked (repo template `{arg}{ext}` → `{arg}-{projectName}{ext}` one-liner + bulk `git mv X.png → X-react19.png` + place `X-react19-firefox/webkit.png`). NEW CONSTRAINT from load-flip finding: generate SERIALLY (--workers=1) or flips bake. Exact vehicle: `FINISH04_SNAPDIR=/tmp/<set> CT_REACT=19 CT_PORT=3119 pnpm agent playwright --dir packages/reference-lib --config=/tmp/finish04-ct.config.ts 'src/components/<C>/__e2e__/<C>.ct.spec.ts' --project=react19-<chromium|firefox|webkit> --update-snapshots --workers=1` (Cr-A once for drift column, FF/WK A+B two-in-a-row); diffs `node /tmp/finish04-pm.mjs <A> <B>`; eyeball gate per component (pinned-vs-Cr-fresh drift FIRST). Priority: Presence, Portal, Menubar, then FINISH-04 list (Listbox/Tree/DateField/NF/Menu/Splitter/Accordion/Button/Primitives/ReferenceLibrary/Slot/Switch + sweep greens; NEVER Toast/Announcer sibling-owned — note: sibling done now, re-check). F04 trusted sets (Field/Tabs/Collapsible /tmp/finish04-candidates/A+B) REGENERATE — pinned Chromium changed under them (my regen); old candidates are stale. Port 3119 was F04's; S2 re-probe.
- CARRY 2 — BROAD r19 SWEEP (proof gate: ≥15 FINISH-01 + Overlay/Measure/Announcer/Tooltip/Toast/FocusLock/RovingFocus/Slider): covered this box: Toast, FocusLock, NF, Field, DateField, Collapsible, Overlay (all green). NOT run: Measure, Announcer, Tooltip, RovingFocus, Slider + FINISH-01 remainder. Risk driver = 0.001 flip on other stale baselines. Vehicle: `pnpm agentct <Comp> --e2e` per component (or bare `pnpm agentct` full queue, ~15–20 min, exceeds any single yield — run from a terminal, not a box). Captain's FINISH-06 full gate covers ultimately.
- Resume checklist: [ ] adoption per CARRY 1 (serial!) [ ] sweep per CARRY 2 [ ] captain firsthand verify + commit per-arc [ ] FINISH-06. Raw logs: /tmp/c-snapshot-*.txt + /tmp/c-snapshot-eye/ + /tmp/c-snapshot-serial.mjs + /tmp/c-snapshot-pmdiff.mjs (all /tmp, uncommitted).
