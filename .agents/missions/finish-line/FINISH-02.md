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
