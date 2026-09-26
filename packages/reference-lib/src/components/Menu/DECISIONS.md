# Menu decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: root dropdown menu — trigger, content, items, separators.

Restructure note: OPEN/DEFERRED items now live in two companions —
PATCHES.md (mechanical, test-pinnable today) and FEATURES.md (needs a
design call). This file keeps Landed, every DECLINED item verbatim, and
non-decisions; moved items below are title + destination pointers only.

## Landed (context, 2-4 lines)

Quarantine-landing ported 11 zero-paint stability wins (cancelable `onSelect(event)`,
RovingFocus typeahead + `textValue`, Tab trigger-relative continuation, guarded focus
restore, stable id + `aria-controls`, forwardRef, verbatim `menu-intent.ts` unwired),
growing CT 2→30 and colocated 5→8 with all 8 frozen snapshots byte-identical; UX PASS.
Crew log: `.agents/missions/quarantine-landing/menu.md`; landing commit `c2d272034`.

## Candidate features (quarantine-sourced)

Moved items (title + destination):

- 1. Nested submenu model (recursive Menu + Trigger/Content) — moved to FEATURES.md #1, needs the submenu-arc design call.
- 2. CheckboxItem + RadioGroup/RadioItem parts — moved to FEATURES.md #2, needs choice-state API design.
- 3. LinkItem part — moved to FEATURES.md #3, needs navigation-vs-dismissal arc design.
- 4. Intent timer wiring (hover 100ms / close 300ms / 5px grace) — moved to PATCHES.md #1, fully specified, blocked only on submenus.
- 5. Popover-root anatomy (root adopts Popover layer, no own Overlay) — moved to FEATURES.md #4, needs the breaking-change decision.
- 6. Horizontal root orientation prop — moved to FEATURES.md #5, needs a Menubar consumer to justify the prop.
- 7. Press-drag-select activation — moved to FEATURES.md #6, needs the belongs-in-base-Menu product call.
- 8. Space-as-search during active typeahead buffer — moved to PATCHES.md #2, fully specified, blocked only on the RovingFocus gate.
- 9. CLOSE-08 strict form (focus retention on rejected Tab-close) — moved to FEATURES.md #7, needs the controlled-accept handshake design.
- 10. Shadow DOM composed-path ownership — moved to PATCHES.md #3, Menu-side adoption is mechanical, blocked only on Overlay semantics.

### 11. Focus-first-item-on-pointer-open — verdict: DECLINED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx`
  (`focusFirstItemOnOpenRef`, `lastRootOpenKey` entry tracking) +
  `matrix/lib/tests/e2e/menu.spec.ts`; case ID `MN-FOCUS-02` quarantine form.
- **API sketch:** what quarantine did: opening a MenuButton by primary click (or
  ContextMenu by right click) moves focus to the first enabled root Item once the
  menu mounts.
- **Why not landed:** killer reason — contradicts the pinned colocated test
  (no item focus on pointer open) and APG modality expectations; landing adapted
  `MN-FOCUS-02` to assert NO item focus after pointer opening, and the UX verdict
  endorsed the adaptation as APG-correct (log "Surprises" + "Handoff" item 9).
- **Revisit when:** essentially never — only if APG guidance flips to mandate
  focus-on-pointer-open, which would overturn the pinned test and every other
  overlay consumer's pointer policy first.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 12. `aria-orientation` attribute on Menu — verdict: DECLINED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx` + e2e; case ID `MN-DOM-09`
  strict-attribute form (omitted orientation must still expose vertical semantics).
- **API sketch:** what quarantine implies: render `aria-orientation="vertical"`
  (always today) so AT exposes orientation even when the prop is omitted.
- **Why not landed:** killer reason — ARIA-validity risk with no axe in the repo
  to verify it (log SKIP "aria-orientation attr (ARIA-validity risk, no axe in
  repo — DOM-09 behavioral)"); landing proves DOM-09 behaviorally (Up/Down rove,
  horizontal keys keep submenu meaning) and UX endorsed the omission.
- **Revisit when:** the repo gains axe coverage that can prove the attribute valid
  on `role=menu` in all three engines — then it is a one-line addition with a
  real assertion behind it.
- **Open questions:** none — hard DECLINED until axe exists (the one-line killer above).

## Suspected gaps (no quarantine source)

Moved items (title + destination):

- 3. Configurable intent timing props — moved to FEATURES.md #8, needs the escape-hatch design call.

### 1. MenuButton / ContextMenu / Menubar as lib components — verdict: DECLINED

- **Evidence:** the catalog-walker reflex ("menus need Button/Context variants");
  explicitly refused by TESTS.md freeze ("not reasons for another top-level
  MenuButton or ContextMenu component"), `Menu.md` ("Menubar is RovingFocus over
  always-visible Menu triggers — a documented composition, not a freeze
  primitive"; "ContextMenu is Popover with a virtual pointer anchor + Menu"),
  and SPEC.md "Won't do" ("ContextMenu / Menubar as freeze primitives").
- **API sketch:** what HQ would be asking for: `<MenuButton>`, `<ContextMenu>`,
  `<Menubar>` ready-made components bundling trigger + popover + menu.
- **Why not landed:** killer reason — each is ~10 lines of documented composition
  (TESTS.md `MN-COMP-01/02` prove the recipes without new parts); freezing them
  as components would fork trigger/open policy across N owners instead of one
  Popover + Menu pair.
- **Revisit when:** usage data shows one composition copied verbatim with drift —
  promote that one to a recipe doc first, a component never before that. (Virtual
  pointer-anchor support itself is Popover-owned, not a Menu gap.)
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 2. Public `Menu.Sub` alias — verdict: DECLINED

- **Evidence:** the Radix-familiar walker reflex ("where is Sub/SubTrigger/
  SubContent?"); explicitly refused by `Menu.md` ("There is no `Sub` /
  `SubTrigger` / `SubContent` namespace"; "**Leave** a public `Menu.Sub` alias";
  "Do not invent a parallel `Sub*` popover") and Convergence ("Leave … public
  `Sub*` parts").
- **API sketch:** what HQ would be asking for: `<Menu.Sub>`, `<Menu.SubTrigger>`, `<Menu.SubContent>` aliases
  over the nested-Menu model for vendor familiarity.
- **Why not landed:** killer reason — a second positioning API that would drift
  from `Overlay.Content` while teaching nothing new; nested Menu reuses the same
  owner, trigger-as-menuitem, and wrapped content at ordinary nesting depth.
- **Revisit when:** never as an alias — if vendor migration pain is demonstrated,
  the answer is a codemod recipe, not a second public namespace.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 4. Sections, virtualization, loading states, subdialogs — verdict: DECLINED

- **Evidence:** TESTS.md "Out of scope" ("Sections beyond RadioGroup, subdialogs,
  loading/virtualization, Menubar hover policy, NavigationMenu, or a second
  Menu-owned overlay runtime") and SPEC.md "Won't do" (visual polish, Overlay
  kernel rewrite).
- **API sketch:** what HQ would be asking for: `<Menu.Section>` grouping,
  virtualized long menus, async loading items, menu-launched subdialogs,
  NavigationMenu mega-menu primitives.
- **Why not landed:** killer reason — each is a different component's problem
  (RadioGroup already groups choices; long-menu scrolling is Popover `size`
  middleware per `Menu.md` "Available height"; dialogs are Overlay layers;
  NavigationMenu is explicitly left as a freeze primitive).
- **Revisit when:** a consumer shows a long-menu case Popover `size` middleware
  cannot scroll, or names a grouping need RadioGroup + Separator cannot express —
  no such case has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

## Non-decisions (rejected outright)

- Controlled-only rewrite (dropping `defaultOpen`/uncontrolled root state) — recon
  Exhibit 1 mangling; crew log SUSPECT; landing preserved uncontrolled exactly (commit msg).
- `p=2r` content padding (visual restyle of menu content) — crew log SUSPECT
  (visual); correctly rejected, UX verdict "Look: PASS frozen".
- `Menu.book.tsx` quarantine changes — crew log SUSPECT (book changes),
  landing kept Basic story byte-identical.
- Rewritten colocated tests ("unit proofs" replacing keyboard-nav/Escape/click
  tests) — recon Exhibit 5; crew log SUSPECT; landing kept all 5 originals.
- SPEC "Production-Yes" claims atop the rewrite — crew log SUSPECT; SPEC.md now
  states "Root menu only" with a 31/91 index.
- Global `lastRootOpenKey` tracker — crew log SUSPECT (current focusStrategy is
  cleaner); internal scaffolding, not API.

## Walkthrough notes for HQ

- Most important: FEATURES.md #1 nested submenu model — the entire missing
  ~60/91 cases hang off it; try the Book Default story, open the menu, and
  notice there is no Share-style submenu to hover — every SUBKEY/INTENT/
  CLOSE-tree case is that absent second level.
- Second: FEATURES.md #4 Popover-root anatomy — the one breaking decision in
  this doc; it must be answered before #1 can start, because root-owns-Overlay
  and nested-wrapped-Overlay cannot coexist; weigh the codemod cost now, not
  mid-arc.
- Third: FEATURES.md #2 + #3 choice and link parts — together they are the
  settings-menu and docs-menu stories; try arrowing through the current menu
  and notice every row is a plain command — no checkboxes, radios, or links
  exist yet.
- Then PATCHES.md (3 items, all mechanical): #1 intent timers you can feel by
  hovering a submenu that doesn't exist yet (blocked on FEATURES #1); #2
  Space-as-search you can feel by typing a prefix then Space and watching it
  activate instead of extending the search; #3 Shadow DOM you can feel only in
  a ShadowRoot mount, where outside-dismiss ownership is still Overlay's call.
- The two DECLINED candidates (§11 focus-on-pointer-open, §12 aria-orientation)
  and the three DECLINED suspected gaps (§1 MenuButton/ContextMenu/Menubar,
  §2 Menu.Sub alias, §4 sections/virtualization) need no product debate — each
  carries its one-line killer reason; only FEATURES.md #8 (intent-timing
  knobs) could ever reopen, and only on accessibility research, not taste.
