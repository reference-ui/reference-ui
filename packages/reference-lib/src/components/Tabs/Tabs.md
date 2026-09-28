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
  value?: string
  onChange?: (value: string) => void
  orientation?: "horizontal" | "vertical"
  activation?: "automatic" | "manual"
  variant?: TabsVariantProp // "line" | "pill" + author recipe names
  keepMounted?: boolean // default false: keep every panel mounted when inactive
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
one matching the current `value` is visible and every inactive Panel has the
native `hidden` attribute. A programmatic selection change moves focus out of
a panel that becomes hidden to the newly selected Tab or a safe enabled
fallback.
Omitted orientation is horizontal and omitted activation is automatic.
Selection is optional-value: a supplied `value` controls the tab, an
omitted `value` self-manages from the first tab (`onChange` notifies in
both; there is no seeding prop).

List and Tab render the signed line look by default and the pill look
under `variant="pill"` (also settable per List/Tab). `variant` is a
permanent system-level kernel prop: line/pill ship prepackaged as
exported recipes (`tabsListRecipe`/`tabsTabRecipe`), and authors add
their own typed names with their own `recipe()` (see `MyTabs.tsx`) or
override built-ins with `css()` — no variants prop, no theme registry.
A `keepMounted` panel keeps inactive children alive under
`hidden`; the default still unmounts them. `keepMounted` on `Tabs` itself
keeps every panel mounted (OR-ed with the per-panel opt-in); kept inactive
panels carry native `hidden`, which removes them from tab order and the
accessibility tree, so keyboard/ARIA behavior is unchanged.
In dev, a controlled `value` matching no Tab logs a `console.error`
naming the component, the bad value, and the registered values; valid
values, uncontrolled mode, and async-registered tabs that resolve stay
silent.

## Link navigation (recipe, not API)

When tabs navigate between URLs (docs sites, settings sections), do not
look for `href` on `Tabs.Tab` — the kernel has no link API by decision,
and anchor semantics (middle-click, open-in-tab, one tab stop per link)
collide with the ARIA tab pattern (roving tabindex, arrow keys,
`aria-selected`). Use the Book `LinkNav` recipe instead: real anchors in
a `nav` landmark calling the kernel's own line-tab recipes, and
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
