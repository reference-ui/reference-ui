import type { McpComponent, McpComponentProp } from './types'

function libProp(
  name: string,
  type: string,
  description: string,
  optional = true
): McpComponentProp {
  return {
    name,
    count: 0,
    usage: 'unused',
    type,
    description,
    optional,
    readonly: false,
    origin: 'documented',
    styleProp: false,
  }
}

export const REFERENCE_UI_LIBRARY_COMPONENTS: McpComponent[] = [
  {
    name: 'Accordion',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Accordion type="single" collapsible>\n  <Accordion.Item value="item-1">\n    <Accordion.Trigger>Section title</Accordion.Trigger>\n    <Accordion.Content>Section body text</Accordion.Content>\n  </Accordion.Item>\n</Accordion>`,
    ],
    interface: { name: 'AccordionProps', source: '@reference-ui/lib' },
    props: [
      libProp('type', "'single' | 'multiple'", 'Determines whether one or multiple items can be opened simultaneously.'),
      libProp('collapsible', 'boolean', 'When type is single, allows closing content when clicking active trigger.'),
      libProp('value', 'string | string[]', 'The controlled value of the expanded item(s).'),
      libProp('onValueChange', '(value: string | string[]) => void', 'Event handler called when the expanded state changes.'),
      libProp('disabled', 'boolean', 'When true, prevents user from interacting with any accordion item.'),
      libProp('children', 'React.ReactNode', 'Accordion.Item elements.'),
    ],
  },
  {
    name: 'Tabs',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Tabs defaultValue="tab1">\n  <Tabs.List>\n    <Tabs.Trigger value="tab1">Account</Tabs.Trigger>\n    <Tabs.Trigger value="tab2">Password</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="tab1">Make changes to your account.</Tabs.Content>\n  <Tabs.Content value="tab2">Change your password here.</Tabs.Content>\n</Tabs>`,
    ],
    interface: { name: 'TabsProps', source: '@reference-ui/lib' },
    props: [
      libProp('defaultValue', 'string', 'The value of the tab that should be active by default.'),
      libProp('value', 'string', 'The controlled active tab value.'),
      libProp('onValueChange', '(value: string) => void', 'Event handler called when the active tab changes.'),
      libProp('orientation', "'horizontal' | 'vertical'", 'The orientation of the tabs.'),
      libProp('children', 'React.ReactNode', 'Tabs.List and Tabs.Content elements.'),
    ],
  },
  {
    name: 'Splitter',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Splitter orientation="horizontal">\n  <Splitter.Panel defaultSize={30} minSize={20}>Sidebar</Splitter.Panel>\n  <Splitter.Handle />\n  <Splitter.Panel defaultSize={70}>Main Content</Splitter.Panel>\n</Splitter>`,
    ],
    interface: { name: 'SplitterProps', source: '@reference-ui/lib' },
    props: [
      libProp('orientation', "'horizontal' | 'vertical'", 'Direction in which panels are split.'),
      libProp('children', 'React.ReactNode', 'Splitter.Panel and Splitter.Handle elements.'),
    ],
  },
  {
    name: 'Menu',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Menu>\n  <Menu.Trigger>\n    <Button>Actions</Button>\n  </Menu.Trigger>\n  <Menu.Content>\n    <Menu.Item onSelect={() => {}}>Edit</Menu.Item>\n    <Menu.Item onSelect={() => {}}>Duplicate</Menu.Item>\n    <Menu.Separator />\n    <Menu.Item destructive onSelect={() => {}}>Delete</Menu.Item>\n  </Menu.Content>\n</Menu>`,
    ],
    interface: { name: 'MenuProps', source: '@reference-ui/lib' },
    props: [
      libProp('open', 'boolean', 'The controlled open state of the menu.'),
      libProp('onOpenChange', '(open: boolean) => void', 'Event handler called when open state changes.'),
      libProp('children', 'React.ReactNode', 'Menu.Trigger and Menu.Content.'),
    ],
  },
  {
    name: 'Popover',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Popover>\n  <Popover.Trigger>\n    <Button>Open Popover</Button>\n  </Popover.Trigger>\n  <Popover.Content>\n    <P>Popover content</P>\n  </Popover.Content>\n</Popover>`,
    ],
    interface: { name: 'PopoverProps', source: '@reference-ui/lib' },
    props: [
      libProp('open', 'boolean', 'The controlled open state.'),
      libProp('onOpenChange', '(open: boolean) => void', 'Event handler called when open state changes.'),
      libProp('children', 'React.ReactNode', 'Popover.Trigger and Popover.Content.'),
    ],
  },
  {
    name: 'Tooltip',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Tooltip content="Add to library">\n  <Button iconOnly aria-label="Add">+</Button>\n</Tooltip>`,
    ],
    interface: { name: 'TooltipProps', source: '@reference-ui/lib' },
    props: [
      libProp('content', 'React.ReactNode', 'Content rendered inside the tooltip popup.'),
      libProp('delayDuration', 'number', 'Hover duration in ms before showing tooltip.'),
      libProp('children', 'React.ReactNode', 'Trigger element wrapped by the tooltip.'),
    ],
  },
  {
    name: 'Toast',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `import { toast } from '@reference-ui/lib'\n\ntoast.success('Changes saved successfully!')`,
    ],
    interface: { name: 'ToastProps', source: '@reference-ui/lib' },
    props: [
      libProp('title', 'string', 'Toast notification title.'),
      libProp('description', 'string', 'Secondary toast text.'),
    ],
  },
  {
    name: 'Switch',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Switch checked={enabled} onCheckedChange={setEnabled}>\n  Enable notifications\n</Switch>`,
    ],
    interface: { name: 'SwitchProps', source: '@reference-ui/lib' },
    props: [
      libProp('checked', 'boolean', 'Controlled boolean state of switch.'),
      libProp('defaultChecked', 'boolean', 'Default boolean state when uncontrolled.'),
      libProp('onCheckedChange', '(checked: boolean) => void', 'Event handler called when toggle changes.'),
      libProp('disabled', 'boolean', 'When true, disables switch toggle.'),
    ],
  },
  {
    name: 'Slider',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Slider value={[volume]} onValueChange={([val]) => setVolume(val)} min={0} max={100} step={1} />`,
    ],
    interface: { name: 'SliderProps', source: '@reference-ui/lib' },
    props: [
      libProp('value', 'number[]', 'Controlled array of slider thumb values.'),
      libProp('defaultValue', 'number[]', 'Default array of thumb values.'),
      libProp('onValueChange', '(value: number[]) => void', 'Event handler called when values change.'),
      libProp('min', 'number', 'Minimum slider value.'),
      libProp('max', 'number', 'Maximum slider value.'),
      libProp('step', 'number', 'Stepping increment.'),
    ],
  },
  {
    name: 'Combobox',
    kind: 'component',
    source: '@reference-ui/lib',
    count: 0,
    usage: 'unused',
    usedWith: {},
    examples: [
      `<Combobox items={options}>\n  <Combobox.Input placeholder="Select item..." />\n  <Combobox.Content>\n    {item => <Combobox.Item key={item.id} value={item.id}>{item.label}</Combobox.Item>}\n  </Combobox.Content>\n</Combobox>`,
    ],
    interface: { name: 'ComboboxProps', source: '@reference-ui/lib' },
    props: [
      libProp('items', 'T[]', 'Array of items displayed in combobox popup.'),
      libProp('value', 'string', 'Selected item value.'),
      libProp('onValueChange', '(value: string) => void', 'Handler called when selection changes.'),
    ],
  },
]

export function findReferenceUiLibraryComponent(name: string): McpComponent | null {
  const comp = REFERENCE_UI_LIBRARY_COMPONENTS.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  )
  return comp ? { ...comp } : null
}
