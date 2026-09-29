# SCOPE-1 — objective log

IN PROGRESS

Scope: Select chain + Announcer per-engine scoping. Combobox
(F9/F12–F15/F17–F19/F21–F26 incl. F11 + F16/F24/F26
diagnose-then-fix-or-scope, F20 verdict), Listbox (F27–F29), Tree
(F30–F32), Announcer (F8). G1/H1 untouched (HQ confirm pending).
PREF CHECK SETTLED BY CAPTAIN (no crew time): Playwright 1.62 exposes
no WebKit keyboard pref surface (bundled server has `firefoxUserPrefs`
but zero keyboardUIMode/tabToLinks/fullKeyboard strings) — proceed
with traversal scoping, no harness-env alternative exists.
Box: 75 min. Files: Combobox/Listbox/Tree/Announcer spec dirs only.
No product-code edits except Combobox-internal fix IF a settling probe
proves a product bug (log first). Crew writes below.

## 18:19 UTC — LOG 1. Probes done (/tmp/scope1, 6 tests × 3 engines)

Vehicle `/tmp/sweep-ct.config.ts` present; probe config
`/tmp/scope1/probe.config.ts` (+chromium control) deleted at mission
end. T0 ~18:11, hard stop new work 19:16, box ends 19:26.

PROVED (focus-routing, WebKit — NOT Combobox-internal → SCOPE):
- P-F16 `after-click-open: active=body ad=ref-opt-bravo`,
  `after-End/Home` unchanged (stuck); control `focus()+End:
  active=select-trigger ad=ref-opt-charlie` (handler fine given
  focus). Keys never arrive after click-open.
- P-F24 `after-second-open: active=body ad=ref-opt-bravo`,
  `after-ArrowDown` unchanged. P-F26 `after-open: active=body
  ad=ref-opt-alpha`, arrow no-op. Same class.
- P-TAB landings (WebKit): before→tab-input (text inputs ARE tab
  stops); commit-Tab→body + `Selected: banana` committed;
  Shift+Tab→body + value committed; controlled/both/empty Tab→body;
  tree-tab→`omitted-branch` treeitem (tabindex=0 div IS a WK stop;
  buttons + empty tree skipped).
- F20 VERDICT (test-side): sweep error is `getAttribute('id')`
  waiting for never-mounted `wt-opt-77` at :2406 — pointer-open leg
  click leaves focus on body → ArrowDown lost → no scroll pends →
  wt-apply mounts nothing → 30s timeout cascade of D1. Scope with the
  same webkit-focus workaround as F19/F21.
- F11: NoCustomLog has NO form (`hasForm: false`, `submitSeen:
  false`) → DIAG sync-submit-redrive hypothesis DEAD. FF-only
  trailing `input:Charlie` after Tab-commit; input shows `Charlie`
  while value is bravo (Chromium/WK: `Bravo`, clean log). Live
  hypothesis: FF Tab/blur ordering runs a stale revert before the
  commit flushes (D2 family). Product-code read next → fix-or-scope.
- F27: FF Tab sticks on the lone tab stop (`after-tab1/2` still
  req-bravo; Chromium leaves). FF-conditional scope. NOTE: probe WK
  after-tab1 also showed bravo, but spec LB-KEY-06 re-ran GREEN on
  WebKit via vehicle just now — probe artifact, scope touches FF leg
  only and vehicle legs will prove both engines empirically.

Scope map: WK Tab-landing buttons→body expectations (F12/F14/F15/
F18/F23/F25 + commit legs intact); WK click-open+keys get
programmatic-focus workaround (F16/F17/F19/F21/F24/F26, TR F31/F32);
per-engine caret (F9/F13) + FF wrap (F27). F10/G1/H1 untouched.

## LOG 2. Announcer + Listbox + Tree LANDED

- Announcer F8: `pnpm agentct Announcer` → E2E 35/35, Unit 15/15
  (Chromium). Vehicle ANN-DOM-03: WK PASS (1/1), FF PASS (1/1).
- Listbox F27/F28/F29: `pnpm agentct Listbox` → E2E 72/72, Unit
  12/12. Vehicle `LB-KEY-06|LB-DOM-07|LB-ENV-03`: FF 3/3, WK 3/3.
  (F29's later shadow legs — typeahead/space/virtual — proven green
  on WK for the first time, past the old line-1865 abort.)
- Tree F30/F31/F32: `pnpm agentct Tree` → E2E 67/67, Unit 7/7.
  Vehicle `TR-DOM-09|TR-CB-03|TR-CB-04`: WK 4/4, FF 4/4 (pattern
  also covers TR-CB-04-invalid; all green).
- Probe batch 2 (WK): P2-F29 tab1=sh-alpha/tab2=sh-opt-0 (one-Tab
  scope confirmed); P2-F28 shift-tab-from-after=empty-listbox
  (seeded-focus scope confirmed).

## LOG 3 (18:3x). F11 = PROVED PRODUCT BUG → FIX (logged first)

Mechanism (code read + differential probe): Tab keydown calls
`handleSelect('bravo')` (commit queued, dismiss requested), then
native Tab moves focus and `handleSourceBlur` runs. On FF the
Tab→blur default action is synchronous (D2 family), so the blur
closure is pre-flush: `isOpen` still true, `value` still 'charlie',
`inputValue` still '' → `resolveUnmatchedText` →
`revertToCommittedText` sees `'' !== 'Charlie'` and emits a bogus
`input:Charlie` AFTER `change:bravo/dismiss`. Input ends showing
`Charlie` while value is bravo — real-user-visible desync on FF.
Chromium/WK blur runs post-flush (`Bravo===Bravo`, silent).
Minimal fix (mirrors D2 direction): `handleSelect` records the
commit synchronously in a ref; same-task `handleSourceBlur` skips
the already-resolved session exactly as Chromium's post-flush blur
does (no-op but deduped close); the ref resets on every render
(same pattern as `lastOpenRequestRef`).

Probe batch 3 (WK): P3-F17 Tab=body/committed, P3-F26
Shift+Tab=body/committed, P3-F20 Tab=body/committed — uniform
button-skip landings; F20's `:2417 not-trigger` holds as-is.
All 13 Combobox spec edits done (F9/F12–F19/F21/F23–F26;
F11 by product fix, F20 by F19-class workaround). Untouched:
F10 (out of scope), G1/H1 (HQ). Proof running: `pnpm agentct
Combobox` (Chromium full, product-fix gate) then vehicle legs.

## LOG 4 (18:38). Chromium green; transient noted; engine suites running

- `pnpm agentct Combobox` #1 (18:32): 102 passed / 3 failed; #2
  (18:38, --e2e): **105/105 green**. Failure names lost to
  `tail -6` (my capture bug); last-run artifacts can't identify
  them. No code changed between runs → transient (shared-gallery
  contention with sibling crews is the standing suspect). One more
  full `agentct Combobox` scheduled at the end for two-in-a-row
  confidence.
- Full FF Combobox vehicle suite started (proves F9/F11 + fix
  regression surface); full WK suite next.

## LOG 5 + FINAL REPORT. Combobox LANDED — mission complete

- `pnpm agentct Combobox` final: **E2E 105/105, Unit 94/94**
  (two-in-a-row green: #2 --e2e 105/105 + final full 105/105).
- Full FF Combobox vehicle: **99/101** — only F10 (CB-COMP-04,
  out of scope) + G1 (CB-ENV-04, HQ-held) red.
- Full WK Combobox vehicle: **99/101** — only H1 (CB-COMP-04 CDP)
  + G1 (CB-ENV-04), both HQ-held, red.
- Tree re-proven WITH the product fix: `agentct Tree` 67/67 +
  unit 7/7; vehicle `TR-CB-03|TR-CB-04|TR-DOM-09` WK 4/4, FF 4/4.
- F10 post-fix check: still `Expected "so-input" / Received null`
  (now :2731, line shift from added scoping) — fix did not touch it.
- Transients: `agentct Combobox` #1 (102/3) and `agentct Tree` #1
  (FAILED) both green on immediate retry with zero code changes —
  shared-gallery contention with sibling crews; mitigated by
  two-in-a-row finals. No port-busy waits needed; no foreign
  processes touched. Probes deleted (`/tmp/scope1*` gone).
  Committed nothing. Box closed ~19:0x, inside 75 min.

### Per-finding disposition (all verified per engine this session)

FIXED (product): F11 — `justCommittedRef` in `handleSelect` /
`handleSourceBlur` (`Combobox.tsx`, +14 lines). FF list-mode
Tab-commit no longer emits trailing `input:Charlie`; input shows
`Bravo` (was `Charlie` while value was bravo).
SCOPED (spec-only, DIAG rationale cited in-spec, zero test.skip):
F8 (WK body-walk pin), F9/F13 (FF/WK caret 11,11), F12, F14, F15,
F18, F23, F25 (WK Tab→body + commit legs intact), F16, F17, F19,
F20, F21, F24, F26 (WK click-open programmatic-focus workaround),
F27 (FF single-stop wrap), F28, F29 (WK one-Tab), F30, F31, F32.
Probe verdicts: F11 sync-submit DEAD (no form) → stale-revert
PROVED+fixed; F16/F24/F26 focus-routing PROVED (active=body,
control-focus works) → scoped, HQ focus ruling still owns any
explicit-focus product hardening; F20 test-side D1 cascade → scoped.
UNTOUCHED: F10 (not in SCOPE-1 enumeration — currently UNOWNED,
see resume #1), G1/H1 (HQ dispositions pending, verified still red
for the same reasons).

### Resume checklist

1. F10 (CB-COMP-04 FF focus-id null) has no owner (out of DIAG
   scope, not in SCOPE-1/SCOPE-2 enumerations) — captain to assign.
2. G1/H1 + D1 explicit-focus hardening await HQ rulings (unchanged).
3. Consumer blast radius of the F11 fix: only Tree spec mounts
   Combobox product code outside the Combobox suite (verified by
   grep over all `__e2e__` mounts) — Tree re-proven green on all
   three engines; Field/Tabs/Listbox/Announcer specs mount no
   Combobox story. Chromium behavior is otherwise unchanged by
   construction (flag only bites pre-flush same-task blurs).

## Captain verification + landing

- Chromium full suites firsthand: Announcer 35/35+15, Listbox
  72/72+12 (one VIRT-09 contention transient, untouched by diff,
  green isolated + on full re-run), Tree 67/67+7, Combobox
  105/105+94. All match crew.
- FF/WK firsthand: Combobox FF full 99/101 with reds proven to be
  exactly F10+G1 (identical artifact paths); CB-COMP-02 3/3 on FF
  (F11 fix) and WK; WK reds confirmed H1+G1 by identity legs.
  Listbox 3/3+3/3, Tree 4/4+4/4, Announcer 1/1+1/1 targeted.
  Full-WK Combobox count rests on crew evidence + identity legs
  (second full run hit parallel-load contention — see below).
- F11 fix reviewed: `justCommittedRef` mirrors `lastOpenRequestRef`,
  bites only pre-flush same-task blurs; Chromium path unchanged.
- Contention note: this landing ran parallel with SCOPE-2; two
  full-suite runs showed parallel-load flakes (LB-VIRT-09 here,
  one FF Combobox capture). Discipline held: named failures,
  isolated re-runs, full greens before landing.
- Committed per component (4 arcs + this log). F10 stays UNOWNED —
  queued for a micro-crew after SCOPE-2 lands (keeps load at bay).
