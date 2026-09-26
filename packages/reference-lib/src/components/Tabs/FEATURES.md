# Tabs features

Design-needed follow-ups: each entry changes API surface, behavior
consumers feel, or naming/semantics, so each needs a product/UX call
before implementation. Split out of `DECISIONS.md`; that file keeps the
verdicts, this file keeps the proposals.

## 1. Required controlled value; API freeze removals (from DECISIONS candidate #1)

**REVERSED in part (HQ EOD 2026-09-26):** Tabs keeps uncontrolled
support — users don't always want to control tabs. `value` is optional
again and `defaultValue?: string | null` is restored (dual-mode per the
Accordion shape: `value !== undefined` → controlled, else self-managed;
`onChange` notifies in both). Root-`disabled` removal, `variant`
retention, `keepMounted`, rescue, handoff, stop policy, and the link
recipe all stand — only the required-`value` cut is undone.

**What it did:** Made `value` required-controlled and deleted
`defaultValue`, `variant` (`line`/`pill`), and root `disabled`; line/pill
visuals move to Book, not the kernel.

**API (as landed, before the reversal):**

```tsx
// value becomes required; undefined throws
// `requires a controlled `value` prop`
<Tabs value={value} onChange={setValue}>…</Tabs>
// defaultValue, variant, and root disabled are removed entirely
```

**Maintainer take:** Right direction for a major, but only after Book owns line/pill stories so current `variant="pill"` consumers have a migration path.

## 2. RovingFocus composition (from DECISIONS candidate #2)

**What it does:** Renders the List inside `RovingFocus.Root` and each Tab
inside `RovingFocus.Item`, deleting the hand-rolled List keydown; Tabs
keeps activation policy only.

**API:** No public API change. Internal: `RovingFocus.Root` with
orientation, loop, and typeahead off; delete the `querySelectorAll` /
`document.activeElement` / dir-lookup movement at `Tabs.tsx:167-228`.

**Maintainer take:** The right end-state once the RovingFocus kernel API stabilizes — one shared movement owner beats two arrow implementations.

## 3. Always-mounted panel children (from DECISIONS candidate #3)

**What it does:** Inactive panels keep children mounted under native
`hidden`, so effects, form state, and timers in hidden panels stay alive
across tab switches.

**API:** Remove the `{isSelected && children}` gate at `Tabs.tsx:438`;
either global always-mounted law per `Tabs.md`, or a per-panel opt-in:

```tsx
<TabPanel value="settings" keepMounted>…</TabPanel>
```

**Maintainer take:** Needs a real consumer (cross-tab form state) before changing effects semantics — don't pay the compat cost speculatively.

**HQ 2026-09-26:** Approved as per-panel OPT-IN ONLY (`keepMounted` prop) — never the default behavior. The global always-mounted law is DECLINED.

## 4. Focus rescue on programmatic hide (from DECISIONS candidate #5)

**What it does:** When the controlled value changes and focus sits inside
the now-hidden panel, moves focus to the newly selected Tab (or a
nearest-enabled fallback), with no `onChange`.

**API:** No new props. Needs the element registry (`PATCHES.md` #1) for
robust fallback lookup.

**Maintainer take:** Worth doing once the registry exists — focus stranded under `hidden` is a genuine a11y hole.

## 5. Pointerdown-early activation (from DECISIONS candidate #6)

**What it does:** Primary pointerdown/mousedown on an enabled unselected
Tab requests selection immediately (focus + `onChange`); the completing
click dedupes; consumer `preventDefault` on pointerdown cancels; pins the
`TB-SELECT-06` blur-ordering contract in the same change.

**API:** No new props. Behavioral timing change plus the blur-order proof.

**Maintainer take:** Only with UX-signed press-timing design — it changes timing every consumer feels, so demand a forcing bug first.

## 6. Disabled/removed-tab focus handoff (from DECISIONS candidate #7)

**What it does:** In manual mode, when the focused (unselected) tab
disables or unmounts, focus and the current stop move to the nearest
enabled tab (ties to preceding), while selection and the visible panel
stay unchanged and no request fires.

**API:** No new props. Needs the ordered enabled-tab list (`PATCHES.md` #1).

**Maintainer take:** Good once the registry exists and the TESTS tie-break is confirmed — the natural companion to closable-tab strips.

## 7. Ref forwarding on all parts (from DECISIONS candidate #8)

**What it does:** List/Tab/Panel accept `ref` and attach it to the
documented native host, composing with internal refs and cleaning up on
unmount, so consumers can focus or measure part hosts.

**API:**

```tsx
const listRef = useRef<HTMLDivElement>(null);
const tabRef = useRef<HTMLButtonElement>(null);
const panelRef = useRef<HTMLDivElement>(null);
<Tabs.List ref={listRef}>…</Tabs.List> // host: div
<Tabs.Tab ref={tabRef} value="a">…</Tabs.Tab> // host: button
<Tabs.TabPanel ref={panelRef} value="a">…</Tabs.TabPanel> // host: div
```

Repo idiom call: ref-as-prop (React 19) vs `forwardRef` for 17/18 compat.

**Maintainer take:** Add on first consumer demand — small and safe, but no reason to grow API surface speculatively.

## 8. Tab-stop policy when selection is disabled (from DECISIONS gap #1)

**What it does:** Defines the roving tab stop when the controlled value's
tab is disabled: either the stop falls back to first-enabled, or the list
honestly exposes zero stops.

**API:** No new props. Needs the registry (`PATCHES.md` #1) for the
first-enabled fallback.

**Maintainer take:** First-enabled fallback reads less surprising for keyboard users — but HQ/UX must confirm the policy before implementation.

## 9. Link-navigation Tabs (from DECISIONS gap #3)

**What it does:** Tab-styled navigation with real URLs for docs-site and
settings-nav shapes — either a Tab rendering an anchor, or a documented
recipe.

**API:** Either a link Tab (arrow movement and auto-activation semantics
for links need a design call):

```tsx
<Tabs.Tab value="docs" href="/docs">Docs</Tabs.Tab>
```

or a Book "tabs look, links behave" recipe with no kernel change.

**Maintainer take:** Start as a Book recipe, not kernel API — anchor semantics (middle-click, open-in-tab) collide with the button/ARIA tab pattern.
