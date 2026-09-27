# Playtest WANTS — the 26 accepts

Source: `docs/MISSIONS/PLAYTEST-REQUIREMENTS.md` Part 2 (36 filed asks; 26
accepted under the Q1/Q2/Q3 default-deny filter: 15 feature + 6 docs/process +
5 via-bug). One entry per want: what it is, what it looks like in code, and
the verdict. Full rationale stays in the source.

**Status: SIGNED OFF by HQ 2026-09-27.** All 26 sensible; prior-art traced
per want (evidence: `.agents/missions/playtest/prior-art.md`). W-02 confirmed
vs the snap-in-onChange challenge (React Aria ships it verbatim); W-21
`firstDayOfWeek` kept with a type-alignment note; W-29 locked as standalone
`Menubar` with APG one-level Esc.

**Sequencing (HQ 2026-09-27): docs come after.** All docs items — W-11, W-13,
W-19, W-30, W-31-docs-facet, W-32, W-26, W-27, and docs bugs B-05/B-06/B-07/B-25 —
are parked until the wants land and reference-lib is productionized. Docs are
the next phase after that, not part of this one.

---

## Features

### W-02 — NumberField `commitBehavior` — GO, after B-19

An explicit commit policy: `snap` coerces to the nearest step, `validate`
rejects off-step values, `none` keeps today's behavior.

```tsx
<NumberField step={1} commitBehavior="snap" value={v} onChange={setV} />
// type 2.5, commit → 3, single onChange
```

Verdict: GO CONFIRMED (prior-art crew answered HQ's challenge). React Aria
ships `commitBehavior?: 'snap' | 'validate'` verbatim (NumberField v1.17.0,
`adobe/react-spectrum#9679`) — snap-in-`onChange` is confirmed as the
*mechanism* (`commit()` fires `onChange` with the snapped value), but
upstream still ships the prop, so docs-guidance is rejected. Two deliberate
divergences: our default stays `'none'` (today's behavior; Spectrum defaults
`'snap'`), and the third value's spelling is ours (behavior traced via
Mantine `clampBehavior="none"`). Still sequenced after B-19.

### W-03 — Dark-surface story for text primitives — GO, rides B-09

`Span`/`Text` must be legible on dark surfaces with zero overrides — inherit
instead of pinning a dark color (or a documented, verified token fallback).

```tsx
<Tooltip.Content placement="top"><Span>reads legibly</Span></Tooltip.Content>
// no color prop, no overrides — just readable
```

Verdict: GO. This IS the B-09 fix; rides the primitives crew.

### W-04 — Loud dev failure for uncompilable style props — GO, after B-10

In dev, a value that compiles to nothing fails loudly — naming prop, value,
and component — instead of warning-and-skipping into a silently wrong layout.

```tsx
<Div maxW="140r">…</Div>
// dev: throws "maxW="140r" on Div compiled to nothing"; prod keeps warn-and-skip
```

Verdict: UNDER REVIEW (HQ challenge). If `120r`/`200r` compile, `140r` is a
reasonable value hitting a continuity gap in the scale — failing loudly on it
blames the user for a system gap. First question (for B-10 root cause): why
doesn't it compile, and should arbitrary numerics compile? Loud failure
survives only for genuinely malformed values (unknown props, garbage
strings), not for in-between scale values.

### W-09 — Presence `onExitComplete` — GO, after B-01

Observe exit completion so content swaps coordinate without `setTimeout`
guesses against a duration the app doesn't own. Fires exactly once, on
completed exits only.

```tsx
<Presence present={open} onExitComplete={swapToNextPanel}>
```

Verdict: GO. Sequenced after B-01 — the callback must fire through the
nested-overlay wedge case.

### W-15 — Tabs `keepMounted` — GO, after unit 155

Opt out of panel unmounting. Inactive panels stay mounted and `hidden` so
nested form/tab state survives round-trips.

```tsx
<Tabs keepMounted value={tab} onChange={setTab}>
```

Verdict: GO. Tabs dir is busy (unit 155); crew it the moment they land.

### W-16 — Tabs dev warning on unmatched controlled `value` — GO, after unit 155

A typo'd `value` renders a silently blank panel today. Dev warns, naming the
component, the bad value, and the registered values.

```tsx
function PrefsPage() {
  const [tab, setTab] = useState('setings') // typo — matches nothing
  return (
    <Tabs value={tab} onChange={setTab}>
      <TabsList>
        <Tab value="general">General</Tab>
        <Tab value="settings">Settings</Tab>
        <Tab value="billing">Billing</Tab>
      </TabsList>
      <TabPanel value="general">…general form…</TabPanel>
      <TabPanel value="settings">…settings form…</TabPanel>
      <TabPanel value="billing">…billing form…</TabPanel>
    </Tabs>
  )
}
// today: blank panel area, zero explanation.
// with W-16 (dev only):
//   console.error: 'Tabs: value "setings" matches no tab
//     (registered: general, settings, billing)'
```

Verdict: GO, same sequencing as W-15. Must not false-positive on
async-registered tabs.

### W-17 — Tree `*` key (APG expand-all-siblings) — GO, standalone

`*` on a closed branch expands it; on an open branch expands all siblings;
on a leaf, expands the first closed sibling branch. Never enters typeahead.

Verdict: GO. No deps — crewable immediately.

### W-20 — Calendar custom day rendering — GO, after B-18

A render prop for day-cell content (event dots/counts), composing with
selection, disabled states, and keyboard. `null` keeps the default cell.

```tsx
<Calendar Day={(date, { today, selected }) => (
  <DayCell>{eventsOn(date).length > 0 && <Dot />}</DayCell>
)} />
```

Verdict: GO. Sequenced after B-18 — custom content must compose with the
fixed keyboard model, not the broken one.

### W-21 — `isDateUnavailable` / `firstDayOfWeek` — GO, after B-24 + B-17

Grey out booked days (disabled, unselectable, keyboard-skippable) and start
the week on Monday for en-GB. Week-start defaults from `locale` once B-24
lands.

```tsx
<Calendar isDateUnavailable={isBooked} firstDayOfWeek={1} />
```

Verdict: GO (both halves). `isDateUnavailable` is exact React Aria
(name + semantics, unavailable stays focusable but unselectable).
`firstDayOfWeek` survives HQ's challenge: React Aria ships the exact name as
a locale-default override — but RAC takes weekday-name strings
(`"sun"|"mon"…`) while our sketch takes a number (`{1}`). Align the type or
document the divergence at implementation. Sequenced after B-24 + B-17.

### W-24 — Combobox `autocomplete` / `allowCustomValue` / `closeOnBlur` — GO, after B-21/B-22

The three documented-but-absent props: inline completion, committing
non-matching text via Enter, and blur-close that holds inside dialogs too.

```tsx
<Combobox autocomplete="both" allowCustomValue closeOnBlur>
// type "Zen Den" (no match), Enter → commits "Zen Den" as the value
```

Verdict: GO. Sequenced after B-21/B-22 — the app demonstrably can't get
open-state right from outside, so the lib must own it first. Prior-art note:
`autocomplete="both"` (APG/RAC) and `allowCustomValue` (Ark, exact) are
solid; `closeOnBlur` as a shipped boolean is NO-TRACE anywhere (name only in
a 2019 Chakra proposal issue) — at implementation, either keep the name
deliberately or ride existing outside-interaction handlers for the dialog
case.

### W-25 — NumberField `formatOptions` — GO, after B-19

`Intl`-shaped display formatting: currency/percent on screen, plain number
in `onChange`. Editing shows raw, blur re-formats, typing never fights it.

```tsx
<NumberField formatOptions={{ style: 'currency', currency: 'USD' }} />
```

Verdict: GO. Same dep as W-02: needs B-19's input session.

### W-28 — Menu choice items — GO, rides B-04

Build the documented `CheckboxItem` / `RadioGroup` / `RadioItem` with full
roving + typeahead + `aria-checked` — resolving B-04 by building, not by
deleting docs. (`LinkItem` only if it clears its own bar; `asChild` may do.)

```tsx
<Menu.RadioGroup value={sort} onValueChange={setSort}>
  <Menu.RadioItem value="name">Name</Menu.RadioItem>
</Menu.RadioGroup>
```

Verdict: GO. Rides the menu crew as the B-04 fix.

### W-29 — Menubar coordination — GO, after menu bugs (the big one)

A `Menubar` root: open-one-closes-others, Left/Right across triggers while
open, Esc closes one level per press with focus return. Per APG menubar
pattern (APG contradicts "Esc closes all" for nested submenus).

```tsx
<Menubar>
  <Menu trigger={<button>File</button>}>…</Menu>
  <Menu trigger={<button>Edit</button>}>…</Menu>
</Menubar>
```

Verdict: GO, but last among the menu work — needs B-27/B-32 settled, and
it's the largest single item in this doc. API shape: standalone `Menubar` — LOCKED (HQ 2026-09-27). Radix/Ark/APG
all ship it top-level; `Menu.Bar`/`Menu.Row` scoping was considered and
declined (no precedent; a menubar coordinates menus, so it's a sibling of
Menu, not a child).

### W-35 — Clamp-or-warn contract for out-of-range controlled values — GO, after B-29

One shared contract, stated once: an out-of-range controlled value either
clamps (render + ARIA agree) or dev-warns — never silently degenerate,
never lying ARIA. Slider/Splitter first, then audit the rest.

```tsx
<Slider value={999} max={24} />
// thumb at 100% AND aria-valuenow="24" — or a dev warning naming all four parts
```

Verdict: GO. Generalizes the B-29 fix into a library-wide rule.

---

## Docs / process

### W-11 — Documented way to cancel outside-press dismiss — GO, rides docs crew

One documented, tested recipe for non-dismissable (destructive) dialogs: if
`preventDefault` already cancels, document + test it; if not, add
`dismissable?: boolean` (default true).

```tsx
<Overlay onOutsidePress={(e) => e.preventDefault()}>…</Overlay>
// destructive dialog demonstrably survives outside presses — in a browser test
```

Verdict: GO. Same edit also fixes the Popover/Overlay `onOpenChange` doc lag.

### W-13 — Listbox.md honesty lines — GO, rides docs crew

Two lines: options without `textValue` fall back to text content for
typeahead; `Listbox.Empty` is unconditional chrome the app must
conditionally render.

Verdict: GO. Trivial, docs crew.

### W-19 — Document the Tree selection model — GO, rides docs crew

Arrows/typeahead move focus only; Enter/Space select. Stated at the top of
Tree.md, not buried in SPEC. (Cost nav 8 wrong checks.)

Verdict: GO. Trivial, docs crew.

### W-30 — Docs↔implementation sync — GO, rides docs crew

Every `.md` matches shipped behavior: no phantom API, no false
controlled-only claims, no lagging "Proposed API". Covers B-04 (via menu),
B-05, B-06, B-07, B-25, W-11, W-13, W-19, plus the Popover/Overlay/Splitter/
toast phantoms. Docs examples must execute against dist.

Verdict: GO. Highest-leverage legibility work in the file — the phantom docs
cost sched more time than any single bug.

### W-31 — CI consumer smoke test — GO, rides packaging crew

CI packs `dist`, mounts every component in a bare Vite app, asserts zero
console errors; dist freshness verified on the same gate. Fails on the B-11
instances, B-03, and B-35 noise.

```yaml
# every PR touching packages/reference-lib/src or the build:
- pack dist → bare Vite app → mount all → assert zero console errors
```

Verdict: GO. Restores "the code you read is the code that runs."

### W-32 — Consumer styling contract docs — GO, rides docs crew

Document what's inline geometry (stylesheets can't touch it) vs
class-driven, and the supported dark-theme path without `ref sync` — so a
consumer sizes a Slider thumb and themes dark with no `!important` and no
trial-and-error.

Verdict: GO. Docs crew; pairs naturally with the theming writeup.

---

## Accepted via the bug backlog (no separate work)

- W-01 shipped stylesheet / consumer sync story → GO as B-13 (packaging crew).
- W-26 documented consumer setup → GO as B-13's docs facet (packaging crew).
- W-27 dialog minimum-CSS recipe → GO as B-25 (docs crew).
- W-33 submenu keyboard/hover parity → GO as B-32 (menu crew).
- W-34 working collapse → GO as B-31 (fields crew).

---

## Counts

25 verdict lines cover 26 asks (W-02 carries two). 14 feature + 6 docs/process
+ 5 via-bug. The 10 rejects (W-05–W-08, W-10, W-12, W-14, W-18, W-22, W-23)
stay in `docs/MISSIONS/PLAYTEST-REQUIREMENTS.md` with their Q1 rationale;
`docs/MISSIONS/PLAYTEST-WANTS.md` holds the captain's crew routing.
