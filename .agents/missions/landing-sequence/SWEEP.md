# SWEEP — objective log

IN PROGRESS — SWEEP crew. Box: 16:37→18:07 UTC (90 min hard). No new runs after 17:52. Log cadence: every 15 min.

Scope: P3 matrix sweep (FF/WebKit, browser:all) on landed tree `c7fbc2713` (clean).
Crew fixes nothing; reds are findings. Never commits.

## Recon (16:37 UTC — before any run)

- **Kept matrix ≠ component browsers.** `matrix/tests/` holds chain T1–T13 + MCP only (install/packaging/chain-topology proof; single `vite7` project, default Chromium, react19). `matrix/lib`, `matrix/overlays`, `matrix/primitives` are decommissioned — the old `pnpm agent playwright overlays|lib` targets no longer resolve. Hermetic `pnpm agent test` cannot sweep component CT under FF/WebKit.
- **Component e2e lives in CT** (`packages/reference-lib/src/components/*/__e2e__/*.ct.spec.ts`), Chromium-only via `pnpm agentct`. The FF/WebKit dimension is Playwright 1.62's `--browser=all|firefox|webkit` CLI flag (confirmed in `playwright test --help`).
- **Vehicle:** `pnpm agent playwright --dir packages/reference-lib/playwright <spec> --browser=<firefox|webkit>` (canonical runner: QoS jailbreak, port cleanup, exit signaling; `--dir` form avoids spec-name mis-inference). `--browser=<x>` (= form) forwards through the runner's arg fall-through.
- **Browsers present:** `~/Library/Caches/ms-playwright/` has `firefox-1538` + `webkit-2336` (+ chromium 1234/1243). `pnpm agent status`: PRI 46, Docker (colima) active, Verdaccio active.
- **Snapshot hazard:** `snap()` baselines are Chromium-raster. FF/WebKit legs may show raster-only diffs. Probe P0 decides: if raster reds appear, all FF/WebKit legs run with `--ignore-snapshots` (behavioral signal only) and non-Chromium visual drift is logged as an explicit gap.
- **Chromium control:** skipped by default — wave-1 + finish-line crews already proved Chromium (FORM 43/43×3 majors, REDS Announcer 35/35×17/19, P2A–P2F scoreboards). Any FF/WebKit red gets a same-spec Chromium confirmation only if needed to isolate browser-vs-tree.
- **Hermetic chain:** out of scope for component browsers; one opportunistic `pnpm agent test --packages=@matrix/chain-t2` (sole `layers:` prover + install path, touches the AXE lockfile delta) only if the native sweep finishes with time to spare. Otherwise logged as gap.

## Sweep plan (priority order, wave-1 first)

| # | Target | Spec tests | Legs |
|---|--------|-----------|------|
| P0 | Probe: Field CT, tiny `-g` | subset | FF (snapshot behavior?) → decides `--ignore-snapshots` |
| S1 | NumberField (FORM leg: `-g "NF-FORM-1"` then full) | 3 → 43 | FF, WebKit |
| S2 | Announcer (REDS 17 fix) | 35 | FF, WebKit @r19; FF, WebKit @r17 (`CT_REACT=17`) if viable |
| S3 | Combobox (CB-ENV-04 FF/WebKit remainder) | 101 | FF, WebKit |
| S4 | Listbox + Tree (P2A) | 72 + 67 | FF, WebKit |
| S5 | Calendar + DateField + Field (Date chain) | 84 + 57 + 21 | FF, WebKit |
| S6 | Tabs + Collapsible + Accordion (Disclosure) | 26 + 25 + 21 | FF, WebKit |
| S7 | Menu (+Menubar if time) | 92 (+23) | FF, WebKit |
| S8 | Presence + Portal + FocusLock + Splitter (primitives; SP-ENV-04 remainder) | 45 + 22 + 44 + 79 | FF, WebKit |
| S9 | Literal `--browser=all` proof (one small target, TBD) | — | all |
| S10 | Opportunistic hermetic `@matrix/chain-t2` | — | Dagger, if time |

Spec path form: `../src/components/<C>/__e2e__/<C>.ct.spec.ts` relative to `--dir packages/reference-lib/playwright`.
React-17 legs: `CT_REACT=17` env prefix (config `resolveMajor()`; gallery boots per-run via webServer, `reuseExistingServer:true` — if the agentct daemon gallery is up on 3101 with r19, a 17 run could attach to the wrong gallery; probe S2-17 checks `html[data-react-version]` behavior via test output, else log gap).

## Run log

### 16:37 UTC — PLAN WRITTEN. Opening P0 probe.

### 16:52 UTC — P0 PROBE VERDICT (vehicle works, snapshot rule locked)

- `--browser=firefox` is **unusable**: `Error: Cannot use --browser option when configuration file defines projects. Specify browserName in the projects instead.` `pnpm agentct` has no browser support either. FF/WebKit require projects.
- **Vehicle:** `/tmp/sweep-ct.config.ts` (throwaway, never committed, zero tree residue) — mirrors the CT config with absolute paths and two projects, `react{major}-firefox` (Desktop Firefox) + `react{major}-webkit` (Desktop Safari). Invocation: `pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts <spec> --project=<proj> --ignore-snapshots`. Note: `--dir` must be the package root (runner does `pnpm --dir <target> exec`), hence `--config=` (the `=` forms forward through the runner).
- **Snapshot rule:** P0 (`FI-DOM-01` on FF) failed ONLY on `toHaveScreenshot(field-root-resting.png)` — `239 pixels (ratio 0.01) are different`, font-raster class. Re-run with `--ignore-snapshots` → `1 passed`. **All FF/WebKit legs run with `--ignore-snapshots` (behavioral signal only).** Non-Chromium visual drift is an explicit sweep gap: no per-browser baselines exist, and writing any is out of lane (human-gated + Chromium-by-design).
- Gallery: nothing on :3101; each run boots its own vite via webServer (`reuseExistingServer:true`, sequential runs, no collision).

### 16:52 UTC — S1 OPEN (NumberField FORM leg, FF + WebKit).

### 16:43 UTC — S1 CLOSED. NumberField: FF 38/43, WebKit 41/43. 7 findings (F1–F7), all Chromium-green per FORM crew.

FORM leg alone: FF 2/3 (FORM-12 red), WebKit 3/3.

| # | Spec (react19) | FF | WebKit | Failure (quoted) |
|---|---|---|---|---|
| F1 | NF-FORM-12 | RED | green | `commit-lab-log` Expected `"log: 9"` Received `"log: 9,9"` |
| F2 | NF-EDIT-06 | RED | — | `:924` after `End`: `sel()` Expected `[1,1]` Received `[0,0]` |
| F3 | NF-EDIT-14 | RED | green | `commit-lab-log` Expected `"log: 42"` Received `"log: 42,42"` |
| F4 | NF-COMMIT-02 | RED | green | `commit-lab-order` Expected `"order: key,request"` Received `"order: key,request,request"` |
| F5 | NF-COMP-01 | RED | green | `commit-lab-log` Expected `"log: 99,100"` Received `"log: 99,99,100"` |
| F6 | NF-EDIT-06 | (F2) | RED | `:926` after `Home`: `sel()` Expected `[0,0]` Received `[1,1]` (inverse line vs FF) |
| F7 | NF-COMMIT-01 | green | RED | `expect(commit-lab-outside).toBeFocused()` — `Expected: focused / Received: inactive` |

Pattern (observation, not diagnosis): F1/F3/F4/F5 = Firefox delivers a duplicate commit/request entry; F2/F6 = caret nav (`End` on FF, `Home` on WebKit) lands off-by-one vs Chromium; F7 = WebKit focus doesn't reach the outside node on the blur-commit path. Raw logs: `/tmp/sweep-nf-ff.txt`, `/tmp/sweep-nf-wk.txt`.
Repro (any finding): `pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts 'src/components/NumberField/__e2e__/NumberField.ct.spec.ts' -g "<CASE-ID>" --project=react19-<firefox|webkit> --ignore-snapshots` (config is the sweep throwaway in /tmp; recreate from SWEEP.md P0 note if lost).

### 16:43 UTC — S2 OPEN (Announcer, FF + WebKit @r19, then @r17).

### 16:48 UTC — S2 CLOSED. Announcer: r19 FF 35/35, r19 WebKit 34/35, r17 FF 35/35, r17 WebKit 34/35. 1 finding (F8).

- F8 (both majors, WebKit-only): `ANN-DOM-03: live regions stay out of the tab order` — `:258 expect(hits.filter(h => h !== 'body').length).toBeGreaterThan(0)` → `Expected: > 0 / Received: 0`. Tab walk never leaves `body` on WebKit. FF + Chromium (REDS: 35/35 on 17/19) green.
- r17 vehicle proven genuine: `/tmp/sweep-probe` mounts a Field story and reads `html[data-react-version]` → `GALLERY_RUNTIME=17.0.2` under `CT_REACT=17`. (First probe attempt timed out: the attribute is set inside `window.mount` (main.tsx:26), not on page load — probe mounts before reading.)
- The REDS Announcer-17 fix holds on FF 35/35; the sole WebKit red is major-independent (F8 × r19 + r17).
- Raw logs: `/tmp/sweep-an-ff.txt`, `/tmp/sweep-an-wk.txt`, `/tmp/sweep-an17-ff.txt`, `/tmp/sweep-an17-wk.txt`.

### 16:48 UTC — S3 OPEN (Combobox 101, FF + WebKit).

### 16:56 UTC — S3 CLOSED. Combobox: FF 97/101, WebKit 85/101. Findings F9–F26 + gate notes G1/H1.

FF (4 reds):
- F9 CB-EDIT-03 caret: after `Home`, `selectionStart` Expected `0` Received `11` (:438).
- F10 CB-COMP-04 (locked shadow overlay): `:2636` focus-id chain Expected `"so-input"` Received `null`.
- F11 CB-COMP-02 list-mode: log has extra `+"input:Charlie"` (dup-input class).
- G1 CB-ENV-04 chromium gate: asserts UA contains `Chrome` — **by design, not a product red** (spec comment: "matrix engine layer owns the other engines"). Vacuous on FF/WebKit.

WebKit (16 reds = 15 product + G1):
- Tab-traversal class (`toBeFocused` → inactive, or landing-id null): F12 CB-DOM-09/COMMIT-04, F14 CB-COMMIT-07, F15 CB-COMMIT-04 source gate, F17 CB-SELECT-05, F18 CB-COMP-02 both-mode (`"fb-after"` vs null), F23 CB-COMP-02 list-mode (`"log-clear"` vs null), F25 CB-COMMIT-04 shift-tab (`"tab-before"` vs null). Consistent with F8 (WebKit Tab doesn't land on buttons/links the way the specs traverse).
- Home/End class: F13 CB-EDIT-03 caret (same as F9: `0` vs `11`), F16 CB-SELECT-08 trigger home/end (`aria-activedescendant` `"ref-opt-charlie"` vs `"ref-opt-bravo"`), F24 CB-SELECT-06 (same charlie-vs-bravo), F26 CB-SELECT-05 shift-tab (`"ref-opt-bravo"` vs `"ref-opt-alpha"`).
- Scroll-observation: F19 CB-VIRT-03 (`["scroll:10"]` vs `[]`), F21 CB-SELECT-08 windowed (`["scroll:98"]` vs `[]`).
- F20 CB-COMP-01: `locator.getAttribute: Test timeout of 30000ms exceeded` (probe timeout, :2356).
- H1 CB-COMP-04 on WebKit: `browserContext.newCDPSession: CDP session is only available in Chromium` — **harness-scoped, not product** (the test drives CDP; unrunnable off Chromium by construction).
- G1 repeats (UA `...Safari/605.1.15` vs `Chrome`).
Raw logs: `/tmp/sweep-cb-ff.txt`, `/tmp/sweep-cb-wk.txt`.

### 16:56 UTC — S4 OPEN (Listbox 72 + Tree 67, FF + WebKit).

### 17:08 UTC — S4 CLOSED. Listbox: FF 71/72, WebKit 70/72. Tree: FF 67/67, WebKit 64/67. Findings F27–F32.

- F27 LB-KEY-06 (FF): after `bravo.focus()` + `Tab`, `document.activeElement.role` Expected NOT `"option"` — still `"option"` (:1278). Tab didn't leave the option on FF.
- F28 LB-DOM-07 (WebKit): `toBeFocused()` → inactive (tab-focus class).
- F29 LB-ENV-03 ShadowRoot (WebKit): Expected `"sh-alpha"` Received `"sh-opt-0"` (roving/typeahead target id).
- F30 TR-DOM-09 (WebKit): `btn-after-empty` `toBeFocused()` → inactive (Tab from empty tree didn't land).
- F31 TR-CB-03 (WebKit): `cbs-trigger` attribute Expected `"tb-a"` Received `""`.
- F32 TR-CB-04 (WebKit): `cbs-trigger` attribute Expected `"tb-a"` Received `""`.
- Tree FF 67/67 fully green.
Raw logs: `/tmp/sweep-lb-ff.txt`, `/tmp/sweep-lb-wk.txt`, `/tmp/sweep-tr-ff.txt`, `/tmp/sweep-tr-wk.txt`.

### 17:08 UTC — S5 OPEN (Calendar 84 + DateField 57 + Field 21, FF + WebKit).

### 17:17 UTC — S5 CLOSED. Calendar: FF 83/84, WebKit 82/84. DateField: FF 56/57, WebKit 57/57. Field: 21/21 both. Findings F33–F36.

- F33 CA-DAY-10 (FF): multi-Day renderer diagnostic — console errors matching '2024-04-10'+'exactly one Day': Expected length 1, Received `[]` (:1951). (Note: CA-ENV-04 "chromium proof; others unrun" RAN and passed on FF here.)
- F34 CA-VIEW-12 (WebKit): `mswitch-month` `toBeFocused()` → inactive.
- F35 CA-RANGE-14 (WebKit): `rmachine-null` `toBeFocused()` → inactive (Tab leaving grid didn't land).
- F36 DF-CMT-07 (FF): `childless-changelog-count` Expected `"Changes: 0"` Received `"Changes: 1"` — stale composition end published on FF.
- Field fully green both engines.
Raw logs: `/tmp/sweep-ca-ff.txt`, `/tmp/sweep-ca-wk.txt`, `/tmp/sweep-df-ff.txt`, `/tmp/sweep-df-wk.txt`, `/tmp/sweep-fi-ff.txt`, `/tmp/sweep-fi-wk.txt`.

### 17:17 UTC — S6 OPEN (Tabs 26 + Collapsible 25 + Accordion 21, FF + WebKit).

### 17:27 UTC — S6 CLOSED. Tabs 26/26 both. Collapsible 25/25 both. Accordion: FF 21/21, WebKit 19/21. Findings F37–F38.

- F37 AC-KEY-11 (WebKit): `tab-trigger-a` `toBeFocused()` → inactive (tab-traversal class).
- F38 AC-FIND-CT-01 (WebKit): `find-content-2 span` Expected `hidden` Received `visible` (native beforematch reveal path).
Raw logs: `/tmp/sweep-tb-ff.txt`, `/tmp/sweep-tb-wk.txt`, `/tmp/sweep-co-ff.txt`, `/tmp/sweep-co-wk.txt`, `/tmp/sweep-ac-ff.txt`, `/tmp/sweep-ac-wk.txt`.

### 17:27 UTC — S7 OPEN (Menu 92 + Menubar 23, FF + WebKit).

### 17:29 UTC — S7 CLOSED. Menu: FF 90/92, WebKit 87/92. Menubar 23/23 both. Findings F39–F44.

- F39 MN-LINK-02 (FF): `btn-link-trigger` `toBeFocused()` → inactive (focus after native navigation).
- F40 MN-LINK-06 (**both engines**): nested download-link hash Expected `""` Received `"#nested-dl"` — the download link navigated the hash on FF and WebKit.
- F41 MN-CLOSE-01 :613 (WebKit): `tab-before` `toBeFocused()` → inactive (outside-press focus target).
- F42 MN-CLOSE-01 :1005 (WebKit): `sub-outside` `toBeFocused()` → inactive.
- F43 MN-ENV-03 ShadowRoot (WebKit): `btn-shadow-outside` `toBeFocused()` → inactive.
- F44 MN-CLOSE-09 (WebKit): `probe-extension` `toBeFocused()` → inactive.
Raw logs: `/tmp/sweep-mn-ff.txt`, `/tmp/sweep-mn-wk.txt`, `/tmp/sweep-mb-ff.txt`, `/tmp/sweep-mb-wk.txt`.

### 17:29 UTC — S8 OPEN (Presence 45 + Portal 22 + FocusLock 44 + Splitter 79, FF + WebKit).

### 17:33 UTC — S8 CLOSED. Presence 45/45 both. Portal 22/22 both. FocusLock: FF 44/44, WebKit 30/44. Splitter: FF 73/79, WebKit 73/79. Findings F45–F68.

FocusLock WebKit (14 reds; FF fully green):
- 12× `toBeFocused()` → inactive: F45 FL-SHARD-01 (`shard-button`), F46 FL-NEST-01/02/03 (`btn-open-inner-lock`), F47 FL-RESTORE-03 (`btn-proximity-right`), F48 FL-RESTORE-01 (`btn-trigger`), F49 FL-TAB-08 (`tab-c`), F50 FL-CAND-13/SHARD-06/ENV-03 (`portal-shadow-shard-btn`), F51 FL-SHARD-02 (`delayed-shard-btn`), F52 FL-SHARD-05 (`delayed-shard-btn`), F53 FL-RESTORE-09 (`btn-open-restore-lab`), F54 FL-COMP-01 (`btn-open-comp`), F55 FL-COMP-02 (`portal-shadow-shard-btn`), F56 FL-COMP-03 (`btn-proximity-right`).
- F57 FL-TRAP-02: `inside` (lock.contains(activeElement) after outside pointer) Expected `true` Received `false` (:426).
- F58 FL-TRAP-05: activeElement testid Expected one of `[trap-a, trap-c, …]` Received `null` (:471).
- Observation: uniform click/pointer-focus class — focus never lands on WebKit after pointer interaction.

Splitter FF (6 reds):
- F59 SP-END-01: `change-end-count` Expected `"2"` Received `"1"`.
- F60 SP-DRAG-04: `change-end-count` Expected `"1"` Received `"0"` (captured drag beyond edges: no end).
- F61 SP-DRAG-08: `change-end-count` Expected `"1"` Received `"0"`.
- F62 SP-DRAG-09 (**both engines**): `test-splitter-constrained` `not.toHaveAttribute` Expected not `""` Received `""`.
- F63 SP-COMP-02 (FF symptom): drag signals Expected `{cursor: row-resize, userSelect: none}` Received `{"",""}`.
- F64 SP-PERF-04 (**both engines**): CSS size signals Expected `panel0 52.531% / panel1 47.469% / root1 52.531%`, FF got `52.561/47.439/52.561`, WebKit `52.559/47.441/52.559` (sub-pixel rounding).
- SP-ENV-04 (the P2F-flagged remainder) PASSED on FF.

Splitter WebKit (6 reds):
- F65 SP-DRAG-07: after-drag `selection` Expected `""` Received `"\nRight (40%)"` — drag selected panel text (:634).
- F62 repeats (DRAG-09, both engines).
- F66 SP-DOM-02: cleanup `userSelect` Expected `""` Received `undefined`.
- F67 SP-COMP-02 (WebKit symptom of the same case as F63): `selection` Expected `""` Received multiline `"…Console (24%)"`.
- F68 SP-DYNAMIC-03: cleanup `userSelect` Expected `""` Received `undefined`.
- F64 repeats (PERF-04 rounding, WebKit values above).
Raw logs: `/tmp/sweep-pr-ff.txt`, `/tmp/sweep-pr-wk.txt`, `/tmp/sweep-po-ff.txt`, `/tmp/sweep-po-wk.txt`, `/tmp/sweep-fl-ff.txt`, `/tmp/sweep-fl-wk.txt`, `/tmp/sweep-sp-ff.txt`, `/tmp/sweep-sp-wk.txt`.

### 17:33 UTC — S9 OPEN (literal browser:all proof — Field, both projects, one run).

### 17:35 UTC — S9 CLOSED. Field both-projects-one-run: 42/42 (21 tests × FF + WebKit). `--browser=all` CLI is impossible with project-bearing configs (P0), so all-projects-in-one-run is the literal browser:all. Raw log: `/tmp/sweep-all.txt`.

### 17:35 UTC — S10 OPEN (opportunistic hermetic `@matrix/chain-t2`, background).

### 17:52 UTC — S10 CLOSED: BLOCKED (no verdict). Zero new output bytes for the last 11 min (file frozen at 2396 bytes since 17:41, last lines `Build @reference-ui/mcp ✔` / `Prepare @reference-ui/rust npm target dirs ✔`); 17 min elapsed with no Dagger phase output. Per the brief's >15-min fallback clause the run was terminated by the sweep crew (own process only). Hermetic chain-t2 verdict: UNKNOWN — gap 4 stands in full. Partial log: `/tmp/sweep-t2.txt`. Cleanup verified: nothing on :3101, no orphaned gallery vite. Tree: only this log modified, uncommitted per orders.

### 17:36 UTC — TREE-DRIFT CHECK. HEAD moved `c7fbc2713` → `d3cab957f` mid-sweep (captain: SITE-16 objective log + report). Diff is docs-only (`LOG.md`, `SITE16.md`, `REPORT.md`) — zero component/spec/runtime files changed. All sweep results stand on identical code. Working tree holds only this log as modified; sweep created zero repo files (configs + logs all in /tmp).

## FINAL REPORT (17:36 UTC; S10 in flight — see addendum)

Base: `c7fbc2713` (+ docs-only drift to `d3cab957f`, verified no-op for results). React 19 everywhere except the two Announcer r17 legs. All legs `--ignore-snapshots` (P0 rule: baselines are Chromium-raster).

### Per-target table

| # | Target (tests) | Firefox | WebKit | Findings |
|---|---|---|---|---|
| S1 | NumberField (43) | 38/43 | 41/43 | F1–F7 |
| S2 | Announcer r19 (35) | 35/35 | 34/35 | F8 |
| S2 | Announcer r17 (35, proven `17.0.2`) | 35/35 | 34/35 | F8 again |
| S3 | Combobox (101) | 97/101 | 85/101 | F9–F26, G1, H1 |
| S4 | Listbox (72) | 71/72 | 70/72 | F27–F29 |
| S4 | Tree (67) | 67/67 | 64/67 | F30–F32 |
| S5 | Calendar (84) | 83/84 | 82/84 | F33–F35 |
| S5 | DateField (57) | 56/57 | 57/57 | F36 |
| S5 | Field (21) | 21/21 | 21/21 | — |
| S6 | Tabs (26) | 26/26 | 26/26 | — |
| S6 | Collapsible (25) | 25/25 | 25/25 | — |
| S6 | Accordion (21) | 21/21 | 19/21 | F37–F38 |
| S7 | Menu (92) | 90/92 | 87/92 | F39–F44 |
| S7 | Menubar (23) | 23/23 | 23/23 | — |
| S8 | Presence (45) | 45/45 | 45/45 | — |
| S8 | Portal (22) | 22/22 | 22/22 | — |
| S8 | FocusLock (44) | 44/44 | 30/44 | F45–F58 |
| S8 | Splitter (79) | 73/79 | 73/79 | F59–F68 |
| S9 | Field all-projects (42) | 42/42 one run | — | — |
| **Total** | **1784 legs** | **872/892** | **838/892** | **68 findings + G1/H1** |

Grand green rate: 1710/1784 (95.9%). Fully green both engines: Field, Tabs, Collapsible, Menubar, Presence, Portal, Tree-FF, DateField-WebKit, FocusLock-FF.

### Finding index (all quoted inline above; repro command below)

- F1–F7 NumberField: FF dup commit/request (F1 FORM-12, F3, F4, F5), caret End/Home off-by-one (F2 FF, F6 WK), WK blur-commit focus (F7).
- F8 Announcer (r19 + r17, WK-only): ANN-DOM-03 tab walk never leaves body.
- F9–F11 Combobox FF: Home caret (F9), shadow focus id null (F10), dup input:Charlie (F11). G1: CB-ENV-04 chromium UA gate (by design).
- F12–F26 Combobox WK: tab-traversal ×7 (F12/F14/F15/F17/F18/F23/F25), Home/End ×4 (F13/F16/F24/F26), scroll-observation ×2 (F19/F21), probe timeout (F20), CDP harness (H1), G1 repeats.
- F27–F29 Listbox: FF Tab-stays-on-option (F27), WK focus (F28), WK ShadowRoot target id (F29).
- F30–F32 Tree WK: tab landing (F30), bridge trigger attr ×2 (F31/F32).
- F33–F36 Calendar/DateField: FF diagnostic capture (F33), WK focus ×2 (F34/F35), FF stale composition publish (F36).
- F37–F38 Accordion WK: tab trigger focus (F37), beforematch visibility (F38).
- F39–F44 Menu: FF nav focus (F39), download-hash both engines (F40), WK outside-press focus ×4 (F41–F44).
- F45–F58 FocusLock WK: focus-after-pointer ×12 (F45–F56), trap contains (F57), disable-move target null (F58).
- F59–F68 Splitter: FF end-count ×3 (F59–F61), cancel attr both (F62), cursor signals FF (F63), rounding both (F64), WK selection lock ×2 (F65/F67), cleanup userSelect ×2 (F66/F68).

Repro (any finding): `pnpm agent playwright --dir packages/reference-lib --config=/tmp/sweep-ct.config.ts 'src/components/<C>/__e2e__/<C>.ct.spec.ts' -g "<CASE-ID>" --project=react<19|17>-<firefox|webkit> --ignore-snapshots`, prefix `CT_REACT=17` for r17. Raw logs: `/tmp/sweep-*.txt` (34 files: per-target FF/WK + probe + all).

### Explicit gaps (NOT swept)

1. **Non-Chromium visual drift** — all legs `--ignore-snapshots`; no per-browser baselines exist. Any FF/WebKit paint/layout drift is unproven (P0 measured a 239px raster diff on Field/FF as the class exemplar).
2. **Chromium re-proof** — skipped by design (wave-1/finish-line already green on Chromium); no same-spec Chromium confirmation runs were made for the reds.
3. **React 17/18 × browsers** — swept ONLY for Announcer (the REDS fix). All other components are r19 × FF/WebKit. (r18 × any browser unswept everywhere.)
4. **Kept hermetic gate** — chain T1–T13 + MCP unswept except S10 (T2, in flight at report time — see addendum). These prove install/chain-topology, not component browsers.
5. **Components outside the brief** — Button, Icon, Measure, Overlay, Popover, ReferenceLibrary, RovingFocus, Showcase, Slider, Slot, Switch, Toast, Tooltip (incl. TT-HOVER/TT-POS/TT-ENV browser:all cases) were not swept (time/box scope).
6. **H1-class tests off Chromium** — any test driving CDP (CB-COMP-04 proven) cannot run on FF/WebKit by construction; count of such tests elsewhere is unknown.
7. **S10 result** — pending at report time; addendum follows or the captain harvests `/tmp/sweep-t2.txt`.

### Resume checklist

1. Harvest/close S10 (`/tmp/sweep-t2.txt`) or re-run `pnpm agent test --packages=@matrix/chain-t2`.
2. Triage F-clusters (suggested order by blast radius): WebKit tab/pointer-focus class (F8/F12/F14/F15/F17/F18/F23/F25/F28/F30/F34/F35/F37/F41–F58 — ~30 findings, likely one platform behavior + spec-traversal assumptions), Home/End caret + option-jump class (F2/F6/F9/F13/F16/F24/F26), FF dup commit/input class (F1/F3/F4/F5/F11/F36), Splitter pointer-session class (F59–F68), singles (F10/F19/F20/F21/F29/F31/F32/F33/F38/F39/F40/H1).
3. Decide G1 disposition (chromium-gate tests on other engines: skip-by-project vs keep-red) and whether per-browser snapshot baselines are wanted (closes gap 1).
4. Extend r17/r18 × FF/WebKit beyond Announcer if the landing needs it (gap 3); sweep the gap-5 components if breadth must grow.
5. Sweep scaffolding is all in /tmp (`sweep-ct.config.ts`, `sweep-probe*`, `sweep-*.txt`, `sweep-ct-results/`, `sweep-probe-results/`) — recreate the config from the P0 note if /tmp is ever cleaned; nothing to delete from the repo (only this log modified, uncommitted per orders).

## Captain triage + landing

- Lane held: zero fixes, only this log modified. Tree drift mid-sweep
  verified docs-only; all 1784 legs stand. S10 closed BLOCKED (frozen
  Dagger run, crew-terminated own process) — hermetic chain-t2 stays
  UNKNOWN, gap 4 stands. No addendum needed beyond the S10 note above.
- **Cluster 1 — WebKit focus (~30 findings):** F8, F12, F14, F15, F17,
  F18, F23, F25, F28, F30, F34, F35, F37, F41–F58. Tab/pointer focus
  never lands on WebKit. Undiagnosed: platform focus model vs product
  gap vs spec-traversal assumptions. Fixes are user-facing → HQ
  focus ruling required before any fix crew. → D1 diagnosis.
- **Cluster 2 — FF dup commit/input (6):** F1, F3, F4, F5, F11, F36.
  Duplicate request/commit/input entries on Firefox. Highest
  product-risk cluster (possible real double-commit). → D2.
- **Cluster 3 — Home/End caret (7):** F2, F6, F9, F13, F16, F24, F26.
  Selection/option-jump deltas. Platform vs product open. → D3.
- **Cluster 4 — Splitter pointer-session (10):** F59–F68. End-counts,
  selection lock, cleanup, plus F64 both-engine rounding (looks
  spec-tolerance). Flagged: Splitter fixes wait for HQ 4a ruling
  regardless of diagnosis.
- **Singles:** F10, F19, F20, F21, F29, F31, F32, F33, F38, F39, F40
  (F40 download-hash BOTH engines — needs a verdict, D-stretch).
- **G1 (chromium UA gate):** by design per spec comment; captain
  recommends skip-by-project with documented platform ownership —
  HQ confirms.
- **H1 (CDP):** harness-scoped, unrunnable off Chromium by
  construction → mark chromium-only, not a product red.
- **Next:** single DIAG crew (D1/D2/D3 + F40 stretch), report-only,
  60-min box. No fix crews until D-verdicts + HQ focus ruling.
  Gaps 1–7 stand as logged (gap-5 components unswept by box scope).

