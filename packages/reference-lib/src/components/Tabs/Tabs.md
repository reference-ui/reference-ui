# Tabs

Proof: [SPEC.md](./SPEC.md). Cases: [TESTS.md](./TESTS.md).

Directional keyboard cycling, automatic vs. manual activation, `aria-controls` / `aria-labelledby` linking. Built on `RovingFocus`.

```tsx
<Tabs
  value={tab}
  onChange={setTab}
  orientation="horizontal"
  activation="automatic"
>
  <Tabs.List aria-label="Settings">
    <Tabs.Tab value="general">General</Tabs.Tab>
    <Tabs.Tab value="billing">Billing</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="general">{children}</Tabs.Panel>
  <Tabs.Panel value="billing">{children}</Tabs.Panel>
</Tabs>
```

## Proposed API

```ts
interface TabsProps {
  children?: React.ReactNode
  value: string
  onChange?: (value: string) => void
  orientation?: "horizontal" | "vertical"
  activation?: "automatic" | "manual"
  variant?: "line" | "pill"
}

interface TabsListProps
  extends ReferencePartProps<"div"> {}

interface TabsTabProps
  extends ReferencePartProps<"button"> {
  value: string
  disabled?: boolean
}

interface TabsPanelProps
  extends ReferencePartProps<"div"> {
  value: string
  keepMounted?: boolean
}
```

`Tabs` renders no node. `Tabs.List` renders `div` with `role="tablist"`.
`Tabs.Tab` renders `button[type=button]` with `role="tab"`. `Tabs.Panel`
renders `div` with `role="tabpanel"`. Every declared Panel stays mounted; the
one matching controlled `value` is visible and every inactive Panel has the
native `hidden` attribute. A programmatic selection change moves focus out of
a panel that becomes hidden to the newly selected Tab or a safe enabled
fallback.
Omitted orientation is horizontal and omitted activation is automatic.

List and Tab render the signed line look by default and the pill look
under `variant="pill"` (also settable per List/Tab). `variant` stays in
the kernel by pipeline necessity, not by design taste: the stylesheet
collector only reliably harvests inline props on primitives, so
Book-side token recipes flip in and out of the CSS across syncs and the
pill look has no other collectible home (proven 2026-09-26; see the
crew log). A `keepMounted` panel keeps inactive children alive under
`hidden`; the default still unmounts them.

## Link navigation (recipe, not API)

When tabs navigate between URLs (docs sites, settings sections), do not
look for `href` on `Tabs.Tab` — the kernel has no link API by decision,
and anchor semantics (middle-click, open-in-tab, one tab stop per link)
collide with the ARIA tab pattern (roving tabindex, arrow keys,
`aria-selected`). Use the Book `LinkNav` recipe instead: real anchors in
a `nav` landmark reusing the kernel's own line-tab utility classes, and
`aria-current="page"` for the current route, owned by your router.

---

## Problems we own

Tabs is RovingFocus plus an activation policy. Typeahead stays off.

### Automatic vs manual

Automatic: focus selects. Manual: arrows move focus; Space/Enter selects. Getting this wrong is the usual APG miss.

**Vendor.** Radix `activationMode` (default automatic). Aria `keyboardActivation` / `selectOnFocus`. Zag `activationMode`. Aligned.

**Lift.** Our name is `activation`.

### Orientation + RTL

Horizontal vs vertical arrows. `dir` flips left/right. All three vendors agree.

### `aria-controls` only when selected

Aria `useTab.ts` sets `aria-controls` only on the selected tab. Radix may wire it on every trigger. APG: the selected tab controls the visible panel.

**Lift** Aria’s selected-only rule. `aria-labelledby` on the panel points at the tab.

### Zag `deselectable`

Nullable selected tab is not APG Tabs. **Leave.**

---

## Convergence

**APG:** react-aria `useTabList` / `useTab`. **Composition shape:** radix tabs wrapping RovingFocus. Do not add a public `Tabs.Provider`.
