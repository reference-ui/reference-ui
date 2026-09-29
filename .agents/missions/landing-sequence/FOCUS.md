# FOCUS — objective log

IN PROGRESS

Scope: Safari focus hardening (HQ RULED YES) + G1/H1 dispositions.
Restore (F47/F48/F53/F54/F56) + trap (F57/F58, TRAP-05 race evidence
in SCOPE2.md) + F52/F46 trap tails; D3 trigger-jump probe first
(activeElement-at-keypress timeline) → explicit-focus fix IF
confirmed, else scope. G1 → skip-by-project, H1 → chromium-only
(captain's call, HQ-deferred). Product edits: FocusLock/Overlay
only; specs as needed. Box: 75 min. Crew writes below.

## 20:45 UTC — OPEN (T+0; hard stop new work 21:38, box ends 21:48)

Vehicle `/tmp/sweep-ct.config.ts` present. SCOPE-1 CLOSED (F16/F24/F26
focus-routing PROVED P-F16/P-F24/P-F26 + spec workaround landed;
G1/H1 untouched-held). SCOPE-2 CLOSED (F52/F46 trap tails noted
in-spec; TRAP-05 1/5-green race evidence). FIXD2/F10 CLOSED. No
sibling owns FocusLock/Overlay/Combobox-trigger now — SPLIT/NFLAST
are disjoint lanes.

Legs: restore → trap → trigger → G1/H1. Probe config
`/tmp/focusprobe/probe.config.ts` (+chromium control project) +
`/tmp/focusprobe/probe.spec.ts`; both deleted at mission end.

## 20:55 UTC — PROBE VERDICTS (one batch, all 4 decisive, T+10)

P-RESTORE — DIAG hypothesis CONFIRMED:
- WK OPEN: `pd:btn-trigger active=BODY | md | click active=BODY |
  in:lock-btn-first rel=null T` — opening click NEVER focuses the
  trigger, so activation captures origin=body (FocusLock.tsx:285-292).
- WK CLOSE: `pd/md btn-close-lock | out:lock-btn-first rel=null |
  click active=BODY | mut active=BODY` — end active=BODY, no restore.
  alreadyMoved=false (active=body) yet captured=body → no target.
- Chromium CLOSE: `... in:btn-trigger rel=null T` — restore lands.
- Fix: pointerdown-target fallback origin (pointer target IS the
  opener while activeElement is body).

P-TRAP02 — F57 CONFIRMED, mechanism REFINED (no focusin at all):
- WK: `pd:trap-outside | md | out:trap-a rel=null | click active=BODY`,
  inside=false. Falling to body emits focusout ONLY — no focusin
  reaches `handleFocusIn`, so the body+null guard is never even the
  issue; containment is lost silently.
- Chromium: `out:trap-a rel=trap-outside | in:trap-outside | ... |
  in:trap-a` — focusin path reclaims.
- Fix: focusout-based reclaim (target inside, relatedTarget
  null/body/outside, document.hasFocus() true).

P-TRAP05 — F58 CONFIRMED (rAF race):
- WK: `md | out:trap-b rel=null | click active=BODY |
  mut:trap-b.disabled active=BODY | in:trap-a` — mousedown pre-blur
  beats the disabling click; only the rAF `queueReclaim` lands
  trap-a (this run was the green side; spec reads pre-rAF 4/5).
- Chromium: click focuses btn-disable first; disable is a no-move.
- Fix: same focusout-reclaim makes it synchronous (pre-blur reclaim
  to trap-b, disable-blur reclaim to trap-a/c) — deterministic.

P-D3 — focus-routing CONFIRMED firsthand (matches SCOPE-1 P-F16):
- WK: `open:active=body ad=ref-opt-bravo | End: unchanged |
  Home: unchanged`. Chromium: bravo→charlie→alpha.
- Fix per orders: explicit trigger `.focus()` in the pointer path.

## 21:10 UTC — RESTORE + TRAP LEGS CLOSED (T+25)

Product: `FocusLock.tsx` (+pointer-origin fallback, +focusout
reclaim; no prop/type/export changes).
- Restore: module-level per-document pointerdown recorder, installed
  at import (opening click precedes mount — lazy install would miss
  it); activation origin chain gains `pointerFallback` between
  defaultTarget and body. SSR-guarded.
- Trap: `handleFocusOut` reclaims when focus leaves the lock for a
  non-inside target; `hasFocus()` gate skips window-blur. Existing
  focusin body+null guard untouched (TRAP-03 path).

Proof:
- Chromium `pnpm agentct FocusLock`: 44/44 e2e + 18 unit (unmoved).
- WK held 7/7: RESTORE-01/03/09, COMP-01/03, TRAP-02/05 (were 6×
  5/5-red + TRAP-05 4/5-red per SCOPE2).
- WK full: 44/44 (F46 settled-set + F52 tail hold under the new
  origin/reclaim behavior). TRAP-05 `--repeat-each=5`: 5/5.

## 21:16 UTC — TRIGGER + G1/H1 EDITS IN (T+31)

- D3: `ComboboxTrigger.handleClick` focuses `e.currentTarget`
  before toggling (re-delivers click-focus on Safari; no-op on
  Chromium/FF where the click already focused). Input trigger
  untouched (text inputs get WK click-focus natively). SCOPE-1's
  webkit-only spec workaround stays (now redundant, harmless).
- G1: CB-ENV-04 `test.skip` off-Chromium (spec comment assigns
  other engines to matrix — cited in-spec).
- H1: CB-COMP-04 touch leg `browserName === 'chromium'` (CDP by
  construction; extends the landed F10 FF wall to WK).
- Watch: FocusLock focusout-reclaim vs F10's pinned FF body
  landing in CB-COMP-04 (F10 probe saw zero focusout on that path
  → expected unchanged; FF full leg will prove).

## 21:37 UTC — D3 TOGGLE RACE FOUND + FIXED (T+52)

WK full CB after the trigger-focus fix: 99/100 — only CB-OPEN-04
red (`aria-expanded` stuck "true" at :404). Mechanism: the fix
focuses the trigger, so the close-click's Safari mousedown pre-blur
now fires `handleSourceBlur` → dismiss, and the click toggle
re-opens. Fix: `ComboboxTrigger.handleMouseDown` preventDefaults
the mousedown (holds focus; toggle stays one decision; consumer
onMouseDown composed). WK CB-OPEN-04 1/1 after.
FF full CB: 96/100 + 4 infra flakes (`error loading dynamically
imported module` for icon chunks — gallery contention with the
live NFLAST crew, tests never mounted) → 4/4 green isolated.
CB-COMP-04 green on FF: F10's pinned body landing holds under
focusout-reclaim (F10 probe's zero-focusout path confirmed).

## FINAL REPORT (21:52 UTC, box +4 verification overrun)

Per-finding (fixed/scoped; Chromium always `pnpm agentct`, FF/WK
sweep vehicle `--ignore-snapshots`):
- RESTORE F47/F48/F53/F54/F56: FIXED (pointer-origin fallback).
  WK red→green, Chromium unmoved (44/44+18u).
- TRAP F57/F58: FIXED (focusout reclaim; F58's rAF race now
  synchronous — TRAP-05 5/5). WK red→green, Chromium unmoved.
- F52/F46 trap tails: hold green under the new behavior (WK full
  44/44; F46's settled set accepts the opener restore).
- D3 F16/F24/F26: FIXED (trigger focus + mousedown hold).
  SCOPE-1's webkit workaround stays (redundant, harmless).
- G1: skip-by-project (`test.skip` off-Chromium; matrix owns
  other engines per the spec comment, cited in-spec). H1:
  chromium-only (touch leg `browserName === 'chromium'`; CDP by
  construction, extends F10's FF wall).
- Overlay dir: untouched (no fix needed there).

Outputs quoted per engine:
- FocusLock Chromium: 44/44 e2e + 18 unit. WK: 44/44. FF: 44/44.
- Combobox Chromium: 105/105 e2e (×3: 104/1 transient, 105, 105)
  + 94 unit. WK final: 100 passed + 1 skipped (G1), 0 failed.
  FF: 96 full + 4/4 isolated (infra flakes) + G1 skip.
- Probe verdicts: P-RESTORE confirm, P-TRAP02 confirm+refine (no
  focusin on body-fall), P-TRAP05 confirm (rAF race), P-D3
  confirm firsthand (match SCOPE-1 P-F16). All quoted above.

Skips: none — every assigned finding landed. Transients: 1×
Chromium CB run (104/1, unattributed — same capture bug as
SCOPE-1; two-in-a-row 105/105 after; NFLAST proven live on the
shared daemon), 4× FF CB module-load flakes (4/4 isolated).
No port waits (no busy events); no foreign processes touched.

Resume checklist:
1. Captain verify + commit (FocusLock.tsx + Combobox.tsx +
   Combobox spec + this log; NEVER commit per orders — left
   uncommitted; NFLAST's NumberField files are the sibling's).

## Captain verification + landing (partial: Combobox green, FocusLock held)

- Combobox firsthand: Chromium 105/105+94u; WK 100+1skip(G1);
  FF 100+1skip(G1). One FF run collapsed 74-fail via gallery
  NS_ERROR_CONNECTION_REFUSED mid-run (infra, not product);
  clean re-run 100+1skip. D3 + G1/H1 VERIFIED — landing now.
- FocusLock firsthand: Chromium 44/44+18u; WK 44/44 (hold
  cleared). FF 43/44 ×2 — FL-RESTORE-10 red full-suite-only,
  green isolated. Same test, same duration twice = REAL
  order-dependent regression, not load. Suspect: module-level
  per-document pointer recorder persists across tests in the
  shared gallery (stale origin). NFLAST WIP exonerated (zero
  FocusLock→NumberField imports).
- Dispatched FOCUS-FIX micro-crew (FocusLock dir only): confirm
  mechanism, fix, prove FF full ×2 + WK full + Chromium.
  FocusLock.tsx + this log land when green.

## Captain verification + landing (FocusLock held arc)

- FOCUS-FIX refuted the captain's stale-origin hypothesis with a
  harness fact (fresh page.goto per test — module state cannot
  persist) + red⟺slow correlation. Real mechanism: swallowed setup
  click under contention (handler never ran, traced in-page).
  Product was correct; 1-line spec fix (setup → Enter press).
- Firsthand: Chromium 44/44+18u; FF 44/44 ×2; WK 44/44. Matches.
- Committed (FocusLock arc + both logs). FOCUS fully CLOSED.
2. Probes/configs DELETED (`/tmp/focusprobe*` gone); repo holds
   only the 3 source/spec files + this log.
3. Note for future crews: WK blur-to-body emits focusout WITHOUT
   focusin — any containment logic keyed only on focusin is
   silently dead on Safari. The `hasFocus()` window-blur gate is
   the load-bearing discriminator in `handleFocusOut`.
4. F10.md's "HQ focus ruling owns any reclaim hardening" is now
   satisfied for the FocusLock×shadow×FF path (unchanged, still
   pinned) — no follow-up needed.
