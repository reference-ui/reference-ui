# Tabs

Proof: [TESTS.md](./TESTS.md).

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

**APG:** react-aria `useTabList` / `useTab`. **Composition shape:** radix tabs wrapping RovingFocus. Do not add a Tabs.Provider.
