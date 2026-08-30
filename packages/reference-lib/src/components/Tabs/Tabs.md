# Tabs

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
  extends React.HTMLAttributes<HTMLDivElement> {}

interface TabsTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  disabled?: boolean
}

interface TabsPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}
```

`Tabs` renders no node. `Tabs.List` renders `div` with `role="tablist"`. `Tabs.Tab` renders `button` with `role="tab"`. `Tabs.Panel` renders `div` with `role="tabpanel"`.
