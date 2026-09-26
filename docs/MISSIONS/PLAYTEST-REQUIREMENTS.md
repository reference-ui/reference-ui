# Playtest Requirements — reference-ui mission

Sources: five builder crews, each shipping a real app against `dist` plus a
friction diary and a final BUG/WANT report.

| Crew | App | Diary | Final report |
|---|---|---|---|
| settings | `/tmp/playtest-settings` (port 5121) | `/tmp/playtest-settings/FRICTION.md` | session `01a0db1e-1a9e…` |
| data | `/tmp/playtest-data` (port 5122) | `/tmp/playtest-data/FRICTION.md` | session `01a0db1e-1af8…` |
| nav | `/tmp/playtest-nav` (port 5123) | `/tmp/playtest-nav/FRICTION.md` | session `01a0db1e-1b57…` |
| sched | `/tmp/playtest-sched` (port 5124) | `/tmp/playtest-sched/FRICTION.md` | session `01a0db1e-1bbb…` |
| split | `/tmp/playtest-split` (port 5125) | `/tmp/playtest-split/FRICTION.md` | session `01a0db1e-1c13…` |

(Full session ids in the mission brief. All builders ran read-only against the
repo on `reference-system`; all claims below were observed in a real browser
unless marked `[reasoned]`.)

Counts: **40 bugs**, **36 wants** → **26 accept** (15 feature, 6 docs/process,
5 already filed as bugs), **10 reject**.

---

## Part 1 — Confirmed BUG backlog (deduped)

Index:

| ID | Component | Bug | Sev | Verified by |
|---|---|---|---|---|
| B-01 | Presence | Exit wedges forever with nested overlay inside | Critical | data probes 06b/06c/06f/06g/06i |
| B-02 | Listbox | Spurious (de)selection from interactive/portaled row content | High | data probes 02/06b/06d |
| B-03 | Presence/FocusLock | React 19 `element.ref` console error on mount | Medium | data (every probe), sched bug 10, split #5 |
| B-04 | Menu docs | Phantom `CheckboxItem/RadioGroup/RadioItem/LinkItem` | Medium | data B5, split #14 |
| B-05 | Toast docs | Phantom `toast.show/update(def,props)` overloads | Low | split #14 |
| B-06 | ReferenceLibrary docs | Supported toaster `theme` undocumented | Low | split #14, data #16 |
| B-07 | Docs (all) | Uncontrolled/`defaultValue` documented as controlled-only | Medium | split #14, sched setup |
| B-08 | Tabs | Pill selected tab unreadable (white on light gray) | High | settings bug 1 |
| B-09 | Text primitives | `Span` in `Tooltip.Content` invisible (dark-on-dark) | Medium | settings bug 2 |
| B-10 | Styling/extractor | Lib's own call sites miss compilation; per-value console spam | Medium | settings bug 3, split #12 |
| B-11 | Packaging/process | Shipped `dist` behaviorally stale vs `src` | High | nav N1, split #8–#11, data #30 |
| B-12 | Collapsible | `onOpenChange` silently dropped when `onChange` passed | Low-Med | nav probe2 P2 |
| B-13 | Packaging | No consumable stylesheet or primitive exports | High | nav N3 + all five setups |
| B-14 | Packaging | `react` hard dep breaks SSR/Node | Medium | nav `ssr.mjs` |
| B-15 | DateField | Zero validation: publishes any string verbatim | Critical | sched bug 1 |
| B-16 | DateField | `min`/`max` silently ignored (typing + picker) | High | sched bug 12 |
| B-17 | Calendar | `min`/`max` silently ignored (navigate + select) | High | sched bug 2 |
| B-18 | Calendar | Day grid has roving tabindex but zero key handlers | High | sched bug 3 |
| B-19 | NumberField | Clamp-on-keystroke makes bounded decimals un-enterable | High | sched bug 4 |
| B-20 | Combobox | Esc/blur leaves stale uncommitted text displayed | Medium | sched bug 5 |
| B-21 | Combobox | Opens on mere focus (Tab-through opens popup) | Medium | sched bug 6 |
| B-22 | Combobox+Overlay | In dialogs, popup stays open and Tab escapes the trap | High | sched bug 7 |
| B-23 | Calendar | `mode="month"/"year"` render a dead grid | Medium | sched bug 8 |
| B-24 | Calendar/DateField | `locale` ignored (week start, day names, text) | Medium | sched bug 9 + diary |
| B-25 | Overlay docs | Documented dialog example renders invisible | Medium | sched bug 11 |
| B-26 | NumberField | Minors: spinbutton role, no hold-repeat, `-Infinity` ARIA | Low | sched bug 13 |
| B-27 | Menu | Menu.md Popover+Menu composition crashes the whole app | P0 | split #1 |
| B-28 | Splitter | Panel props leak to DOM + React errors | P1 | split #2 |
| B-29 | Slider | Out-of-range value: visual clamps, `aria-valuenow` lies | P1 | split #3 |
| B-30 | Splitter | Handle `aria-orientation` same-axis (docs+APG say perpendicular) | P1 | split #4 |
| B-31 | Splitter | Enter-collapse documented but a no-op | P2 | split #6 |
| B-32 | Menu | Submenu is pointer-only (no roving, no hover intent) | P2 | split #7 |
| B-33 | Menu | Content-focused ArrowDown/Home/End misbehave | P3 | split #13 |
| B-34 | Listbox | Root lacks `aria-multiselectable` in multiple mode | Low-Med | data probe 05b |
| B-35 | Packaging | `dist` imports node `url` (browser-externalized warning) | Low | sched friction |
| B-36 | Calendar/Combobox/NumberField | Redundant identical-value `onChange` emissions | Low | sched diary + bug 13 |
| B-37 | Toast | Close × sits half-outside the toast corner | Trivial | settings diary |
| B-38 | Listbox | Selected option renders white bg in dark mode | Low | data #17 |
| B-39 | Packaging | 1.8MB unsplit bundle, no code-splitting guidance | Low | sched friction |
| B-40 | React primitives | Primitive `Button` renders full-width block by default | Trivial | sched diary |

### B-01 — Presence exit wedges forever with nested overlay inside (Critical)
Component: `Presence` (+ `Overlay`/`Menu`/`Popover` Content).
Repro: mount any `<Presence>` containing a (closed) nested overlay Content
(data: dataset detail panel with schema Popover inside); flip `present`
true→false. Panel stays `data-state="closed"` at 1s/3s/6.5s — past the 5s
fallback, which hits the same blocked check. Worse in dist 0.0.46: on
false→true the panel vanishes and never recovers on true→true selections
(bricked until remount). Causal proof: `?noschema=1` (no nested Popover)
exits cleanly (gone@200ms) and remounts fine.
Mechanism (dist-reading, verified behaviorally): Overlay Content always mounts
`<Presence present={isOpen}>`; born-closed it registers as a pending
descendant (context crosses portals) and never reports complete because no
false edge ever comes. Dist's `contextValue` memo includes `state`, so the
false→true edge re-runs nested registration and the transient unregister sets
`unmounted` last.
Verified-by: data diary #27/#32, probes 06b/06c/06f/06g/06i + dist reading.
Note: data diary #30 — `src` memo lacks `state` and uses `stateRef`, so `src`
likely wedges on false but recovers on true; that half is code-reading only.

### B-02 — Spurious (de)selection from interactive/portaled row content (High)
Component: `Listbox` Option.
Repro (a): multi-select Listbox with a `⋯` Menu trigger inside a row; click it.
Selection toggles (`["events"]→[]`) although only the button was pressed —
Option pointerdown selects with no interactive-descendant guard (keydown has
one). Repro (b): click an item inside the PORTALED menu/popover; the click
bubbles through the React tree into `Option.handleClick` (no DOM-containment
check) and re-toggles (`[]→["events"]`). Net in multi: open+act
double-mutates. In single: redundant same-value `onChange` after every menu
action. Benign-looking in single, data-corrupting in multi.
Verified-by: data diary #9/#24/#28, probes 02/06b/06d.
Fix sketch (from reporter): `if (!e.currentTarget.contains(e.target)) return`
in `handleClick` kills (b); (a) needs the keydown-style guard on press.

### B-03 — React 19 `element.ref` console error on mount (Medium)
Component: `Presence` (`getElementRef`), `FocusLock`.
Repro: open any picker/popover/dialog/menu/toast on React 19; console shows
`Accessing element.ref was removed in React 19`. `getElementRef` reads
`(element as any).ref`; the `mayWarn` guard does not prevent the access, and
dist lacks `src`'s `isReactWarning` guard. Real apps treat console errors as
CI failures — this blocks adoption.
Verified-by: data diary #10 (probes 02 rerun, nearly every run), sched bug 10
(every mount), split #5 (`Presence.tsx:563,570`, `FocusLock.tsx:522` — live
in `src`).

### B-04 — Menu.md documents choice/link items that do not exist (Medium, docs)
Component: Menu docs vs `Menu.tsx`/dist.
Repro: `import { Menu } from '@reference-ui/lib'`; `Menu.CheckboxItem`,
`Menu.RadioGroup`, `Menu.RadioItem`, `Menu.LinkItem` are all `undefined`,
although Menu.md documents them with props. Builders faked sort pickers with
`Menu.Item[selected]` and hand-rolled ✓ spans.
Verified-by: data diary #11/B5 (runtime import + source grep), split #14.

### B-05 — Toast docs describe `show/update(def,props)` overloads that do not exist (Low, docs)
Component: Toast docs. Impl offers define-callable + `fn.update`;
`toast.show(def, props)` / `toast.update(id, def, props)` do not exist.
Verified-by: split #14 (code-verified).

### B-06 — Supported toaster `theme` is undocumented (Low, docs)
Component: `ReferenceLibrary` docs. `toaster.theme: 'dark'` is plumbed through
and works, but absent from ReferenceLibrary.md; found by reading `src`. Default
renders white in a dark app until configured.
Verified-by: split #6/#14, data #16 (shot 03-toast).

### B-07 — Uncontrolled/`defaultValue` documented as controlled-only (Medium, docs)
Component: docs (Listbox, Calendar, DateField, NumberField, Combobox).
Repro: read any `.md` ("no uncontrolled"); run the code — `defaultValue`
works on all of Calendar/DateField/NumberField/Combobox (plus Tabs, Switch,
Slider, Tree, Accordion, Collapsible per nav/sched probes). The docs describe
a different library: also `NumberField.Group`, `DateField.Range/Start/End`,
`Calendar.Days/Day`, `Calendar.Months/Years`, required `locale`. Sched burned
the most time here: wrote the first app against the docs, then rewrote
against `src`.
Verified-by: split #14, sched setup #3 + "working" list, nav probes.

### B-08 — Tabs pill selected tab unreadable (High, a11y/contrast)
Component: `Tabs` `variant="pill"`.
Repro: any pill Tabs; select a tab. Selected tab renders `color:
ui.button.foreground` (≈white) on `bg: gray.200` — computed `oklch(0.985…)`
on `oklch(0.928…)`; verified in `Tabs.tsx` source + computed styles +
screenshots.
Verified-by: settings bug 1.

### B-09 — `Span` inside `Tooltip.Content` renders invisible (Medium)
Component: text primitives + `Tooltip`.
Repro: `<Tooltip.Content placement="top"><Span fontSize="3r">…`; hover →
black bar, no text (span pins dark `oklch(0.13…)` on dark bg). Plain string
children inherit correctly (verified workaround). Two reference-ui pieces
compose into unreadable output. Whether `color="design.primary.foreground"`
fixes it is **[reasoned]** (unverified).
Verified-by: settings bug 2 + diary (screenshot + computed styles).

### B-10 — Lib's own style props miss compilation; per-value console spam (Medium)
Component: static extractor + generated CSS.
Repro (settings): with the lib's own generated CSS + dist, ordinary usage
logs `css(): no compiled class … paints nothing` for Tabs pill
`boxShadow`/`transition`/`_hover`, Slider thumb shadow/transition, Tooltip
shadow — shadows/transitions silently missing. Repro (split): lib-internal
dynamic values (`flex: "0 0 N%"`) warn on every new value — console spam on
every drag tick; plus an uncompiled template `{colors.ui.focus.ring}` in the
Tree focus style. Honest caveat (settings): the hand-copied `styles.css` may
be stale relative to sources — but that is exactly what a consumer gets.
Verified-by: settings bug 3, split #12.

### B-11 — Shipped `dist` behaviorally stale vs `src` (High, process)
Component: build/release process (`dist/index.mjs` Sep 24 vs `src` Sep 25).
Instances, each bisected by hand:
- Tree branch without `isBranch` → silent flex-row layout explosion, Group
  overlaps label, clicks intercepted; `src` auto-detects (`hasGroupChild`).
  (nav N1a, split #9)
- Nested Collapsible trigger inside Accordion content hijacks ArrowUp/Down
  under dist; headers-only in `src`. (nav N1b — AC-KEY-07)
- Splitter `value=[10,10,80]` on 2 panels → both collapse to ~13px, silent;
  Home/End hardcode 5% floor ignoring min/max; `src` solver + `validateLayout`
  warnings. (split #8)
- `Menu.Item textValue` leaks to DOM; `onSelect` called with no event; `src`
  fixed both. (split #10)
- `aria-hidden="true"` on clickable Tree Expander button; `src` removed it.
  (split #11)
- Presence `contextValue` memo includes `state` in dist (`src`: no `state` +
  `stateRef`); dist lacks `src`'s `isReactWarning` guard. (data #30, feeds
  B-01/B-03 severity in the shippable artifact)
Headline finding (nav): the consumable artifact lags source behaviorally, and
dist/src drift dominated diagnosis time across crews.
Verified-by: nav N1 (`npm run dev` vs `SRC=1`, `verify.mjs` 48/51 → 51/51),
split #8–#11, data #30/B1/B4.

### B-12 — `onOpenChange` silently dropped when `onChange` also passed (Low-Med)
Component: `Collapsible`. `notify = onChange ?? onOpenChange`: passing both
silently drops `onOpenChange`. Fire both or dev-warn.
Verified-by: nav bug 2, `/probe.html` P2, `probe2.mjs`.

### B-13 — No consumable stylesheet or primitive exports (High, packaging)
Component: packaging (`exports` map, unpublished `@reference-ui/react`).
Repro: `file:`-link (or npm-install) `@reference-ui/lib` as an external
consumer. (a) The `exports` map exposes only `.` and `./theme`; the 243–245KB
`styles.css` (all `reference-ui__*` utilities) lives inside the generated,
unpublished `0.0.0-neo` `@reference-ui/react` and must be hand-copied — it
will rot. Without it, components render unstyled. (b) Stories import
`Div`/`Span`/`Button`/`Label` from `@reference-ui/react`, which is `ref sync`
output — not in `packages/`, not published, unfindable by grep; `dist`
exports none of them. All five crews hit this; every crew's setup section is
tribal knowledge (`file:`-link the generated package, copy the CSS, mirror
`book/vite.config.ts` aliases). Nothing documented; README only covers
`baseSystem` + `ref sync`.
Verified-by: nav N3/setup, settings setup + WANT 1, data setup #1, sched
setup #1–#2, split setup.

### B-14 — `react` hard dependency breaks SSR/Node (Medium, packaging)
Component: packaging (`dependencies` vs `peerDependencies`).
Repro: plain `renderToString` of a Tree in Node (`ssr.mjs`): bare `react`
inside the installed lib resolves to the repo's copy through nested
pnpm-symlinked `node_modules` → invalid-hook-call. Should be a peer.
Verified-by: nav bug 4, `ssr.mjs`.

### B-15 — DateField publishes any string verbatim, zero validation (Critical)
Component: `DateField`. Type `garbage!!`, `2026-13-99`, `2026-02-30`, or
out-of-range `2027-05-05`: `onChange` publishes every string verbatim as
`ISODate` (`handleInputChange` has zero validation). There is no invalid
state to style; all validation is app land.
Verified-by: sched bug 1 + diary.

### B-16 — DateField `min`/`max` silently ignored (High)
Component: `DateField`. Props accepted, destructured, never used — ignored in
both typing and picker selection. Silent-ignore props with no dev diagnostic.
Verified-by: sched bug 12 + diary.

### B-17 — Calendar `min`/`max` silently ignored (High)
Component: `Calendar`. Set `min="2026-09-01" max="2026-12-31"`, drill to
January via heading, click 15 → selected `2026-01-15`, no disabled states
anywhere.
Verified-by: sched bug 2 + diary.

### B-18 — Calendar day grid inoperable by keyboard (High, a11y)
Component: `Calendar`. Day cells are `tabIndex={selected ? 0 : -1}` with zero
keyboard handlers: Tab lands on the selected day and arrows do nothing.
Roving tabindex without roving is worse than all-`tabindex-0` — keyboard
users can never change the date.
Verified-by: sched bug 3.

### B-19 — NumberField clamp-on-keystroke eats bounded decimals (High)
Component: `NumberField`. `min=1 max=10`, keystroke-type `2.5` into an empty
field → value `10`: the `.` keystroke reformats to `2`, then `5` makes `25`
→ clamped. No dirty/input session; bounded decimals are un-enterable.
Verified-by: sched bug 4.

### B-20 — Combobox Esc/blur leaves stale uncommitted text (Medium)
Component: `Combobox`. Type `zzz`, press Esc or blur: docs say restore
committed text; actual: `zzz` stays displayed over committed `Borealis`.
Verified-by: sched bug 5.

### B-21 — Combobox opens on mere focus (Medium)
Component: `Combobox`. Tab into the input → popup opens (`handleFocus` →
`setIsOpen(true)`, source-confirmed). Tabbing through a form opens popups
uninvited.
Verified-by: sched bug 6.

### B-22 — Combobox in dialogs: popup stays open, Tab escapes the focus trap (High, a11y)
Component: `Combobox` + `Overlay`. In a dialog, Tab from room input to seats:
popup should close on blur (as it does outside dialogs); actual: stays open,
and Tab from Cancel jumps into a list option instead of wrapping to the
dialog title. Focus-trap escape.
Verified-by: sched bug 7.

### B-23 — Calendar `mode="month"/"year"` render a dead grid (Medium)
Component: `Calendar`. Day grid renders, clicks emit nothing, value stays
null (`selectDate` handles only day/range) — dead UI with no diagnostic.
Verified-by: sched bug 8 + diary.

### B-24 — `locale` ignored by Calendar and DateField (Medium)
Component: `Calendar`, `DateField`. Switch `en-GB`/`de-DE`/`ja-JP`: always
Su-first with hardcoded `['Su','Mo',…]` (only the heading localizes:
"Oktober 2026"); DateField shows raw ISO text regardless of `locale`.
Verified-by: sched bug 9 + diary.

### B-25 — Documented Overlay dialog example renders invisible (Medium, docs)
Component: Overlay docs. Rendering the Overlay.md dialog example verbatim
produces a transparent backdrop + in-flow content at page bottom — the example
omits all positioning CSS. "Appearance stays in application markup" is fine
as a principle, but the example must show the minimum CSS or nobody's first
dialog renders.
Verified-by: sched bug 11 + diary.

### B-26 — NumberField minors (Low)
Component: `NumberField`. `role="spinbutton"` on a text input (docs forbid
it); no hold-to-repeat (no timers in source **[reasoned]**);
`aria-valuemin={-Infinity}` default (**[reasoned]** from source).
Verified-by: sched bug 13 (attrs read; hold-repeat/`-Infinity` reasoned).

### B-27 — Menu.md Popover+Menu composition crashes the whole app (P0)
Component: `Menu` (+ `RovingFocus`, `Overlay`).
Repro: compose per Menu.md — Popover + root `<Menu>` + direct `<Menu.Item>`;
click trigger → `onOpen` fires → `RovingFocus.Item must be used within a
RovingFocus.Root` → entire React root unmounts (menubar gone). Root cause:
root `<Menu>` renders a bare `<Overlay>` with no `RovingFocus.Root`, while
`MenuItem` requires one. The documented composition is the crashing path; lib
stories only use self-contained Menu+Trigger+Content, so nothing caught it.
Verified live in `src` too.
Verified-by: split #1.

### B-28 — Splitter panel props leak to the DOM (P1)
Component: `Splitter`. Any `<Splitter.Panel minSize maxSize collapsible
collapsedSize>`: props are leaked onto the DOM + through `css()` → React
`collapsible`/`collapsedSize` errors, `minSize`/`maxSize` miss-spam. Live in
`src`.
Verified-by: split #2.

### B-29 — Slider out-of-range: visual clamps, `aria-valuenow` lies (P1, a11y)
Component: `Slider`. Controlled `value={999}` with `max={24}`: thumb renders
at 100% but `aria-valuenow=999` — AT-invalid. Interactions clamp; the render
path does not. Live in `src`. Same class: `font=999/-40` → clamped visuals,
unclamped ARIA.
Verified-by: split #3 + stress probes.

### B-30 — Splitter handle `aria-orientation` is same-axis (P1, a11y)
Component: `Splitter`. `horizontal` splitter → `aria-orientation="horizontal"`;
docs + APG say perpendicular. Docs-based consumer CSS produced 9×7px handles
with wrong resize cursors. Live in `src`.
Verified-by: split #4.

### B-31 — Splitter Enter-collapse is a no-op (P2)
Component: `Splitter`. Docs promise Enter on a focused handle collapses a
`collapsible` panel; neither `src` nor dist implements it. Live gap.
Verified-by: split #6.

### B-32 — Submenu is pointer-only (P2, a11y)
Component: `Menu` submenu. Nested `Menu.Trigger` is a `<button>` outside the
roving set; `Tab` inside a menu closes it (by design); arrows skip the
trigger; hover does nothing. Docs describe hover intent (100/300ms) + roving
`menuitem` trigger; impl has neither. Keyboard users cannot reach submenus.
Verified-by: split #7 (run-verified).

### B-33 — Menu content-focused ArrowDown/Home/End misbehave (P3)
Component: `Menu`. With focus on menu content (mouse-opened): ArrowDown jumps
to the 2nd item; Home/End are dead until focus is inside an item.
Verified-by: split #13.

### B-34 — Listbox root lacks `aria-multiselectable` in multiple mode (Low-Med, a11y)
Component: `Listbox`. `getAttribute('aria-multiselectable')` → null in both
modes; APG requires `"true"` in multiple. (Absence in single is fine.)
Verified-by: data diary #23, probe 05b.

### B-35 — `dist` imports node `url` (Low)
Component: packaging. `dist/index.mjs` imports node `url`, externalized for
browser — works, but noisy build warnings for every consumer.
Verified-by: sched friction #4.

### B-36 — Redundant identical-value `onChange` emissions (Low)
Component: `Calendar`, `Combobox`, `NumberField`. Enter on an already-focused
day re-emits identical `onChange`; combobox blur re-commits the identical
value; NumberField arrows at bounds re-emit identical values. Noisy logs;
downstream effects re-fire for no change.
Verified-by: sched diary smalls + bug 13 (verified part).

### B-37 — Toast close × sits half-outside the toast corner (Trivial)
Component: `Toast`. Possibly intentional; looks slightly off.
Verified-by: settings diary (screenshot).

### B-38 — Selected Listbox option renders white bg in dark mode (Low)
Component: `Listbox` + theme tokens. Selected option = white bg (`ui.button`
background token) in dark mode — readable but loud; differs between focused
(white) and unfocused-behind-dialog (gray) states.
Verified-by: data diary #17 (shot 03-toast).

### B-39 — 1.8MB unsplit bundle, no code-splitting guidance (Low)
Component: packaging. `dist/index.mjs` bundles all icons with no splitting
guidance for consumers.
Verified-by: sched friction #4.

### B-40 — Primitive `Button` renders full-width block by default (Trivial)
Component: `@reference-ui/react` primitives. Sched's dialog buttons needed
explicit widths; surprising default for a `Button`.
Verified-by: sched diary smalls.

### Explicitly NOT filed (with reason)
- Data #25 multi-toggle anomaly: single run, three clean repros — unreproduced.
- Split first-click-after-load flake (no `onOpen` once): unreproduced.
- Data #21 blue `code`-chip background: cosmetic, unchased (likely theme global).
- Data #12 Listbox `ui.dialog.*` surface tokens: opinionated but fine.
- Data #15 inner buttons inside `aria-disabled` options still clickable: lib
  cannot know; app must thread disabled (Playwright-vs-reality test note).
- Nav `aria-disabled` refusing Playwright clicks without `force`: good a11y,
  test-authoring note only.
- Environment (not lib): Playwright MCP broken-pipe all session (all crews
  drove repo Playwright via file probes instead); macOS lacks `setsid`
  (servers die with sessions); Vite IPv6-localhost default (nav);
  `/tmp`→`/private/tmp` `fs.allow` (data); Slider `aria-valuetext` null is
  covered by W-06 verdict below.

---

## Part 2 — WANT verdicts (strict default-deny filter)

A want is ACCEPTED only if it passes all three:

1. **Q1 — They cannot reasonably do this on their own.** Userland workaround
   exists and is proportionate → fail.
2. **Q2 — It does not impersonate a human too much.** No uncanny autonomous
   behavior, no surprise agency → all 36 wants pass Q2; nothing asked for
   human-impersonating behavior.
3. **Q3 — Humans will also understand / find the code easier to reason
   about.** The feature must make consumer code more legible, not add hidden
   magic.

ACCEPT verdicts are strict product requirements (what / API / acceptance).
REJECT verdicts name exactly which question failed and why. Wants that
duplicate Part 1 bugs are accepted *via the bug backlog* (pointer, no second
verdict).

### W-01 — Shipped stylesheet / consumer sync story → ACCEPT via B-13
From: settings WANT 1, nav WANT (packaging), data WANT (primitives), sched
WANT (setup), split setup. This is B-13. No separate requirement; B-13 is the
acceptance. (Covers "export `Div/Span/Button` from dist or document",
"documented consumer setup", example app.)

### W-02 — NumberField `commitBehavior` (snap/validate choice) → ACCEPT
From: settings WANT 2 (`step={1}` keeps `2.5`), sched WANT (`commitBehavior`).
- Q1 pass: rounding/validation must happen inside the component's commit path
  (mid-typing reformatting, step math, B-19's input session); app-side
  rounding fights the component and loses.
- Q2 pass: a declared commit policy is the opposite of surprise behavior.
- Q3 pass: `commitBehavior="snap"|"validate"` on the component reads exactly
  as it behaves, replacing scattered manual rounding.
Requirement — what: `NumberField` gains an explicit commit policy.
API: `commitBehavior?: 'snap' | 'validate' | 'none'` (default `'none'`,
current behavior). `snap`: commit coerces to nearest step within min/max.
`validate`: commit rejects off-step values (revert + `onInvalidCommit`).
`onInvalidCommit?(attempted: number, reason: 'off-step'|'out-of-range')`.
Acceptance: `step={1} commitBehavior="snap"`, type `2.5`, commit → value `3`
(`2` on tie-down? specify: round-half-up) with a single `onChange`; `=`.
`"validate"` → visible value reverts, `onInvalidCommit` fires, no `onChange`;
uncontrolled + controlled both; distinct from B-19 (which must be fixed first:
commit happens on a stable input session, never mid-keystroke).

### W-03 — Dark-surface story for text primitives → ACCEPT
From: settings WANT 3 (B-09).
- Q1 pass: the dark default color is pinned inside the primitives; the app can
  override every instance but cannot fix the default.
- Q2 pass. Q3 pass: inheriting defaults remove a per-instance override tax.
Requirement — what: text primitives are usable on dark surfaces by default.
API: none (behavior fix) + documented token fallback. Either `Span`/`Text`
default `color` inherits (`currentColor`) instead of pinning dark, or the
dark-surface token is documented and verified.
Acceptance: B-09 repro renders legible text with zero overrides; if the token
route is chosen, `<Span color="…">` is verified in a browser test (the
`design.primary.foreground` guess in the diary is unverified and does not count).

### W-04 — Loud failure for uncompilable app-level style props → ACCEPT
From: settings WANT 4 (`maxW="140r"` silently unpainted, unbounded prefs column).
- Q1 pass: only the lib knows what compiled; the app cannot detect silent
  no-paint (layout correctness currently depends on coinciding with
  lib-internal literals).
- Q2 pass: a dev-time error is anti-magic. Q3 pass: loud beats silently wrong.
Requirement — what: in development, an uncompilable style-prop value fails
loudly instead of warning-and-skipping.
API: none (behavior): dev-only throw (or `console.error` + visually obvious
fallback such as a magenta outline — pick one, document it) naming the prop,
value, and component. Production keeps warn-and-skip.
Acceptance: `maxW="140r"` in dev produces the loud failure naming
`maxW`/`140r`/component; `120r`/`200r` stay silent; zero new noise for
values that compile; covered by a dev-mode test.

### W-05 — Imperative value read for NumberField/Slider → REJECT (Q1)
From: settings WANT 5 (minor). Failed Q1: the builder did it on their own —
`onChange` mirror into a ref — and called it "workable, slightly awkward".
That is the definition of reasonable. (Q2/Q3 unjudged; moot.)

### W-06 — `Field.Label/Error/Description` helpers → REJECT (Q1)
From: settings WANT 5 (minor). Failed Q1: two crews hand-wired
`label`/`aria-invalid`/`aria-describedby` successfully (settings profile form,
sched booking dialog) following the Invalid book pattern. Boilerplate, not a
capability gap — reasonable in userland. (Field is a bare wrapper by design.)

### W-07 — Default Slider `aria-valuetext` → REJECT (Q1)
From: settings WANT 5 (minor). Failed Q1: `formatValue` exists and passing it
is trivial and fully reasonable in userland. A nicer default does not clear
"cannot reasonably do this on their own".

### W-08 — Listbox uncontrolled mode (`defaultValue`) → REJECT (Q1)
From: data WANT. Failed Q1: controlled plumbing with `useState` is reasonable
(the builder shipped it); "forced controlled plumbing for a simple list" is
annoyance, not incapability. Sibling parity (Menu/Popover/Overlay all support
uncontrolled) is a consistency argument, and consistency alone does not pass
a default-deny gate.

### W-09 — Presence `onExitComplete`/status callback → ACCEPT
From: data WANT (content-swap transitions need retain-last-value hacks).
- Q1 pass: exit completion timing is owned by the lib's animation clock (and
  B-01's descendant protocol); the app can only guess with `setTimeout`
  matched to a duration it does not own. Fragile, not reasonable.
- Q2 pass. Q3 pass: an explicit callback replaces timeout hacks with legible
  coordination.
Requirement — what: observe Presence exit completion.
API: `onExitComplete?(): void` on `Presence`, fired exactly once when content
unmounts after a completed exit (not on interrupted exits; not on initial
mount). If a status enum ships instead, it must include a terminal
`'unmounted'`/`'exited'` value with the same once-only guarantee.
Acceptance: content-swap demo (DetailPanel pattern) coordinates swaps with no
timers and no retained-value hacks; unmount timing test asserts single fire
after the exit animation; B-01 fixed first (callback must fire even with
nested overlays — the wedge case).

### W-10 — Presence owns `data-state` injection → REJECT (Q1)
From: data WANT. Failed Q1: mirroring `present` onto `data-state` is shown in
the docs and both crews did it correctly; during exits `present=false` maps
to `data-state="closed"` for the whole animation, which is exactly right.
Reasonable in userland; the failure mode ("easy to get wrong") is mitigated
by W-09's callback, not by absorbing the attribute.

### W-11 — Documented way to cancel outside-press dismiss → ACCEPT (docs)
From: data WANT (`onOutsidePress` exists; `preventDefault` semantics untested).
- Q1 pass: only the lib can define and document its dismiss-cancellation
  contract. Q2 pass. Q3 pass: a documented contract beats an untested guess.
Requirement — what: one documented, tested recipe for non-dismissable
(destructive) dialogs.
API: none new if `onOutsidePress={e => e.preventDefault()}` already cancels —
then document + test it. If it does not cancel, add explicit
`dismissable?: boolean` (default true) on Overlay/Dialog.
Acceptance: a destructive dialog demonstrably survives outside presses via the
documented mechanism, in a browser test; Popover.md/Overlay.md "Proposed API"
lag (also: document the actually-shipped `onOpenChange`) fixed in the same edit.

### W-12 — Toaster default theme follows system → REJECT (Q1)
From: data WANT. Failed Q1: passing `theme="dark"` (or a `matchMedia` read) is
reasonable — the builder did exactly that. A smarter default is convenience,
not capability.

### W-13 — Listbox.md: typeahead fallback + `Empty` chrome notes → ACCEPT (docs)
From: data WANT. Q1 pass (only we can fix our docs), Q2 pass, Q3 pass
(legibility is the entire point).
Requirement — what: two honest lines in Listbox.md: (a) options without
`textValue` fall back to text content for typeahead (verified behavior, probe
05b); (b) `Listbox.Empty` is unconditional chrome — the app must
conditionally render it.
Acceptance: both lines present and accurate against the shipped behavior.

### W-14 — Tree reveal API (`autoExpandOnSelect`/`reveal()`) → REJECT (Q1)
From: nav WANT 1 (deep-link / search-jump). Failed Q1: the app owns the tree
data and `expanded` is controlled — computing an ancestor chain is a routine
walk over owned data, and expanding-then-selecting is reasonable userland
orchestration. Unmounting of collapsed groups (verified P4) is the sharp
edge, but it does not make the orchestration unreasonable.

### W-15 — Tabs `keepMounted` → ACCEPT
From: nav WANT 2 (inactive panels unmount; nested tab/form state resets).
- Q1 pass: the unmount is inside the lib (`{isSelected && children}`); the app
  cannot preserve inner state without reimplementing Tabs. Impossible in
  userland, not merely awkward.
- Q2 pass. Q3 pass: `keepMounted` declares the trade-off at the call site.
Requirement — what: opt out of panel unmounting.
API: `keepMounted?: boolean` on `Tabs` (default false, current behavior).
`true`: all panels stay mounted, inactive ones `hidden` (and
`aria-hidden`/`inert` as appropriate — specify).
Acceptance: form state inside an inactive panel survives a tab round-trip;
keyboard/ARIA behavior unchanged (roving scope, tab order excludes hidden
panels); controlled + uncontrolled Tabs.

### W-16 — Tabs dev warning on unmatched controlled `value` → ACCEPT
From: nav WANT 3 (typo → silently blank panel area).
- Q1 pass: only the lib knows the registered tab values vs the passed value.
- Q2 pass. Q3 pass: a named warning turns invisible failure into a five-second
  fix.
Requirement — what: dev-only warning when a controlled `value` matches no tab.
API: none (behavior): `console.error` naming the component, the bad value,
and the registered values.
Acceptance: Edge-Lab repro warns with all three named parts; no warning for
valid values, uncontrolled mode, or async-registered tabs that resolve
(avoid false positives on first render before registration).

### W-17 — Tree `*` key (APG expand-all-siblings) → ACCEPT
From: nav WANT 4 (verified absent — falls into typeahead).
- Q1 pass: the keymap lives inside the lib's roving implementation; an app
  `onKeyDown` would fight the internal handler. Cannot reasonably extend from
  outside.
- Q2 pass: standard APG behavior, documented. Q3 pass.
Requirement — what: APG `*` key on Tree.
API: none (behavior): `*` on a closed branch expands it; on an open branch
expands all siblings; on a leaf, expands the first closed sibling branch.
Acceptance: keyboard test covering all three cases; typeahead buffer
interaction specified (e.g. `*` never enters the buffer); RTL unaffected.

### W-18 — Imperative focus handles → REJECT (Q1)
From: nav WANT 5 ("jump to search result" focus). Failed Q1: DOM queries
against stable roles (`treeitem`, `tab`, `trigger`) work — the builder
shipped them. Ugly, but reasonable; ref-forwarding ergonomics do not clear
the gate.

### W-19 — Document the Tree selection model → ACCEPT (docs)
From: nav WANT 6 (cost 8 wrong checks: arrows/typeahead move focus only,
Enter/Space select).
Requirement — what: the selection model stated in the obvious place (Tree.md
top + prop docs), not only SPEC.md if it lives there.
Acceptance: a reader who only opens Tree.md can state the model; verified by
the nav keyboard matrix (already passing in `src`).

### W-20 — Calendar custom day rendering → ACCEPT
From: sched WANT (event dots/counts; fell back to a text list).
- Q1 pass: day cells render inside Calendar; the app cannot inject content
  into cells. Impossible in userland.
- Q2 pass. Q3 pass: a render prop keeps custom content declarative and local.
Requirement — what: custom day-cell content.
API: `Calendar.Day` render prop (match the documented name if the docs' shape
is sound): `Day?: (date: ISODate, state: { selected, inRange, disabled,
today }) => ReactNode`. Must compose with selection/disabled/keyboard
(B-18) — custom content never breaks cell semantics.
Acceptance: month view with event dots; dots do not disturb selection,
disabled states, or (fixed) keyboard; `null` return keeps default cell.

### W-21 — `isDateUnavailable` / `firstDayOfWeek` → ACCEPT
From: sched WANT (grey out booked days; Monday-first for en-GB).
- Q1 pass: grid generation and per-day disabled states are lib-internal; the
  app cannot grey individual days or re-start the week.
- Q2 pass. Q3 pass: declarative props, legible call sites.
Requirement — what: unavailable dates + configurable week start.
API: `isDateUnavailable?: (date: ISODate) => boolean` (unavailable ⇒
disabled cell + `aria-disabled`, unselectable, skippable by keyboard);
`firstDayOfWeek?: 0|1|…|6` (default from `locale` once B-24 is fixed, else 0).
Acceptance: booked days greyed and unselectable by pointer AND keyboard;
en-GB Monday-first grid; both compose with `min`/`max` (B-17) and custom
rendering (W-20).

### W-22 — `DateField.Range` → REJECT (Q1)
From: sched WANT (documented, absent). Failed Q1: two DateFields + app
validation shipped and worked — reasonable in userland, as proven. The
*documented-but-absent* half is a docs defect, absorbed by W-30 (docs sync):
either implement this later as its own proposal or remove it from the docs.
Rejecting the feature does not license keeping the phantom docs.

### W-23 — `invalid`/`required` on DateField/NumberField → REJECT (Q1)
From: sched WANT. Failed Q1: app-land error states (wrapper styling +
`aria-invalid`, as proven in the settings profile form and sched booking
dialog) are reasonable. Native props would be nicer; nicer is not the gate.

### W-24 — Combobox `autocomplete`/`allowCustomValue`/`closeOnBlur` → ACCEPT
From: sched WANT (all three documented, all absent).
- Q1 pass: inline autocompletion needs input-selection manipulation inside the
  lib's input; custom-value commit needs the lib's commit path to accept
  non-matching text; blur-close needs coordination with the lib-owned open
  state (see B-21/B-22 — the app demonstrably cannot get this right from
  outside).
- Q2 pass. Q3 pass: three explicit props replacing three hand-rolled fights.
Requirement — what: implement the three documented props (or correct the docs
per W-30 — but the filter verdict is: the capability is accepted).
API: `autocomplete?: 'none' | 'inline' | 'list' | 'both'` (inline =
complete + select remainder); `allowCustomValue?: boolean` (commit of
non-matching text via Enter, published as value); `closeOnBlur?: boolean`
(default true — must also hold inside dialogs, closing B-22's hole).
Acceptance: room search with inline completion; custom room name commits and
round-trips; blur closes inside AND outside dialogs with focus trap intact;
documented behavior Tisch-tested against the docs' own examples.

### W-25 — NumberField `formatOptions` → ACCEPT
From: sched WANT (currency/percent display; documented, absent).
- Q1 pass: display formatting inside the lib's input during edit/display
  transitions cannot be done from outside (the lib owns the input's value
  rendering; cf. B-19).
- Q2 pass. Q3 pass: `Intl`-shaped declarative formatting.
Requirement — what: display formatting for NumberField.
API: `formatOptions?: Intl.NumberFormatOptions` (+ `locale?`, honoring B-24's
fix): formats the displayed value; the committed numeric value stays a plain
number; editing shows the raw value, blur re-formats.
Acceptance: currency/percent display with plain-number `onChange`; typing
never fights the formatter (B-19 input-session discipline); `null`/empty
handling specified.

### W-26 — Documented consumer setup → ACCEPT via B-13
From: sched WANT (example app, `@reference-ui/react` invisibility). This is
B-13's documentation facet. No separate requirement.

### W-27 — Dialog minimum-CSS recipe → ACCEPT via B-25
From: sched WANT. This is B-25. No separate requirement.

### W-28 — Menu choice items (`CheckboxItem`/`RadioItem`/…) → ACCEPT
From: split W-3 (hand-rolled ✓ spans; B-04's docs promise them).
- Q1 pass: choice items need roving radio-group semantics, `menuitemcheckbox`/
  `menuitemradio` roles, and `aria-checked` orchestration inside the lib's
  roving set — hand-rolled spans get roles at best, never the keyboard model.
  Cannot reasonably do alone.
- Q2 pass. Q3 pass: declarative choice items vs span soup.
Requirement — what: implement the documented choice items (resolving B-04 by
building, not by deleting docs).
API: at minimum `Menu.CheckboxItem` (`checked`, `onCheckedChange`) and
`Menu.RadioGroup`/`Menu.RadioItem` (`value`, `onValueChange`); full roving +
typeahead participation; `Menu.LinkItem` only if it clears its own proposal
(href passthrough is weaker on Q1 — an `Item` with `asChild` anchor may do).
Acceptance: Edit-menu toggles and a sort radio group with zero hand-rolled
spans; arrows/typeahead/Enter/Space per APG menu-bar pattern; `aria-checked`
correct in all states; B-04 closed by existence.

### W-29 — Menubar coordination → ACCEPT
From: split W-4 (File+Edit observed open simultaneously, 7 items).
- Q1 pass: open-one-closes-others plus arrow-across-triggers needs shared
  state between independent Menu roots and coordination with internal roving;
  orchestrating from controlled `open` props plus synthesized cross-trigger
  arrows is fragile, not reasonable.
- Q2 pass. Q3 pass: a declarative menubar reads as one component, not N
  synchronized hacks.
Requirement — what: coordinated menubar behavior.
API: `Menubar` root coordinating child menu triggers (open-one-closes-others;
  Left/Right across triggers when a menu is open; Esc closes all and returns
  focus; APG menubar pattern).
Acceptance: File+Edit never open together; arrows cross triggers with an open
menu; focus restore correct; single-menu usage (today's stories) unchanged.

### W-30 — Docs↔implementation sync → ACCEPT (docs/process)
From: sched WANT (the `.md` files describe a different library).
- Q1 pass: only maintainers can fix our docs. Q2 pass. Q3 pass: accurate docs
  are the highest-leverage legibility work in this file (this want cost sched
  the most time of anything in the playtest).
Requirement — what: every `.md` matches shipped behavior; no phantom API, no
false controlled-only claims, no lagging "Proposed API".
API: none. Scope: B-04, B-05, B-06, B-07, B-25, W-11, W-13, W-19, plus
`Popover/Overlay onOpenChange`, Splitter panel props, `isBranch`, toast
define/update, `toaster.theme`, and the `DateField.Range`/`Calendar.Months`
phantoms (implement or delete per their own verdicts — W-22 deletes).
Acceptance: a docs-audit pass with each `.md`'s examples executed against
dist (extends W-31's smoke: docs examples must run); zero phantom APIs.

### W-31 — CI consumer smoke test → ACCEPT (process)
From: split W-1 (bare-Vite app importing dist, mounting every component,
asserting zero console errors).
- Q1 pass: only maintainers can add repo CI. Q2 pass.
- Q3 pass: the stale-dist class (B-11) is the playtest's top reasoning hazard
  — five behaviors hand-bisected because the code read was not the code
  shipped. A smoke gate restores "the code you read is the code that runs",
  which is exactly "easier to reason about".
Requirement — what: CI imports the packed `dist` in a bare Vite app, mounts
every component, asserts zero console errors; dist is rebuilt (or verified
fresh) on the same gate.
API: none. Acceptance: the gate fails on B-11's instances (Tree auto-detect,
Collapsible hijack, Splitter solver, textValue leak, Expander aria-hidden,
Presence memo) and on B-03/B-35 noise; runs on every PR touching
`packages/reference-lib/src` or the build.

### W-32 — Consumer styling contract docs → ACCEPT (docs)
From: split W-2 (inline thumb geometry vs class-driven; dark theming without
`ref sync`).
Requirement — what: document which geometry is inline (thumb w/h/left/bottom
— stylesheets cannot touch it) vs class-driven, and the supported dark-theme
path without `ref sync`.
Acceptance: a consumer sizes a Slider thumb and themes tree/menu hovers dark
using only the documented contract — no `!important`, no trial-and-error.

### W-33 — Submenu keyboard/hover parity → ACCEPT via B-32
From: split W-5. This is B-32 (docs already promise it). No separate requirement.

### W-34 — Working collapse (Enter or programmatic) → ACCEPT via B-31
From: split W-6. This is B-31 (docs already promise Enter). No separate requirement.

### W-35 — Clamp-or-warn contract for out-of-range controlled values → ACCEPT
From: split W-7 (B-29's lying ARIA, B-11's silent `~13px` collapse).
- Q1 pass: the render path (thumb position, panel sizes) and emitted ARIA are
  lib-owned; the app cannot clamp what the lib renders or announces.
- Q2 pass. Q3 pass: one predictable contract replaces per-component silent
  degeneracy.
Requirement — what: every component receiving an out-of-range controlled
value either clamps (render + ARIA agree) or dev-warns — never silently
degenerate, never lying ARIA.
API: behavior contract + dev warning naming component, prop, value, and
valid range. Slider/Splitter first (B-29 + B-11 instances are the acceptance
cases); audit the rest (Tree/Listbox/NumberField/Calendar values).
Acceptance: `value={999} max={24}` → thumb at 100% AND `aria-valuenow=24`
(or a dev warning + documented passthrough — pick per component, document);
`cols=[10,10,80]` on 2 panels → dev warning, no silent 13px collapse;
contract stated once in a shared doc, not per-component folklore.

## Verdict summary

35 verdict lines cover 36 filed asks (W-02 carries both the settings and the
sched `commitBehavior` ask).

| | Count (verdicts / asks) | IDs |
|---|---|---|
| ACCEPT — feature | 14 / 15 | W-02, W-03, W-04, W-09, W-15, W-16, W-17, W-20, W-21, W-24, W-25, W-28, W-29, W-35 |
| ACCEPT — docs/process | 6 / 6 | W-11, W-13, W-19, W-30, W-31, W-32 |
| ACCEPT — via bug backlog | 5 / 5 | W-01→B-13, W-26→B-13, W-27→B-25, W-33→B-32, W-34→B-31 |
| REJECT — Q1 failed | 10 / 10 | W-05, W-06, W-07, W-08, W-10, W-12, W-14, W-18, W-22, W-23 |
| REJECT — Q2/Q3 failed | 0 | (no want impersonated a human; no want failed legibility alone) |

Totals: 36 wants; 26 accepts (15 feature + 6 docs/process + 5 via-bug);
10 rejects. Related: B-04 (phantom Menu choice docs) is resolved by building
W-28 rather than by deleting docs.
