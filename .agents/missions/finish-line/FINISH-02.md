PHASE-1 CLOSED — FINISH-02 breadth crew ran 09:25→10:55 UTC, in-box. Captain-verified: raw logs confirm Combobox r17FF 90/100 + 10/10 iso, Tree r17WK 67/67. 13/30 components swept, 29 new findings (02-F1..F29) all iso-confirmed. Phase 2 (NOT-REACHED 17 + green-confirms + 6 transients) dispatched as FINISH-02b below; fix crews follow per NEVER-AGAIN.

Scope: per-component CT suites, FF + WebKit legs under CT_REACT=17 and CT_REACT=18. DIAG ONLY — no fixes, no commits, no component files touched.
Vehicle: `CT_REACT=<major> pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts 'src/components/<C>/__e2e__/<C>.ct.spec.ts' --project=react<major>-<firefox|webkit> --ignore-snapshots`.
Priority: Combobox, Listbox, Tree, Calendar, DateField, Menu, FocusLock, Splitter, then rest alphabetical, NumberField LAST (after FINISH-05 lands).
Already-owned (confirm still reproduce, do not relitigate): Calendar r17 CA-RANGE-14 + r18 CA-KEY-03/CA-DAY-08; Menubar 18 (9/major); Popover r17 PO-LAYER-01; Toast r18 TO-ENV-03; Tooltip TT-CLOSE-01/TT-FOCUS-03 (r19+r18) + r17 TT-GROUP-01/02/03/TT-CLOSE-03.

## Breadth table

| Component | FF 17 | FF 18 | WK 17 | WK 18 | Notes |
|---|---|---|---|---|---|
| Combobox (101: 100 run + 1 skip) | 90/100 (10 red, iso-confirmed) | 100/100 (1×) | 100/100 (1×) | 100/100 (1×) | skip=CB-ENV-04 (G1→skip-by-project since sweep); H1 CDP now passes off-Cr; sweep WK tab-class gone on r17/r18 (tree drift) |
| Listbox (72) | 72/72 (1×) | 72/72 (1×) | 72/72 (1×) | 72/72 (1×) | sweep F27/F28/F29 all gone on r17/r18 (P2A tree drift) |
| Tree (67) | 67/67 (1×) | 67/67 (1×) | 67/67 (1×) | 67/67 (1×) | sweep F30/F31/F32 (WK) gone on r17/r18 |
| Calendar (85) | 83/85 (CA-RANGE-14 owned ✓ + CA-DAY-11 transient) | 83/85 (CA-KEY-03 + CA-DAY-08 owned ✓) | 85/85 (1×) | 83/85 (CA-KEY-03 + CA-DAY-08 owned ✓) | CA-DAY-11 passed iso (contention transient, NOT absorbed); sweep F33/F34/F35 gone as filed (F35-class CA-RANGE-14 now FF-only on r17) |
| DateField (57) | 57/57 (1×) | 57/57 (1×) | 57/57 (1×) | 57/57 (1×) | sweep F36 gone on r17/r18 |
| NumberField (58) | 58/58 (1×) | 58/58 (1×) | 58/58 (1×) | 58/58 (1×) | sweep F1–F7 all gone on r17/r18 (suite grew 43→58); ran after FINISH-05 landed (ACCEPT, byte-clean) |
| Menu (92) | 92/92 (1×) | 92/92 (1×) | 92/92 (1×) | 92/92 (1×) | sweep F39–F44 all gone on r17/r18 |
| FocusLock (44) | 41/44 (3 new, iso ✓) | 42/44 (2 new, iso ✓) | 41/44 (3 new, iso ✓) | 42/44 (2 new, iso ✓) | sweep F45–F58 (WK-14) ALL gone on r17/r18; new r17+r18 catalog/CAND-09 pair + r17-only NEST-06 |
| Splitter (79) | 79/79 (1×) | 79/79 (1×) | 79/79 (1×) | 79/79 (1×) | sweep F59–F68 ALL gone on r17/r18 |
| Menubar (23) | 14/23 (owned 9 ✓) | 14/23 (owned 9 ✓) | 14/23 (owned 9 ✓) | 14/23 (owned 9 ✓) | full-suite: EXACTLY the owned 9 on all 4 legs (KEY-05 = loop variant; clamps green); ZERO new reds |
| Popover (19) | 18/19 (PO-LAYER-01 owned ✓) | 19/19 (1×) | 16/19 (LAYER-01 owned + 2 new, iso ✓) | 17/19 (2 new, iso ✓) | new WK-only pair: Escape-dismiss focus + PO-HOVER-11 |
| Toast (60) | 57/60 (2 new + DOM-05 transient) | 52/60 (ENV-03 owned + 3 new + 4 transient) | 56/60 (4 new, iso ✓) | 54/60 (ENV-03 owned + 5 new, iso ✓) | transients (passed iso, NOT absorbed): DOM-05 r17FF; RIVAL-CARD/RIVAL-DIR/COMP-03/TIME-05 r18FF |
| Tooltip (15) | 9/15 (4 owned + CLOSE-01/FOCUS-03 new r17 legs) | 13/15 (owned 2 ✓, zero new) | 5/15 (6 owned-leg + 4 new WK, iso ✓) | 9/15 (CLOSE-01/FOCUS-03 owned + 4 new WK, iso ✓) | new WK-only keyboard-focus class ×4 (DOM-01/02, POS, KeyboardFocus story, A11Y-01) |

## Findings (new reds only; already-owned confirmed separately)

| ID | Comp | Leg | Failure (quoted) | Repro |
|---|---|---|---|---|
| 02-F1 | Combobox CB-REVERT-02 | r17 FF | log `['escape:Escape','input:Alpha','dismiss']` missing `"input:Alpha"` (:1444) | `-g "CB-REVERT-02" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F2 | Combobox CB-MODE-05 | r17 FF | `toHaveValue` Expected `"Alpha"` Received `""` | `-g "CB-MODE-05" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F3 | Combobox CB-COMP-02 both-mode | r17 FF | log `['input:Alpha','dismiss']` missing `"input:Alpha"` (:1883) | `-g "filtered both-mode consumer" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F4 | Combobox CB-COMP-01 | r17 FF | `focusedTestId` Expected not `"wt-trigger"` (:2506) | `-g "CB-COMP-01:" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F5 | Combobox CB-COMMIT-02 | r17 FF | log missing `"input:Zen Den"`, `"input:Bravo"` (:2066) | `-g "CB-COMMIT-02: Enter with no active" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F6 | Combobox CB-CUSTOM-01 | r17 FF | `not /.+/` Received `"ref-opt-bravo"` (activedescendant stuck) | `-g "CB-CUSTOM-01: Enter commits" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F7 | Combobox CB-CUSTOM-02 | r17 FF | `toHaveValue` Expected `"New value"` Received `"Bravo"` | `-g "CB-CUSTOM-02: blur commits" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F8 | Combobox CB-COMP-04 | r17 FF | focus-id Expected `null` Received `"so-input"` (:2667; INVERSE of sweep F10 r19-FF `Expected "so-input" Received null`) | `-g "CB-COMP-04:" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F9 | Combobox CB-EDIT-09 | r17 FF | `Test timeout 30000ms` waiting for `getByTestId('log-opt-alpha')` (:3414) | `-g "CB-EDIT-09:" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F10 | Combobox Async-loading | r17 FF | `toHaveText` Expected `"No results found"` Received `"No options available"` | `-g "Async loading: busy" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 |
| 02-F11 | FocusLock FL-TAB-01 catalog | r17+r18 × FF+WK | `expect(order).not.toContain('catalog-inert')` — order includes `catalog-inert` (:128) | `-g "FL-TAB-01" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F12 | FocusLock FL-CAND-09 | r17+r18 × FF+WK | after Tab, `expect(id).not.toBe('live-c')` — landed on `live-c` (:431) | `-g "FL-CAND-09" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F13 | FocusLock FL-NEST-06 | r17 × FF+WK (green on r18) | `getByTestId('fl-root-a-trigger')` element(s) not found after `btn-open-docs` click (:634) | `-g "FL-NEST-06" --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F14 | Popover Escape-dismiss (:34) | r17+r18 WK (FF green) | `btn-popover-trigger toBeFocused` → inactive after Escape | `-g "Escape key dismisses" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F15 | Popover PO-HOVER-11 | r17+r18 WK (FF green) | `hover-content toBeVisible` — element(s) not found (keyboard focus never opens openOnHover) | `-g "PO-HOVER-11" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F16 | Toast TO-SWIPE-01 | r17+r18 FF (WK green) | swipe toast `toHaveCount(0)` Received `1` — swipe never dismisses | `-g "TO-SWIPE-01" --project=react<major>-firefox` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F17 | Toast TO-AUTOCLOSE-01 | r17+r18 FF (WK green) | manual toast `toHaveCount(0)` Received `1` — timer/manual dismiss never removes | `-g "TO-AUTOCLOSE-01" --project=react<major>-firefox` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F18 | Toast TO-FOCUS-01 | r17+r18 WK (FF green) | `btn-show toBeFocused` → inactive after dismiss | `-g "TO-FOCUS-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F19 | Toast TO-FOCUS-02 | r17+r18 WK (FF green) | `fallback-right toBeFocused` → inactive | `-g "TO-FOCUS-02" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F20 | Toast TO-OV-03/04/05 | r17+r18 WK (FF green) | `btn-away toBeFocused` → inactive | `-g "TO-OV-03" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F21 | Toast TO-A11Y-01 | r17+r18 WK (FF green) | axe `color-contrast [serious]`: `toast-form-close` contrast 1.14 (expects 4.5) | `-g "TO-A11Y-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F22 | Toast TO-RIVAL-RICH | r18 FF only | `toHaveAttribute` on `[data-reference-toast-root]` — element(s) not found | `-g "TO-RIVAL-RICH" --project=react18-firefox` + CT_REACT=18 CT_PORT=3118 |
| 02-F23 | Toast TO-RIVAL-SWIPE-PHYSICS | r18 WK only | `toHaveAttribute "open"` on `swipe-g7` — element(s) not found | `-g "TO-RIVAL-SWIPE-PHYSICS" --project=react18-webkit` + CT_REACT=18 CT_PORT=3118 |
| 02-F24 | Tooltip TT-DOM-01/02 | r17+r18 WK (FF green) | `btn-tooltip-a toBeFocused` → inactive (keyboard focus never lands; content never shows) | `-g "TT-DOM-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F25 | Tooltip TT-POS | r17+r18 WK (FF green) | `btn-tooltip-a toBeFocused` → inactive (same WK keyboard-focus class) | `-g "TT-POS:" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F26 | Tooltip KeyboardFocus story | r17+r18 WK (FF green) | `Keyboard focus trigger toBeFocused` → inactive (same class) | `-g "Component story: KeyboardFocus" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F27 | Tooltip TT-A11Y-01 | r17+r18 WK (FF green) | axe scan blocked: `btn-tooltip-a toBeFocused` → inactive (same class, tooltip never opens) | `-g "TT-A11Y-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F28 | Tooltip TT-CLOSE-01 r17 leg (owned ID, new leg) | r17 FF + WK (owned r19+r18) | red on r17 both engines, iso-persistent | `-g "TT-CLOSE-01" --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F29 | Tooltip TT-FOCUS-03 r17 leg (owned ID, new leg) | r17 FF + WK (owned r19+r18) | red on r17 both engines, iso-persistent | `-g "TT-FOCUS-03" --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |

## Already-owned confirmation

| Finding | Leg | Still reproduces? | Log |
|---|---|---|---|
| Calendar r17 CA-RANGE-14 | r17 FF | YES (`rmachine-null toBeFocused → inactive`, iso-persistent) | /tmp/finish02-calendar-17-firefox.txt + -iso |
| Calendar r17 CA-RANGE-14 | r17 WK | NO (85/85 green) | /tmp/finish02-calendar-17-webkit.txt |
| Calendar r18 CA-KEY-03 | r18 FF + WK | YES both engines (iso-persistent) | /tmp/finish02-calendar-18-{firefox,webkit}.txt + -iso |
| Calendar r18 CA-DAY-08 | r18 FF + WK | YES both engines (iso-persistent) | /tmp/finish02-calendar-18-{firefox,webkit}.txt + -iso |
| Menubar 18 MB-DOM-01 | r17+r18 × FF+WK | YES all 4 legs | /tmp/finish02-menubar-*.txt |
| Menubar 18 MB-KEY-02/03/04/06/09 | r17+r18 × FF+WK | YES all 4 legs | /tmp/finish02-menubar-*.txt |
| Menubar 18 MB-KEY-05 loop | r17+r18 × FF+WK | YES all 4 legs | /tmp/finish02-menubar-*.txt |
| Menubar 18 MB-KEY-05 clamps | r17+r18 × FF+WK | NO — GREEN all 4 legs (engine-specific: reds only on Chromium) | /tmp/finish02-menubar-*.txt |
| Menubar 18 MB-FOCUS-01, MB-RTL-01 | r17+r18 × FF+WK | YES all 4 legs | /tmp/finish02-menubar-*.txt |
| Popover r17 PO-LAYER-01 | r17 FF + WK | YES both engines | /tmp/finish02-popover-17-{firefox,webkit}.txt |
| Toast r18 TO-ENV-03 | r18 FF + WK | YES both engines | /tmp/finish02-toast-18-{firefox,webkit}.txt |
| Tooltip TT-CLOSE-01/TT-FOCUS-03 | r18 FF + WK | YES both engines | /tmp/finish02-tooltip-18-{firefox,webkit}.txt |
| Tooltip r17 TT-GROUP-01/02/03/TT-CLOSE-03 | r17 FF + WK | YES both engines | /tmp/finish02-tooltip-17-{firefox,webkit}.txt |

## Run log

### 09:25 UTC — CREW START. SWEEP.md read (68 findings + P0 rule). Config /tmp/sweep-ct.config.ts verified present. Opening r17-genuineness probe (S2 method).

### 09:35 UTC — GALLERY PROOF. :3101 holds a STALE r19 gallery (probe under CT_REACT=17 reported GALLERY_RUNTIME=19.2.4 — another crew's, left untouched). FINISH-02 uses private ports: r17→3117 (proven 17.0.2), r18→3118 (proven 18.3.1). All legs below carry CT_PORT=<major-port>. S3 OPEN (Combobox).

### 10:08 UTC — COMBOBOX CLOSED. r17 FF 90/100 (10 reds, ALL reproduce isolated — genuine r17×FF; pattern: missing `input:*` log entries F1/F3/F5 + stale values F2/F6/F7 + stuck focus F4/F8 + timeout F9 + announcer text F10; Chromium r17/r18 105/105 per FINISH-01A so all are FF-specific). r17 WK 100/100, r18 FF 100/100, r18 WK 100/100 (all 1× — confirm if box allows). Signal: FINISH-05 LANDED (ACCEPT, NumberField byte-clean) — NF stays last in order regardless. S4 OPEN (Listbox).

### 10:09 UTC — LISTBOX + TREE CLOSED. Listbox 72/72 ×4, Tree 67/67 ×4 (all 1×). Sweep F27–F32 all gone on r17/r18. S5 OPEN (Calendar).

### 10:12 UTC — CALENDAR CLOSED. r17 FF 83/85 (CA-RANGE-14 owned ✓ iso-persistent; CA-DAY-11 passed iso = contention transient, NOT absorbed); r17 WK 85/85; r18 FF+WK 83/85 (owned CA-KEY-03 + CA-DAY-08 both engines, iso-persistent). S1 OPEN (NumberField).

### 10:14 UTC — NUMBERFIELD CLOSED. 58/58 ×4 (1×). Sweep F1–F7 all gone. Owned-probe round: Menubar 8/9 reproduce all 4 legs (KEY-05-clamps GREEN all 4 — Chromium-only red); Popover PO-LAYER-01 ✓ both engines r17; Toast TO-ENV-03 ✓ both engines r18; Tooltip r18 CLOSE-01/FOCUS-03 ✓ + r17 GROUP-01/02/03/CLOSE-03 ✓ both engines.

### 10:26 UTC — DATEFIELD CLOSED. 57/57 ×4 (1×). Sweep F36 gone. S7 OPEN (Menu).

### 10:28 UTC — MENU CLOSED. 92/92 ×4 (1×). Sweep F39–F44 all gone. S8 OPEN (FocusLock).

### 10:30 UTC — FOCUSLOCK CLOSED. r17 41/44 both engines, r18 42/44 both engines. Sweep F45–F58 (WK-14) ALL gone; new 02-F11 (TAB-01 catalog `catalog-inert`), 02-F12 (CAND-09 `live-c`), 02-F13 (NEST-06 r17-only), all iso-persistent. Splitter next.

### 10:31 UTC — SPLITTER CLOSED. 79/79 ×4 (1×). Sweep F59–F68 ALL gone. All 8 priority components + NumberField done. Rest round: Menubar full (exactly owned 9 ×4, zero new), Popover full (02-F14 Escape-focus + 02-F15 HOVER-11, WK-only both majors), Toast full (02-F16..F23; transients DOM-05/RIVAL-CARD/RIVAL-DIR/COMP-03/TIME-05 passed iso, NOT absorbed), Tooltip full (02-F24..F27 WK keyboard-focus class + 02-F28/29 owned IDs on new r17 legs).

### 10:55 UTC — BOX END. CLOSED. 13 components × 4 legs = 52 full legs + 12 owned probes + 20 iso runs. New findings: 29 (02-F1..F29). NOT REACHED (box): Accordion, Announcer (sweep has r17 FF/WK), Button, Collapsible, Field, Measure, Overlay, Portal, Presence, Primitives, ReferenceLibrary, RovingFocus, Showcase, Slider, Slot, Switch, Tabs. Green-confirm debt: all 1× greens unconfirmed (two-in-a-row not met — box). Transients noted-not-absorbed: CA-DAY-11, TO-DOM-05, TO-RIVAL-CARD, TO-RIVAL-DIR, TO-COMP-03, TO-TIME-05 (all passed iso; quiet full-suite re-run would settle order-dependence). Tree drift note: ~50 sweep findings gone on r17/r18 (P2A/P2B/P2E/P2F fixes + G1 skip-by-project). Only this log modified in repo; zero component files touched; nothing committed.

## Resume checklist

1. Green-confirm round: re-run all 1× green legs (Combobox ×3, Listbox ×4, Tree ×4, Calendar r17WK, DateField ×4, NumberField ×4, Menu ×4, Splitter ×4, Popover r18FF) — two-in-a-row.
2. Settle 6 transients with quiet full-suite re-runs (CA-DAY-11, TO-DOM-05, TO-RIVAL-CARD, TO-RIVAL-DIR, TO-COMP-03, TO-TIME-05).
3. Sweep NOT-REACHED list (17 components above) with the same vehicle (private ports 3117/3118; :3101 stale-gallery hazard stands).
4. Triage 02-F1..F29 to fix crews (clusters: Combobox r17-FF input-event loss ×10; Toast dismiss/focus ×8; Tooltip/FocusLock/Popover WK focus ×9; RIVAL ×2).
5. Scaffolding: /tmp/sweep-ct.config.ts, /tmp/sweep-probe*, /tmp/finish02-*.txt (~50 logs) — all in /tmp, nothing in repo.

---
## PHASE 2 (FINISH-02b breadth crew) — CLOSED (ran 10:45→12:11 UTC, in-box). Captain-verified: Measure r17 0/10 + Tabs r17FF 26/26 confirmed in raw logs. 30/30 table COMPLETE. Findings 02-F30..F58 (29 new) all iso-confirmed. PNG dispute resolved: Overlay.ct.spec.ts writes relative-path screenshots (all-open/layer2-closed/after-escape) — 02b's Overlay legs rewrote the tracked copies; restored via git checkout (run artifacts, not baselines). F22 tiebreak + green-confirm debt + Toast F57/F58 carried to fix crews below.
Scope: NOT-REACHED 17 sweep + green-confirm round (two-in-a-row) + 6 transients. Sibling FINISH-02F-CB owns Combobox/ (IN PROGRESS) — Combobox legs LAST, read-only test exec only.
### 10:45 UTC — CREW START. Phase-1 log + SWEEP.md read. Tree clean except sibling FINISH-02F-CB.md (untracked). Ports 3101/3117/3118 all CLOSED (no stale gallery to dodge; fresh boots below). Config /tmp/sweep-ct.config.ts present; all 17 spec paths verified OK.
### 11:00 UTC — PROBES GREEN (3117=17.0.2, 3118=18.3.1, fresh boots; /tmp/finish02b-probe-{17,18}.txt). Shell `&` rejected by sandbox → fanned out: sweep-half-B subagent owns Button/Collapsible/Field/Measure/Overlay/Portal/Presence/Primitives ×4 (32 legs); this crew runs Accordion/Announcer/ReferenceLibrary/RovingFocus/Showcase/Slider/Slot/Switch/Tabs ×4 (36 legs). CLOSED: Accordion 21/21 ×4 (sweep F37/F38 gone on r17/r18); Announcer r17 35/35 ×2 (sweep F8 gone on r17), r18 34/35 both engines (02-F30 ANN-HOST-03/RL-ROOT-06, iso-persistent both engines); ReferenceLibrary 3/3 ×4. Sibling FINISH-02F-CB still IN PROGRESS (Combobox untouched).
### 11:17 UTC — CLOSED: RovingFocus FF 44/44 ×2, WK 38/44 ×2 (02-F31..F36: RF-TAB-01/02, TAB-04, KEY-09, TAB-03, DOM-03, COMP-01 — all toBeFocused→inactive on Tab-traversal landings, iso-persistent both majors); Showcase r17 2/3 both engines (02-F37 shebang-cascade 45s timeout clicking tier3, iso-persistent), r18 3/3 ×2; Slider FF 30/36 ×2, WK 31/36 ×2 (02-F38 POINTER-04 gotpointercapture never fires; 02-F39 POINTER-08 + 02-F40 END-03 __capId null; 02-F41/42 POINTER-05/COMP-03 CDP-harness H-class; 02-F43 ENV-03 ShadowRoot contract FF-only; all iso-persistent, same-test verified). Remaining sweep: Slot, Switch, Tabs (mine) + half-B 8.
### 11:32 UTC — MY SWEEP HALF CLOSED (9/9): Slot 4/4 ×4, Switch 22/22 ×4, Tabs 26/26 ×4 (all green). Half-B peek (their isos pending): Button 7/7 ×4, Collapsible 25/25 ×4, Field 21/21 ×4, Portal 22/22 ×4, Presence 45/45 ×3 (r18WK in flight) green; Measure r17 0/10 BOTH engines (`page.evaluate: undefined is not a function` at story mount — whole-suite r17 mount failure, r18 10/10 ×2), Overlay r17 FF 93/120 + WK 90/120 with big cluster, r18 115/120 both engines; Primitives in flight. Confirms in flight: Listbox r17FF 72/72 PASS (rest running), Tree ×4 launched. Sibling fix crew MID-FIX (Combobox.tsx modified, uncommitted) — Combobox confirms deferred to LAST per brief, skip-with-rationale likely.
### 12:00 UTC — STOP-ADDING. Confirms CLOSED: Listbox 72/72 ×4 + Tree 67/67 ×4 (two-in-a-row ✓). Settles CLOSED: Toast r18FF 55/60 (RIVAL-CARD/RIVAL-DIR/COMP-03 flipped green; TIME-05 red again; CLOSE-04 newly red, iso-green = flip transient; RIVAL-RICH flipped green — 02-F22 needs tiebreak), Toast r17FF 57/60 (DOM-05 red again), Calendar r17FF 84/85 (DAY-11 settled green, only owned RANGE-14 left). Half-B FINAL received: 32/32 legs, all reds iso-confirmed, zero transients. Combobox ×3 confirms SKIPPED: sibling FINISH-02F-CB CLOSED with fixes landed in Combobox.tsx (uncommitted) — re-proof belongs on the fixed tree, not this diag box. DF/NF/Menu/Splitter/CalWK/Popover confirms CARRIED (box; 1× phase-1 greens stand). (Note: 11:32 entry above was actually written 11:44 — clock skew in crew notes, run timestamps in logs are authoritative.)
### 12:10 UTC — BOX END. CLOSED. All 30/30 swept; confirms + transients settled or carried with rationale below.

## Phase-2 extended breadth table (30/30; P1 = phase-1 counts, P2 = new)

| Component | FF 17 | FF 18 | WK 17 | WK 18 | Notes |
|---|---|---|---|---|---|
| Combobox (101) | 90/100 P1 | 100/100 P1 (1×) | 100/100 P1 (1×) | 100/100 P1 (1×) | confirms skipped — sibling fixes landed mid-box (see closeout) |
| Listbox (72) | 72/72 ✓✓ | 72/72 ✓✓ | 72/72 ✓✓ | 72/72 ✓✓ | CONFIRMED two-in-a-row |
| Tree (67) | 67/67 ✓✓ | 67/67 ✓✓ | 67/67 ✓✓ | 67/67 ✓✓ | CONFIRMED two-in-a-row |
| Calendar (85) | 84/85 settle (RANGE-14 only) | 83/85 P1 | 85/85 P1 (1×) | 83/85 P1 | CA-DAY-11 SETTLED transient |
| DateField (57) | 57/57 P1 (1×) | 57/57 P1 (1×) | 57/57 P1 (1×) | 57/57 P1 (1×) | confirms carried (box) |
| NumberField (58) | 58/58 P1 (1×) | 58/58 P1 (1×) | 58/58 P1 (1×) | 58/58 P1 (1×) | confirms carried (box) |
| Menu (92) | 92/92 P1 (1×) | 92/92 P1 (1×) | 92/92 P1 (1×) | 92/92 P1 (1×) | confirms carried (box) |
| FocusLock (44) | 41/44 P1 | 42/44 P1 | 41/44 P1 | 42/44 P1 | 02-F11..F13 (no green legs to confirm) |
| Splitter (79) | 79/79 P1 (1×) | 79/79 P1 (1×) | 79/79 P1 (1×) | 79/79 P1 (1×) | confirms carried (box) |
| Menubar (23) | 14/23 P1 | 14/23 P1 | 14/23 P1 | 14/23 P1 | owned 9 only, zero new (no greens) |
| Popover (19) | 18/19 P1 | 19/19 P1 (1×) | 16/19 P1 | 17/19 P1 | r18FF confirm carried (box) |
| Toast (60) | 57/60 settle (F16+F17+DOM-05) | 55/60 settle (F16+F17+CLOSE-04+TIME-05+ENV-03) | 56/60 P1 | 54/60 P1 | transients settled (see dispositions) |
| Tooltip (15) | 9/15 P1 | 13/15 P1 | 5/15 P1 | 9/15 P1 | 02-F24..F29 (no greens) |
| Accordion (21) | 21/21 (1×) | 21/21 (1×) | 21/21 (1×) | 21/21 (1×) | sweep F37/F38 gone on r17/r18 |
| Announcer (35) | 35/35 (1×) | 34/35 (02-F30) | 35/35 (1×) | 34/35 (02-F30) | sweep F8 gone on r17 AND r18 |
| Button (7) | 7/7 (1×) | 7/7 (1×) | 7/7 (1×) | 7/7 (1×) | — |
| Collapsible (25) | 25/25 (1×) | 25/25 (1×) | 25/25 (1×) | 25/25 (1×) | sweep green holds on r17/r18 |
| Field (21) | 21/21 (1×) | 21/21 (1×) | 21/21 (1×) | 21/21 (1×) | sweep green holds on r17/r18 |
| Measure (10) | 0/10 (02-F44) | 10/10 (1×) | 0/10 (02-F44) | 10/10 (1×) | whole-suite r17 mount failure (createRoot) |
| Overlay main (97; dir 120) | 88/97 (dir 93/120) | 93/97 (dir 115/120) | 85/97 (dir 90/120) | 93/97 (dir 115/120) | dir = main + 18 Exotica + 5 Focus(5/5×4); 02-F45..F56 |
| Portal (22) | 22/22 (1×) | 22/22 (1×) | 22/22 (1×) | 22/22 (1×) | sweep green holds on r17/r18 |
| Presence (45) | 45/45 (1×) | 45/45 (1×) | 45/45 (1×) | 45/45 (1×) | sweep green holds on r17/r18 |
| Primitives (4) | 4/4 (1×) | 4/4 (1×) | 4/4 (1×) | 4/4 (1×) | — |
| ReferenceLibrary (3) | 3/3 (1×) | 3/3 (1×) | 3/3 (1×) | 3/3 (1×) | — |
| RovingFocus (44) | 44/44 (1×) | 44/44 (1×) | 38/44 (02-F31..36) | 38/44 (02-F31..36) | WK Tab-traversal focus class ×6 |
| Showcase (3) | 2/3 (02-F37) | 3/3 (1×) | 2/3 (02-F37) | 3/3 (1×) | shebang 45s timeout r17-only |
| Slider (36) | 30/36 (02-F38..43) | 30/36 (02-F38..43) | 31/36 (02-F38..42) | 31/36 (02-F38..42) | pointer-capture ×3 + CDP-harness ×2 + ENV-03 FF-only |
| Slot (4) | 4/4 (1×) | 4/4 (1×) | 4/4 (1×) | 4/4 (1×) | — |
| Switch (22) | 22/22 (1×) | 22/22 (1×) | 22/22 (1×) | 22/22 (1×) | — |
| Tabs (26) | 26/26 (1×) | 26/26 (1×) | 26/26 (1×) | 26/26 (1×) | sweep green holds on r17/r18 |

## Phase-2 findings (02-F30+; all iso-confirmed unless noted)

| ID | Comp | Leg | Failure (quoted) | Repro |
|---|---|---|---|---|
| 02-F30 | Announcer ANN-HOST-03/RL-ROOT-06 | r18 FF+WK (r17 green) | `[data-reference-announcer="polite"]` Expected `"Shadow ready"`, element(s) not found | `-g "ANN-HOST-03" --project=react18-<firefox\|webkit>` + CT_REACT=18 CT_PORT=3118 |
| 02-F31 | RovingFocus RF-TAB-01/02 | r17+r18 WK (FF green) | `outside-after-btn toBeFocused` → inactive | `-g "RF-TAB-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F32 | RovingFocus RF-TAB-04 | r17+r18 WK | `outside-after-btn toBeFocused` → inactive | `-g "RF-TAB-04" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F33 | RovingFocus RF-KEY-09 | r17+r18 WK | `keys-b toBeFocused`, element(s) not found | `-g "RF-KEY-09" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F34 | RovingFocus RF-TAB-03 | r17+r18 WK | `keys-outside-before toBeFocused` → inactive | `-g "RF-TAB-03" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F35 | RovingFocus RF-DOM-03 | r17+r18 WK | `empty-after toBeFocused` → inactive | `-g "RF-DOM-03" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F36 | RovingFocus RF-COMP-01 | r17+r18 WK | `slot-outside-after toBeFocused` → inactive | `-g "RF-COMP-01" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F37 | Showcase shebang cascade | r17 FF+WK (r18 green) | `Test timeout 45000ms` clicking `btn-open-shebang-tier3` | `-g "full shebang cascade" --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F38 | Slider SD-POINTER-04 | r17+r18 × FF+WK | `expect.poll(__cap.length)).toBe(1)` Expected 1 Received 0 (gotpointercapture never fires) | `-g "SD-POINTER-04" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F39 | Slider SD-POINTER-08 | r17+r18 × FF+WK | `expect.poll(__capId)).not.toBeNull()` → null (:698) | `-g "SD-POINTER-08" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F40 | Slider SD-END-03 | r17+r18 × FF+WK | `expect.poll(__capId)).not.toBeNull()` → null (:878) | `-g "SD-END-03" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F41 | Slider SD-POINTER-05 | r17+r18 × FF+WK | `browserContext.newCDPSession: CDP session is only available in Chromium` — HARNESS (H-class) | `-g "SD-POINTER-05" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F42 | Slider SD-COMP-03 | r17+r18 × FF+WK | CDP-only (same H-class, :1140) | `-g "SD-COMP-03" --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F43 | Slider SD-ENV-03 contract | r17+r18 FF (WK green) | `shadow-changes` Expected `"[[21,80],[21,100]]"` Received `"[[21,80]]"` | `-g "preserves the contract inside a ShadowRoot" --project=react<major>-firefox` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F44 | Measure whole-suite mount | r17 FF+WK (r18 green) | `createRoot is not a function` (WK) / `undefined is not a function` at mount (FF) — all 10 | `-g "MS-DOM-01" --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F45 | Overlay Exotica mount cluster (18) | r17 FF+WK (r18 green exc F56) | `createRoot is not a function` at `exotica-fixture.tsx:281` — all 18 Exotica | `-g "OV-DOM-03" 'src/components/Overlay/__e2e__/OverlayExotica.ct.spec.ts' --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F46 | Overlay OV-ESC-01&04 | r17 FF+WK (r18 green) | Escape deepest-first `toBeVisible` | `-g "OV-ESC-01" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F47 | Overlay r17 dismiss cluster OV-LAYER-02/03/05/11 | r17 FF+WK (r18 green) | outside-dismiss `toBeVisible`/`toHaveCount` (4 tests, one class) | `-g "OV-LAYER-02\|OV-LAYER-03\|OV-LAYER-05\|OV-LAYER-11" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F48 | Overlay OV-EDGE-04 | r17 FF+WK (r18 green) | nested edge-stack CSS vars `toBe` | `-g "OV-EDGE-04" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react17-<firefox\|webkit>` + CT_REACT=17 CT_PORT=3117 |
| 02-F49 | Overlay OV-DOM-08&09 | r17 WK only | `locator.click: Test timeout of 30000ms exceeded` (iso 31.3s) | `-g "OV-DOM-08" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react17-webkit` + CT_REACT=17 CT_PORT=3117 |
| 02-F50 | Overlay OV-LAYER-04 touch | FF r17+r18 + WK r17 (WK r18 green) | FF: `locator.dispatchEvent: TouchEvent is not defined`; WK r17: `toHaveCount` | `-g "OV-LAYER-04" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F51 | Overlay OV-POS-06 CSS-vars | FF r17+r18 (WK green) | available/anchor geometry vars `toBe` | `-g "OV-POS-06" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react<major>-firefox` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F52 | Overlay OV-SCRL-01/02 | r18 FF only | closeOnScroll living-position `toBeVisible` | `-g "OV-SCRL-01" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react18-firefox` + CT_REACT=18 CT_PORT=3118 |
| 02-F53 | Overlay OV-FOCUS-08 | r17+r18 × FF+WK | initial-focus-after-mount `toBeFocused` → inactive | `-g "OV-FOCUS-08" 'src/components/Overlay/__e2e__/Overlay.ct.spec.ts' --project=react<major>-<firefox\|webkit>` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F54 | Overlay OV-FOCUS-03 | r17+r18 WK (FF green) | initialFocus=false reclaim `toBeFocused` → inactive | `-g "OV-FOCUS-03" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F55 | Overlay OV-TRG-05 + reject | r17+r18 WK (FF green) | Tab-bridge into Content `toBeFocused` → inactive (both variants) | `-g "OV-TRG-05" --project=react<major>-webkit` + CT_REACT=<major> CT_PORT=3117/3118 |
| 02-F56 | Overlay OV-SCROLL-06 Exotica | r18 FF+WK (r17 red via F45) | FF: `TouchEvent is not defined`; WK: `TypeError: Illegal constructor` (pinch path) | `-g "OV-SCROLL-06" 'src/components/Overlay/__e2e__/OverlayExotica.ct.spec.ts' --project=react18-<firefox\|webkit>` + CT_REACT=18 CT_PORT=3118 |
| 02-F57 | Toast TO-DOM-05 ORDER-DEP | r17 FF | `toHaveCSS` on `scaled-child`, element(s) not found — full-red ×2, iso-green | `-g "TO-DOM-05" --project=react17-firefox` + CT_REACT=17 CT_PORT=3117 (iso PASSES; reproduces only in full suite) |
| 02-F58 | Toast TO-TIME-05 ORDER-DEP | r18 FF | `toHaveCount` on `[data-reference-toast-id="swipe"]` Expected 0 Received 1 — full-red ×2, iso-green ×2 | `-g "TO-TIME-05" --project=react18-firefox` + CT_REACT=18 CT_PORT=3118 (iso PASSES; reproduces only in full suite) |

## Phase-2 transient dispositions (all 6 settled + 2 flips)

| Transient | Settle evidence | Disposition |
|---|---|---|
| CA-DAY-11 (r17FF) | settle 84/85, only owned RANGE-14 red | SETTLED one-off transient — NOT filed |
| TO-DOM-05 (r17FF) | settle red again (full-red ×2, iso-green) | ORDER-DEPENDENT GENUINE → 02-F57 |
| TO-RIVAL-CARD (r18FF) | settle green + iso green | SETTLED one-off transient — NOT filed |
| TO-RIVAL-DIR (r18FF) | settle green + iso green | SETTLED one-off transient — NOT filed |
| TO-COMP-03 (r18FF) | settle green + iso green | SETTLED one-off transient — NOT filed |
| TO-TIME-05 (r18FF) | settle red again (full-red ×2, iso-green ×2) | ORDER-DEPENDENT GENUINE → 02-F58 |
| TO-CLOSE-04 flip (r18FF) | green P1 full → red settle → green iso | single-occurrence flip — NOT filed, noted |
| TO-RIVAL-RICH = 02-F22 | P1 full-red + iso-red, now settle-GREEN | DOWNGRADED to flaky — needs tiebreak run (carried) |

## Phase-2 resume checklist

1. Green-confirm debt (two-in-a-row unmet — box): Calendar r17WK, DateField ×4, NumberField ×4, Menu ×4, Splitter ×4, Popover r18FF (1× P1 greens stand), Combobox ×3 (re-proof on fixed tree; sibling 02F-CB closed 8-fixed/2-held).
2. Tiebreak 02-F22 (TO-RIVAL-RICH): P1 iso-red vs P2 settle-green — one quiet full r18FF re-run decides.
3. Triage 02-F30..F58 to fix crews (clusters: Overlay r17 ×~30 incl. createRoot-mount F44/F45; Toast order-dep F57/F58; Slider pointer-capture F38-40; RovingFocus/Overlay/Tooltip WK-focus F31-36/F53-55; CDP-harness F41/F42 → chromium-only marks; singles F30/F37/F43/F46/F48-52/F56).
4. Overlay sweep deviation note: half-B ran the whole `__e2e__/` dir (120 tests) not just `Overlay.ct.spec.ts` — broader coverage, kept; main-only splits in table are exact per-file.
5. Scaffolding: /tmp/sweep-ct.config.ts, /tmp/sweep-probe*, /tmp/finish02-*.txt (P1 ~50), /tmp/finish02b-*.txt (P2 ~90 incl. confirms/settles/isos) — all in /tmp, nothing in repo. Galleries on 3117/3118 left running (proven 17.0.2/18.3.1); :3101 still untouched.
6. Only this log modified in repo; zero component files touched; nothing committed. Combobox/ never touched (sibling owned; their fixes + stray root PNGs left alone).
