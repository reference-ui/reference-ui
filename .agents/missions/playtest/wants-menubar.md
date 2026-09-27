# wants-menubar crew log (W-29)

Status: COMPLETE

## Objective

Implement signed-off want W-29: standalone `Menubar` root (LOCKED API shape —
NOT `Menu.Bar`). Spec: root `WANTS.md` + `docs/MISSIONS/PLAYTEST-REQUIREMENTS.md`
Part 2; Radix Menubar + APG menubar prior art
(`.agents/missions/playtest/prior-art.md`).

Scope: NEW dir `packages/reference-lib/src/components/Menubar` (+ colocated
tests/stories) is ours to create. `Menu` dir is READ-ONLY. Never switch
branches (stay on `reference-system`); never commit (captain commits).

## Requirements (W-29 + HQ reshape)

- Open-one-closes-others via single `value` (`value`/`defaultValue`/`onValueChange`, Radix parity).
- Left/Right across triggers with an open menu (APG + Radix tables).
- Esc closes ONE LEVEL per press with focus return (APG contradicts "closes all").
- Focus restore correct; single-menu usage unchanged (no Menu edits).

## Plan

1. Study Menu/Popover/Overlay/RovingFocus + APG/Radix keyboard (done).
2. Implement `Menubar.tsx` + `menubar-nav.ts` (pure nav logic) + `index.ts`.
3. Colocated docs `SPEC.md`/`TESTS.md`; stories `Menubar.story.tsx`.
4. Unit tests (`menubar-nav.test.ts`, SSR) + CT `__e2e__/Menubar.ct.spec.ts`.
5. `sync` styles, then `pnpm agentct Menubar` (React 19) until green.
6. Mark COMPLETE, report files/suites/flags.

## Progress

- 2026-09-27: IN PROGRESS. Discovery done (APG keyboard fetched, Radix API
  fetched, Menu/Popover/RovingFocus/Overlay.Trigger read). Design: Menubar root
  owns single value; Menubar.Menu owns one controlled Popover; Trigger =
  RovingFocus.Item + Popover.Trigger (role=menuitem); Content = Popover.Content
  + auto-wrapped Menu root (Menu.* items compose unchanged, incl. nested
  submenus for the one-level Esc proof).
- 2026-09-27: COMPLETE. Implemented + verified. Unit 17/17, CT 23/23
  (React 19), Menu unit 39/39 (unchanged proof), tsc clean for Menubar,
  Menu dir untouched (empty diff). Two real bugs found by CT and fixed:
  (1) RTL content-switch read direction from the portaled host (always
  ltr) — now reads the bar root; submenu-parent yield reads the item
  itself exactly like MenuTrigger, so the two owners never double-handle.
  (2) OPEN-03 test bug (reject-toggle click is an outside press) — test
  rewritten, component was correct. 4 settled snapshots created and
  visually verified (resting/file-open/edit-open-switched/submenu-open).
  webm videos unviewable here (no ffmpeg, reader takes mp4/mov only);
  motion rides Menu/Presence (proven by Menu CT), settled states pinned
  by snapshots + finished screenshots.
