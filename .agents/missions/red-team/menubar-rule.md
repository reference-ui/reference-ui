# RED-TEAM STAGE 3 (Rule oracle) — Menubar Hunt 1

Date: 2026-09-27. Branch: `reference-system` (never switched). READ-ONLY: no
source modified, no commits. Hunt report: `.agents/missions/red-team/menubar.md`;
Stage-2 verdict: `.agents/missions/red-team/menubar-repro.md` (3/3 REPRODUCED).

## Ruling: BREAK (user-facing, moderate severity)

Not latent, not a curio. A keyboard user who presses Up on an open menubar
trigger (a no-op press: nothing emits, the open menu is unchanged) and then
switches menus with Left/Right — or whose app opens any menu programmatically
afterward — lands focus on the LAST item of the newly opened menu instead of
the SPEC-pinned container-or-first landing. Focus placement is user-observable
and a11y-relevant. The T1-C probe is decisive against any working-as-designed
reading: a zero-gesture programmatic open inherits intent from a long-dead,
unrelated keypress. No documented contract blesses that.

## Kill chain (re-derived firsthand, not inherited)

1. `useMenuTriggerKeys().onKeyDown` (`Menu.tsx:56-73`) records
   `setMenuEntryIntent('first'|'last')` UNCONDITIONALLY — it never checks
   `overlay.isOpen`, so a press on an already-open trigger plants intent for
   an open transition that will never happen.
2. The same press calls `overlay.setIsOpen(true)` on an already-open root.
   `use-open-state.ts:21` (`onOpenChange?.(nextOpen)`) and
   `Popover.tsx:156` both fire `onOpenChange` unconditionally, so
   `MenubarMenu.handleOpenChange(true)` runs and `requestValue(menuValue)`
   dedups (`Menubar.tsx:70-73`) — no transition, intent lingers. (Stage-1's
   "Popover fires unconditionally" link verified at both layers.)
3. Menubar switch paths set no intent of their own — trigger arrows
   (`Menubar.tsx:257-265`) and content arrows (`Menubar.tsx:310-338`) call
   `requestAdjacent` only. Correct per SPEC; they must not change.
4. The newly opened menu's entry effect (`Menu.tsx:459-487`) consumes the
   stale `'last'` "once per open" and its rAF focuses the last enabled item.
   The module-global `pendingMenuEntry` (`Menu.tsx:41`) has no owner, so ANY
   later Menu open on the page — including a programmatic one — eats it.

## Violated contracts

- `Menubar/SPEC.md` adaptation: "MB-KEY-03/MB-KEY-06 land focus inside the
  newly opened menu (container or first item via Menu entry effects), not on
  the newly focused trigger." Observed landing is the LAST item.
- `Menu/Menu.md`: "The opening key is consumed once per open." The consumed
  intent here belongs to a NON-opening key — a press that opened nothing —
  paired with an unrelated later open. The plant/consume pairing the sentence
  describes is broken at the plant site.

## Fortify boundary (exact)

**May change** (one of; prefer the first):
- (a) The plant site: `useMenuTriggerKeys().onKeyDown` in `Menu.tsx:56-73` —
  record intent only when the press will actually open (i.e. gate on the
  overlay being closed). A press on an already-open trigger must plant
  nothing. Note `overlay`/`isOpen` must enter the `useCallback` deps honestly;
  a stale closure that mis-gates reintroduces the leak from the other side.
- (b) The consume site: `RootMenu` entry effect in `Menu.tsx:459-487` — only
  if (a) is shown insufficient during fortify; justify in the fortify report.

**Must move together:**
- Whatever gates the plant must keep the four plant keys (Down/Enter/Space →
  `'first'`, Up → `'last'`) and the pointer path (`onClick` clearing to
  `null`, `Menu.tsx:75-79`) behaving exactly as today for genuine opens.
- `Menu/Menu.md` line 135-136 ("consumed once per open") must gain one
  sentence pinning the pairing: intent is recorded only by a press that opens
  (or is cleared when no open follows) — docs must describe the fixed
  behavior, not the old leak.

**Sweep obligations (done for the fortify — no hidden consumers):**
- Repo-wide sweep for `useMenuTriggerKeys` /
  `setMenuEntryIntent` / `consumeMenuEntryIntent` / `pendingMenuEntry` finds
  exactly: `Menu.tsx` (plant + consume), `Menubar.tsx:217` (plant via hook),
  `Menu.test.tsx` (test harness), `Menu.md` (docs). No Select / Dropdown /
  Combobox / Popover sharing. The fortify touches Menu (+ Menubar only if its
  tests need pins); nothing else reads this cell.

**Stays untouched:**
- Overlay/Popover open-state (`use-open-state.ts`, `Popover.tsx`): the
  unconditional `onOpenChange` fire is by design (consumers dedup;
  Menubar's "Never redundant" `onValueChange` contract is honored by
  `requestValue`). Do NOT add dedup there to fix this.
- Menubar switch paths (`requestAdjacent`, trigger/content arrow handlers):
  setting no intent is correct — do NOT add intent-setting to switches.
- `requestValue` dedup, RovingFocus, `menubar-nav.ts`, Esc/dismiss paths,
  pointer-open focus behavior, and every floor item in the Hunt-1 map
  (duplicate values, Tab continuation, typeahead, RTL, React 17 refs).

**Pins the fortify owes (all fail-without-fix / pass-with-fix, proved firsthand):**
- P1: Up-on-open-trigger then trigger-arrow switch lands container-or-first
  (T1-A equivalent, committed in Menubar tests).
- P2: Up-on-open-trigger then content-arrow switch lands container-or-first
  (T1-B equivalent).
- P3: Up-on-open-trigger then programmatic open lands container-or-first
  (T1-C equivalent — the zero-gesture case).
- P4: Standalone Menu pin — Up/Down on an already-open trigger plants no
  consumable intent (close, reopen via its own Down → first; via Up → last;
  programmatically → container). Guards the plant-site fix at its own level.
- No weakened tests; no blanket golden updates. The `/tmp/menubar-red/` blind
  repro must go green unmodified as the chain-review oracle check.
