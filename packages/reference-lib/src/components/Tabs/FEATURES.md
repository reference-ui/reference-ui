# Tabs features

Design-needed follow-ups: each entry changes API surface, behavior
consumers feel, or naming/semantics, so each needs a product/UX call
before implementation. Split out of `DECISIONS.md`; that file keeps the
verdicts, this file keeps the proposals.

## 1. Required controlled value; API freeze removals (from DECISIONS candidate #1)

**SUPERSEDED (HQ EOD 2026-09-26 optional-value exception):** Tabs keeps
uncontrolled support — users don't always want to control tabs — but
with NO seeding prop anywhere: `value` is simply optional, and omitting
it means self-managed from the first tab (`value !== undefined` →
controlled, else self-managed; `onChange` notifies in both).
Root-`disabled` removal, `variant` retention, `keepMounted`, rescue,
handoff, stop policy, and the link recipe all stand — only the
required-`value` cut is undone.

**What it did:** Made `value` required-controlled and deleted the
uncontrolled seeding prop, `variant` (`line`/`pill`), and root
`disabled`; line/pill visuals move to Book, not the kernel.

**API (as landed, before the reversal):**

```tsx
// value becomes required; undefined throws
// `requires a controlled `value` prop`
<Tabs value={value} onChange={setValue}>…</Tabs>
// seeding prop, variant, and root disabled are removed entirely
```

**Maintainer take:** Right direction for a major, but only after Book owns line/pill stories so current `variant="pill"` consumers have a migration path.

**HQ DECISION (2026-09-27, variant — SUPERSEDES the take above for
`variant`):** Tabs stays a complete styled component. `variant`
(`line`/`pill`) is permanent kernel API, not a deviation; no headless
split, no structural or className churn. Customization grows through
the variant axis itself — authors add their own variant or override an
existing one. The Book-migration framing for `variant` is retired.
Open item: the open-variant API (HQ sketch requested, not yet picked).

**MECHANISM LANDED (2026-09-27, system-variant crew 155):** `variant` is a
SYSTEM-level prop — `TabsVariant` (`line`/`pill`) prepackaged as kernel
`recipe()` configs (`tabsListRecipe`/`tabsTabRecipe`, exported), the prop
type open (`TabsVariantProp`) so author names typecheck and render through
the author's own recipe classes; unknown names resolve to kernel base +
axis classes with no built-in paint. No variants prop, no theme registry.
Worked proof: `MyTabs.tsx` + `MyTabs` story + `TB-SYS-01` (custom `underline`
name + `css()` override of a built-in). Line/pill pixel-identical (22/22
snapshots). Lib-wide pattern per HQ.

## 2. RovingFocus composition (from DECISIONS candidate #2)

**What it does:** Renders the List inside `RovingFocus.Root` and each Tab
inside `RovingFocus.Item`, deleting the hand-rolled List keydown; Tabs
keeps activation policy only.

**API:** No public API change. Internal: `RovingFocus.Root` with
orientation, loop, and typeahead off; delete the `querySelectorAll` /
`document.activeElement` / dir-lookup movement at `Tabs.tsx:167-228`.

**Maintainer take:** The right end-state once the RovingFocus kernel API stabilizes — one shared movement owner beats two arrow implementations.

**LANDED 2026-09-28 (finish-line P2D):** List renders inside
`RovingFocus.Root` (orientation, loop, typeahead off), each Tab inside
`RovingFocus.Item`; the hand-rolled keydown is deleted. The kernel
gained an additive `useRovingFocusContext` seam (P1.1-frozen API
otherwise untouched) so Tabs can sync selection into kernel
currentness (`TB-SELECT-03`). Activation policy stays in Tabs:
observe-only List activation (moved-check, nested-scoped) plus the
`TabsSelectionSync` null component. All 22 snapshots byte-identical.

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

**LANDED 2026-09-28 (finish-line P2D, TESTS-driven):** `TESTS.md`
`TB-SELECT-08` mandates the behavior, so the take's forcing requirement
is met by contract. Primary press arms the request; the native
mousedown-default focus fires the focus handler, which requests — so
blur, tab focus, and `onChange` order themselves (TB-SELECT-06) with
zero script focus (script focus during a mouse press matches
`:focus-visible` and paints a ring the snapshots pin as absent). The
completing click dedupes; consumer `preventDefault` on the press
cancels press and click. Reconciliation with `TB-SELECT-05`
(click-cancel): cancel works at the same phase — a real press already
requested before its click, so `TB-SELECT-05` pins discrete-click
semantics in Vitest.

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

**LANDED 2026-09-28 (finish-line P2D, TESTS-driven):** `TB-DOM-09`
mandates refs, so the demand requirement is met by contract.
`forwardRef` on List/Tab/Panel (React 17/18 compat), composed with
internal registry refs, cleanup on unmount. Managed-wins: internal
`data-state`/`data-disabled`/`aria-selected`/`aria-controls`/
orientation attrs drop consumer conflicts. Known imperfection:
slot-wrapped callback refs (List, Tab) see settled-correct
attach churn per render — the kernel slot chain recreates per render
(flagged kernel follow-up; Panel's direct ref is stable).

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
