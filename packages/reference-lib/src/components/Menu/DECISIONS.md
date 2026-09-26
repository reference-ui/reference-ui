# Menu decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: root dropdown menu — trigger, content, items, separators.

## Landed (context, 2-4 lines)

Quarantine-landing ported 11 zero-paint stability wins (cancelable `onSelect(event)`,
RovingFocus typeahead + `textValue`, Tab trigger-relative continuation, guarded focus
restore, stable id + `aria-controls`, forwardRef, verbatim `menu-intent.ts` unwired),
growing CT 2→30 and colocated 5→8 with all 8 frozen snapshots byte-identical; UX PASS.
Crew log: `.agents/missions/quarantine-landing/menu.md`; landing commit `c2d272034`.

## Candidate features (quarantine-sourced)

### 1. Nested submenu model (recursive Menu + Trigger/Content) — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx` (`TreeContext` /
  `MenuLevelContext` / `NestedMenuContext`, submenu open/dismiss orchestration) +
  `matrix/lib/src/menu.tsx` submenu fixtures; case IDs `MN-SUBKEY-01..10`,
  `MN-CLOSE-02/03/04/06(sub)/07/10`, `MN-DYNAMIC-02/04`, `MN-DOM-08/10`,
  `MN-FOCUS-06`, `MN-COMP-03` (all `[ ]` in SPEC.md).
- **API sketch:** per `Menu.md` proposed API — nested `<Menu open onOpen onDismiss>`
  renders no node; `<Menu.Trigger>` (`div[role=menuitem]`, valid only when nested);
  `<Menu.Content>` (wrapped `Overlay.Content`, defaults `right-start`, mirrored
  `left-start` in RTL); omitted nested `open` is controlled false; one child layer
  per open submenu; Left/Right (+RTL mirror) open/close; Escape closes one level.
- **Why not landed:** missing-parts work — the single largest unlanded surface
  (SPEC.md "Production: root menu only", work-order item 1). Needs submenu parts,
  Popover-root anatomy (§5), intent wiring (§4), and layer/shard composition with
  Overlay; landing kept root-only and green instead of a half-built tree.
- **Revisit when:** HQ approves the submenu build as a designed arc (anatomy first,
  then SUBKEY keys, then intent, then layer policy) — SPEC.md "Done when" requires
  every TESTS.md ID `[x]`, which is impossible without this.
- **Open questions:** recursive-nesting depth limit (if any)? Do `Menu.Trigger` /
  `Menu.Content` outside a nested Menu warn, throw, or render inert? Is
  `MN-SUBKEY-05` level-local Escape (vs Radix whole-tree Escape) confirmed product
  policy?

### 2. CheckboxItem + RadioGroup/RadioItem parts — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx`
  (`MenuCheckboxItemProps` / `MenuRadioGroupProps` / `MenuRadioItemProps`) +
  `matrix/lib/tests/e2e/menu.spec.ts` choice matrix; case IDs `MN-CHOICE-01..07`,
  `MN-CHOICE-09/10`, `MN-COMP-04` (all `[ ]`; only `-08` plain-item policy is `[x]`).
- **API sketch:** per `Menu.md` — `<Menu.CheckboxItem checked={bool|"mixed"}
  onChange>` (`role=menuitemcheckbox`), `<Menu.RadioGroup value onChange
  aria-label>` (`role=group`) + `<Menu.RadioItem value>` (`role=menuitemradio`);
  both default `closeOnSelect=false`; checkbox requests opposite boolean
  (`mixed`→true), radio requests its value; controlled ARIA changes only after
  parent prop change; state request precedes dismissal when explicitly closing.
- **Why not landed:** missing parts named in SPEC.md "Gaps & incoherence" and log
  SUSPECT ("CheckboxItem/RadioGroup/LinkItem parts"). Landing proves only the
  plain-item close-policy slice (`MN-CHOICE-08`); choice state ownership was never
  going to fit a stability landing.
- **Revisit when:** a settings-menu consumer needs stateful commands in one
  navigation owner (SPEC work-order item 3), or the submenu arc (§1) lands and
  choice parts ride it — `MN-COMP-04` is the acceptance gate.
- **Open questions:** is `"mixed"` a first-class consumer state or an internal
  tri-state convenience? Does activating an already-selected RadioItem really fire
  `onChange` with the same value (TESTS.md says yes — confirm)?

### 3. LinkItem part — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx` (`MenuLinkItemProps`,
  `a[role=menuitem]`) + `matrix/lib/tests/e2e/menu.spec.ts` link matrix; case IDs
  all `MN-LINK-01..09`, `MN-COMP-05` (all `[ ]`).
- **API sketch:** per `Menu.md` — `<Menu.LinkItem href onSelect closeOnSelect>`
  renders a real `HTMLAnchorElement[role=menuitem]`; unmodified primary click /
  Enter / Menu-owned Space run handlers, preserve native navigation, then dismiss
  by default (`closeOnSelect=true`); `preventDefault` cancels both navigation and
  dismissal; modified/middle/right clicks stay fully native (no select, no
  dismiss); `target`/`download` retain native effect; disabled is non-navigable
  and outside roving/typeahead.
- **Why not landed:** missing part named in SPEC.md "Gaps & incoherence" and log
  SUSPECT. The native-navigation-vs-dismissal interleaving (LINK-02..06) is the
  subtlest activation contract in TESTS.md and needs its own designed arc.
- **Revisit when:** a docs/nav-menu consumer needs in-menu links (SPEC work-order
  item 3), or alongside §2 — `MN-COMP-05` (mixed link-and-command menu) is the
  acceptance gate.
- **Open questions:** Menu-owned Space synthesizes anchor activation — confirm no
  double-navigation across engines (LINK-03)? Should `closeOnSelect=false` links
  really keep the menu open *after* navigating (LINK-08)?

### 4. Intent timer wiring (hover 100ms / close 300ms / 5px grace) — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `menu-intent.ts` (+221, landed verbatim
  but unwired and unexported) + `matrix/lib/tests/e2e/menu.spec.ts` pointer matrix;
  case IDs `MN-INTENT-01..08` (all `[ ]`; only `-09` unit + `-10` root-hover are `[x]`).
- **API sketch:** no new public props — behavior: mouse hover opens an enabled
  submenu after exactly 100ms without moving focus; diagonal travel inside the 5px
  grace polygon keeps it open; travel clearly away requests close at 300ms;
  return-to-trigger and intent-switch close exactly once; resolved-side (post-flip)
  and RTL-mirrored geometry; touch never starts hover timers (tap activates once).
- **Why not landed:** nothing to wire it to — no submenus exist, and landing
  explicitly staged `menu-intent.ts` as "submenu follow-up fuel" (crew log FLAG
  unwired; UX verdict item 8 approved the NO-OP). Wiring timers onto a root-only
  menu would be pure theater.
- **Revisit when:** §1 nested submenus land — INTENT-01..08 are the acceptance
  suite, with `menu-intent.test.ts` (INTENT-09) already guarding the pure geometry.
- **Open questions:** none on timing (100/300/5px are frozen by TESTS.md decision 5);
  only question is whether intent switches submenus on hover-focus for keyboard
  parity or stays pointer-only (SUBKEY-10 covers the hybrid).

### 5. Popover-root anatomy (root adopts Popover layer, no own Overlay) — verdict: OPEN

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx` (removed own-Overlay root +
  `defaultOpen`/`onOpenChange` in favor of `open`/`onOpen`/`onDismiss` composed
  under Popover) + `matrix/lib/src/menu.tsx` Popover-wrapped fixtures; case IDs
  `MN-COMP-01`, `MN-CLOSE-04/07`, `MN-DOM-08/10` (all `[ ]`).
- **API sketch:** per `Menu.md` — root `Menu` renders `div[role=menu]` *inside* a
  consumer-wrapped `<Popover>` (Popover owns open state, placement, portal,
  Presence exit); root Menu adopts the Popover layer instead of registering its
  own; no second overlay runtime; current `Menu.tsx` own-`Overlay` root +
  `defaultOpen`/`onOpenChange` + button `Trigger` are replaced by this composition.
- **Why not landed:** breaking rewrite, not a port — it deletes the current
  uncontrolled root API and every current consumer's trigger wiring. Landing
  preserved the uncontrolled API exactly (commit message, UX verdict item 8 of
  feel list) and SPEC.md "Next agent" still documents own-Overlay as current.
- **Revisit when:** HQ decides the submenu-era anatomy — §1 nested Menu *requires*
  answering this first, because a nested `Menu.Content` as wrapped
  `Overlay.Content` cannot coexist with a root that owns a second overlay.
- **Open questions:** is the breaking change acceptable (major-version or codemod
  path)? Does root `Menu` keep a convenience `defaultOpen` under Popover, or does
  all open state move to Popover props? Who owns the root trigger button — Popover
  alone, or a MenuButton composition recipe?

### 6. Horizontal root orientation prop — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `Menu.tsx` (`orientation?: "vertical" |
  "horizontal"` on `MenuProps` + `MenuLevelContextValue`) + e2e orientation matrix;
  case IDs `MN-FOCUS-04`, `MN-DOM-02` (orientation semantics portion), `MN-DYNAMIC-03`
  (orientation-switch portion) — all `[ ]`.
- **API sketch:** `orientation?: "vertical" | "horizontal"` (default vertical);
  horizontal root roves with Left/Right (RTL-mirrored) while Up/Down stay out of
  root roving; cross-axis submenu open/close still fire exactly once; every
  `Menu.Content` stays vertical regardless.
- **Why not landed:** no horizontal prop exists and no consumer needs it — log SKIP
  (`FOCUS-04`: "no horizontal prop"). Menubar is a documented composition, not a
  freeze primitive (`Menu.md`), so landing proved vertical-only roving.
- **Revisit when:** a Menubar-style always-visible trigger row is designed as a
  composition on top of Menu, or `MN-DYNAMIC-03` orientation switching gets a
  consumer — whichever names the horizontal root first.
- **Open questions:** is horizontal root real product need or spec completeness?
  Does a horizontal root change submenu open/close keys (Up/Down as cross-axis)?

### 7. Press-drag-select activation — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `matrix/lib/tests/e2e/menu.spec.ts`;
  case ID `MN-ACT-07` (`[ ]` — "press the root trigger, drag into an enabled Item,
  release to select; release outside cancels").
- **API sketch:** no new props — behavior: primary press on the root trigger,
  pointer drag into an enabled Item, release there invokes one `onSelect` + one
  dismissal with release modality preserved; release outside the menu tree selects
  nothing; no synthetic duplicate across the down/up/click sequence.
- **Why not landed:** needs a press state machine Menu does not own — log SKIP
  (ACT-07 press-drag). Landing covered click/Enter/Space activation only
  (`MN-ACT-01/02/08`); drag paths touch trigger ownership shared with Popover.
- **Revisit when:** pointer-activation policy is designed jointly with Popover
  (press ownership, drag thresholds, touch-vs-mouse), or a consumer demonstrates
  the Base UI drag-release gesture as required behavior.
- **Open questions:** does press-drag belong in base Menu at all, or is it
  MenuButton-composition policy? Touch long-press vs drag-release — which gestures
  map to select vs cancel?

### 8. Space-as-search during active typeahead buffer — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `matrix/lib/tests/e2e/menu.spec.ts`
  (Base UI typeahead-vs-Space regression); case ID `MN-TYPE-02` (`[ ]`).
- **API sketch:** no new props — behavior: while a typeahead buffer is active
  (printable prefix typed, before timeout), Space extends the search (match or
  no-match, no `onSelect`/`onOpen`); after the buffer timeout, Space activates
  once as today. UX verdict explicitly frames the gap as "deferred enhancement".
- **Why not landed:** needs a RovingFocus order change — child-first dispatch runs
  `MenuItem` activation before typeahead sees Space (log SKIP TYPE-02, handoff to
  RovingFocus crew). Landing preserved Space-activates and proved the rest of
  typeahead (`MN-TYPE-01/04`).
- **Revisit when:** the RovingFocus crew lands a typeahead-session gate
  (Listbox shares it per `Menu.md`) letting the buffer claim Space before item
  activation; Menu then adopts `MN-TYPE-02` unchanged.
- **Open questions:** none for Menu — buffer timeout value and gate mechanics are
  RovingFocus product questions.

### 9. CLOSE-08 strict form (focus retention on rejected Tab-close) — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `matrix/lib/tests/e2e/menu.spec.ts`;
  case ID `MN-CLOSE-08` (adapted `[x]` — landed form asserts one request + retained
  open DOM but not focus retention).
- **API sketch:** no new props — behavior: when the parent rejects a Tab/Shift+Tab
  close request (open prop unchanged), focus is retained on the current Item and
  no background tabbable receives focus; current landed behavior moves focus
  optimistically before the rejection is known.
- **Why not landed:** strict retention needs an async accept signal — Menu cannot
  know the request is rejected until after the Tab default would have run (log
  SKIP "CLOSE-08 strict form (optimistic focus move…)"; SPEC.md Adaptations).
  Landing asserts what is deterministic today.
- **Revisit when:** a controlled-accept handshake is designed (defer Tab default?
  restore-on-reject?) — likely jointly with Popover/Overlay dismissal policy.
- **Open questions:** is prevent-then-restore acceptable Tab latency, or does the
  contract need a synchronous "will you accept?" predicate from the parent?

### 10. Shadow DOM composed-path ownership — verdict: DEFERRED

- **Source:** quarantine commit `42b1a2c35`, `matrix/lib/tests/e2e/menu.spec.ts`;
  case ID `MN-ENV-03` (`[ ]` — ShadowRoot mount, composed inside/outside paths,
  portal branch/layer cleanup).
- **API sketch:** no new props — behavior: root source/content mounted in an open
  ShadowRoot with `Menu.Content` portalled to its documented destination; composed
  inside paths never dismiss, actual outside paths dismiss once, focus/search use
  the owning root, branches/layers clean up.
- **Why not landed:** lib-wide framework concern, not Menu-owned (log SKIP ENV-03
  "shadow precedent-skip"; SPEC.md cites Tree/Switch precedent). Outside-dismiss
  ownership lives in Overlay; landing scoped it out deliberately.
- **Revisit when:** the Overlay crew (or a lib-wide pass) defines ShadowRoot
  ownership semantics once for all overlay consumers; Menu then adopts `MN-ENV-03`.
- **Open questions:** none for Menu — portal destination and composed-path
  ownership are Overlay product questions.

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
- **API sketch:** `<Menu.Sub>`, `<Menu.SubTrigger>`, `<Menu.SubContent>` aliases
  over the nested-Menu model for vendor familiarity.
- **Why not landed:** killer reason — a second positioning API that would drift
  from `Overlay.Content` while teaching nothing new; nested Menu reuses the same
  owner, trigger-as-menuitem, and wrapped content at ordinary nesting depth.
- **Revisit when:** never as an alias — if vendor migration pain is demonstrated,
  the answer is a codemod recipe, not a second public namespace.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 3. Configurable intent timing props — verdict: DEFERRED

- **Evidence:** the inevitable product ask ("can we tune hover delay per menu?");
  TESTS.md freeze decision 5 already answers: "the API intentionally exposes no
  per-submenu timing controls." Quarantine never proposed such props (fixed
  100/300/5px throughout `menu-intent.ts`).
- **API sketch:** what HQ would be asking for: `openDelay` / `closeDelay` /
  `gracePadding` props on nested Menu or MenuContent.
- **Why not landed:** no consumer asked, and fixed timing is what makes
  INTENT-01..08 deterministic acceptance tests instead of untestable preferences;
  per-menu knobs would also fork the shared-polygon helper `Menu.md` anticipates
  sharing with Popover.
- **Revisit when:** a real product menu demonstrates that 100/300/5px fails its
  users (motor-accessibility research, not taste) — then design it as one
  intentional escape hatch with frozen defaults, not three free knobs.
- **Open questions:** would the hatch be per-menu props, a theme token, or a
  `prefers-reduced-motion`-style media coupling?

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

- Most important: §1 nested submenu model (DEFERRED) — the entire missing 60/91
  cases hang off it; try the Book Default story, open the menu, and notice there
  is no Share-style submenu to hover — every SUBKEY/INTENT/CLOSE-tree case is
  that absent second level.
- Second: §5 Popover-root anatomy (OPEN) — the one breaking decision in this doc;
  it must be answered before §1 can start, because root-owns-Overlay and
  nested-wrapped-Overlay cannot coexist; weigh the codemod cost now, not mid-arc.
- Third: §2 + §3 choice and link parts (both DEFERRED) — together they are the
  settings-menu and docs-menu stories; try arrowing through the current menu and
  notice every row is a plain command — no checkboxes, radios, or links exist yet.
- The two DECLINED candidates (§11 focus-on-pointer-open, §12 aria-orientation)
  and all four suspected gaps need no product debate — each carries its one-line
  killer reason; only §3 of suspected gaps (intent-timing knobs) could ever
  reopen, and only on accessibility research, not taste.
