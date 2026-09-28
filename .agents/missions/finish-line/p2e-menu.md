# P2E — Menu finish line (85/91)

Crew: finish-line Menu. No commits (captain commits). Scope held to
`packages/reference-lib/src/components/Menu/` (+ this report); zero
neighbor edits. Other modified files in the checkout belong to sibling
crews.

## Done

**Arc order held: Popover-root first.** FEATURES-A/B (Popover-root
anatomy, nested submenus, LinkItem) and W-28 (choice items) were already
landed; P2E proved and completed them: 32 new CT pins + 4 behavior fixes,
SPEC 31/91 → **85/91**, all green on React 17/18/19.

**Behavior fixes (`Menu.tsx`, +130/-~20)**
- Direction-from-root-trigger: portalled menu content loses the author's
  `dir`, so submenu keys, default placement, and intent fallback read the
  root trigger (the one node that stays in authored DOM). Fixes SUBKEY-04
  and makes RTL `left-start` a true default rather than a collision flip.
- Descendant-aware intent travel: travel inside an open descendant keeps
  every ancestor open (previously an l1→l2 crossing closed l1). COMP-03.
- Once-per-episode rejected close: a rejected hover-close requests once
  until re-entry instead of spamming every 300ms. SUBKEY-08.
- Context recipe: new `useMenuContextKeys()` (context press /
  ContextMenu key / Shift+F10 plant first-item entry) + RootMenu
  outside-`contextmenu` → tree dismiss (never prevented). COMP-02.

**Coverage closed (32 CT incl. all 5 COMP gates)**
SUBKEY-04/06/07/08, TYPE-03, CLOSE-02/06/07/09, INTENT-02..08,
DOM-08/10, DYNAMIC-02/04, CHOICE-10, LINK-06/09, COMP-01..05. New
stories: `SubmenuRtl`, `SubmenuProbe` (9 sections), `ChoiceDynamic`,
`LinksDynamic`, `ContextMenu` (Overlay-direct + virtual anchor),
nested-links section in `Links`. Docs: SPEC index + P2E adaptations,
FEATURES #1-4 LANDED, PATCHES #1/#3 DONE, Menu.md context recipe.

**HQ calls taken on maintainer-take (flagged):** FEATURES #5 skip —
verified Menubar roves horizontally itself (FOCUS-04 stays `[ ]`);
FEATURES #6 doubtful — no consumer (ACT-07 `[ ]`); PATCHES #2 still
blocked — no RovingFocus session API, Menu-side tracking would fork
behavior against TYPE-04 (TYPE-02 `[ ]`).

## Remaining / handoffs

- `[ ]` CLOSE-03 + CLOSE-10 (FocusLock shard / nested dialog) —
  Overlay-owned layer wiring, outside Menu scope.
- `[ ]` ENV-04 — CT is Chromium-only; needs the matrix engine sweep.
  (Flipped honest: the old `--react all` proof conflated React with engines.)
- Follow-ups for owning crews: Popover `anchor` passthrough (COMP-02
  composes Overlay-direct until then); Portal `dir` propagation (would
  retire the root-trigger direction adoption); RovingFocus Space gate.
- Menubar hover-switch/typeahead/Tab-out: left for the sweep per brief
  (Menubar scope, not Menu). Menu root is stable.
- Test-pattern note: pointer/keyboard entry focus lands on rAF, so every
  open→programmatic-focus→key sequence now settles entry first (one
  line). Pre-existing tests got this only where they flaked (ACT-02);
  the sweep may want it everywhere.
- Typecheck: zero errors in Menu files; repo-wide failures are
  pre-existing in untouched NumberField/Slot files.

## Suites + results (`pnpm agentct`, this session)

- Final: CT **276/276** (92 per major, React 17/18/19), unit 43/43.
  Two snapshot tests unchanged (no paint drift). Flakes seen mid-run
  were entry-focus races under parallel load; all diagnosed and
  settled — final run is clean on all majors.
- Videos unviewable in this environment (binary refs unsupported);
  motion covered by per-frame behavioral asserts, not eyeballs.
