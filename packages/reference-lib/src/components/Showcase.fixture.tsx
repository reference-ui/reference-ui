import * as React from 'react'
import {
  Div,
  Button,
  Input,
  Span,
  H2,
  H3,
  P,
} from '@reference-ui/react'
import { Accordion } from './Accordion'
import { Calendar } from './Calendar'
import { Collapsible } from './Collapsible'
import { Combobox } from './Combobox'
import { DateField } from './DateField'
import { Field } from './Field'
import { Listbox } from './Listbox'
import { Menu } from './Menu'
import { NumberField } from './NumberField'
import { Overlay } from './Overlay'
import { Popover } from './Popover'
import { Slider } from './Slider'
import { Splitter } from './Splitter'
import { Switch } from './Switch'
import { Tabs } from './Tabs'
import { Toast, toast } from './Toast'
import { Tooltip } from './Tooltip'
import { Tree } from './Tree'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Div
      p="5r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="lg"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 2px 10px rgba(0,0,0,0.06)"
      display="flex"
      flexDirection="column"
      gap="3r"
    >
      <H3 fontSize="4r" fontWeight="600" m="0" color="design.text.base">
        {title}
      </H3>
      <Div display="flex" flexDirection="column" gap="3r">
        {children}
      </Div>
    </Div>
  )
}

export default function ShowcaseFixture() {
  const [switchChecked, setSwitchChecked] = React.useState(true)
  const [sliderVal, setSliderVal] = React.useState<number | number[]>([25, 75])
  const [comboboxVal, setComboboxVal] = React.useState<string | null>('react')
  const [dateVal, setDateVal] = React.useState<string | null>('2026-08-31')
  const [numberVal, setNumberVal] = React.useState<number | null>(42)
  const [listboxVal, setListboxVal] = React.useState<any>('option-1')
  const [isOverlayOpen, setIsOverlayOpen] = React.useState(false)

  return (
    <Div display="flex" flexDirection="column" gap="6r" maxW="300r" mx="auto">
      {/* Header */}
      <Div
        p="6r"
        borderRadius="xl"
        bg="ui.dialog.background"
        border="1px solid"
        borderColor="ui.dialog.border"
        boxShadow="0 4px 20px rgba(0,0,0,0.08)"
      >
        <H2 fontSize="7r" fontWeight="700" m="0" color="design.text.base">
          Reference UI Component Suite
        </H2>
        <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
          Interactive Cosmos fixture showcasing all Reference UI components built with JSX primitives & tokens.
        </P>
      </Div>

      {/* Grid of components */}
      <Div
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(65r, 1fr))"
        gap="5r"
      >
        {/* Switch */}
        <SectionCard title="Switch">
          <Div display="flex" alignItems="center" gap="3r">
            <Switch
              checked={switchChecked}
              onChange={setSwitchChecked}
              aria-label="Toggle notifications"
            />
            <Span fontSize="3.5r" fontWeight="500">
              {switchChecked ? 'Enabled' : 'Disabled'}
            </Span>
          </Div>
          <Div display="flex" alignItems="center" gap="3r">
            <Switch disabled checked aria-label="Disabled Switch" />
            <Span fontSize="3r" color="design.text.light">Disabled Switch</Span>
          </Div>
        </SectionCard>

        {/* Field & Input */}
        <SectionCard title="Field">
          <Div display="flex" alignItems="center" gap="2r">
            <Field flex="1">
              <Input placeholder="Enter username..." />
            </Field>
            <Button type="button">Save</Button>
          </Div>
          <Field status="warning" width="100%">
            <Input placeholder="Warning state..." />
          </Field>
        </SectionCard>

        {/* NumberField */}
        <SectionCard title="NumberField">
          <NumberField
            value={numberVal}
            onChange={setNumberVal}
            min={0}
            max={100}
            step={1}
            display="inline-flex"
            alignItems="center"
            gap="1.5r"
          >
            <NumberField.Decrement />
            <NumberField.Input />
            <NumberField.Increment />
          </NumberField>
        </SectionCard>

        {/* Slider */}
        <SectionCard title="Slider (Range)">
          <Div px="2r">
            <Slider
              value={sliderVal}
              onChange={setSliderVal}
              min={0}
              max={100}
              step={1}
            >
              <Slider.Track>
                <Slider.Range />
                <Slider.Thumb index={0} />
                <Slider.Thumb index={1} />
              </Slider.Track>
            </Slider>
          </Div>
          <Span fontSize="3r" color="design.text.light">
            Range: {Array.isArray(sliderVal) ? `${sliderVal[0]} - ${sliderVal[1]}` : sliderVal}
          </Span>
        </SectionCard>

        {/* Tooltip & Popover */}
        <SectionCard title="Tooltip & Popover">
          <Div display="flex" gap="3r" flexWrap="wrap" alignItems="center">
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  px="3r"
                  py="1.5r"
                  borderRadius="sm"
                  bg="ui.button.background"
                  color="ui.button.foreground"
                  border="1px solid"
                  borderColor="ui.field.border"
                  cursor="pointer"
                >
                  Hover for Tooltip
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="top">
                Fast, responsive tooltip
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip>

            <Popover>
              <Popover.Trigger
                px="3r"
                py="1.5r"
                borderRadius="sm"
                bg="ui.button.background"
                color="ui.button.foreground"
                border="1px solid"
                borderColor="ui.field.border"
                cursor="pointer"
              >
                Open Popover
              </Popover.Trigger>
              <Popover.Content
                p="3.5r"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
                borderRadius="md"
                border="1px solid"
                borderColor="ui.dialog.border"
                boxShadow="0 4px 16px rgba(0,0,0,0.15)"
              >
                <Div display="flex" flexDirection="column" gap="2r">
                  <Span fontWeight="600" fontSize="3.5r">Popover Details</Span>
                  <Span fontSize="3r" color="design.text.light">Interactive content inside floating popover.</Span>
                  <Popover.Close
                    px="2.5r"
                    py="1r"
                    borderRadius="sm"
                    bg="colors.gray.100"
                    border="1px solid"
                    borderColor="ui.field.border"
                    cursor="pointer"
                    alignSelf="flex-start"
                  >
                    Close
                  </Popover.Close>
                </Div>
                <Popover.Arrow />
              </Popover.Content>
            </Popover>
          </Div>
        </SectionCard>

        {/* Menu */}
        <SectionCard title="Menu">
          <Menu>
            <Menu.Trigger
              px="3r"
              py="1.5r"
              borderRadius="sm"
              bg="ui.button.background"
              color="ui.button.foreground"
              border="1px solid"
              borderColor="ui.field.border"
              cursor="pointer"
              alignSelf="flex-start"
            >
              Actions Menu ▾
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onSelect={() => toast.show('Profile clicked')}>Profile</Menu.Item>
              <Menu.Item onSelect={() => toast.show('Settings clicked')}>Settings</Menu.Item>
              <Menu.Separator />
              <Menu.CheckboxItem checked onSelect={() => toast.show('Notifications toggled')}>
                Notifications
              </Menu.CheckboxItem>
              <Menu.Separator />
              <Menu.Item disabled>Disabled Action</Menu.Item>
            </Menu.Content>
          </Menu>
        </SectionCard>

        {/* Toast */}
        <SectionCard title="Toast Notifications">
          <Div display="flex" gap="2r" flexWrap="wrap">
            <Button
              px="3r"
              py="1.5r"
              borderRadius="sm"
              bg="ui.button.background"
              color="ui.button.foreground"
              border="1px solid"
              borderColor="ui.field.border"
              cursor="pointer"
              onClick={() => {
                toast.show(
                  <Toast.Root>
                    <Toast.Title>Success!</Toast.Title>
                    <Toast.Description>Component loaded cleanly with design tokens.</Toast.Description>
                  </Toast.Root>,
                  { position: 'bottom-end' }
                )
              }}
            >
              Show Bottom-End Toast
            </Button>
            <Button
              px="3r"
              py="1.5r"
              borderRadius="sm"
              bg="ui.button.background"
              color="ui.button.foreground"
              border="1px solid"
              borderColor="ui.field.border"
              cursor="pointer"
              onClick={() => {
                toast.show(
                  <Toast.Root>
                    <Toast.Title>Update Available</Toast.Title>
                    <Toast.Description>A new version of Reference UI is ready.</Toast.Description>
                    <Toast.Action onClick={() => toast.dismissAll()}>Dismiss All</Toast.Action>
                  </Toast.Root>,
                  { position: 'top-center' }
                )
              }}
            >
              Show Top-Center Toast
            </Button>
          </Div>
        </SectionCard>

        {/* Collapsible & Accordion */}
        <SectionCard title="Collapsible & Accordion">
          <Collapsible defaultOpen>
            <Collapsible.Trigger
              width="100%"
              textAlign="left"
              justifyContent="flex-start"
              bg="ui.field.background"
              color="ui.field.foreground"
              borderColor="ui.field.border"
            >
              Toggle Collapsible Section
            </Collapsible.Trigger>
            <Collapsible.Content p="3r">
              <Span fontSize="3.5r" color="design.text.light">
                Collapsible content revealed smoothly using Reference primitives.
              </Span>
            </Collapsible.Content>
          </Collapsible>

          <Accordion expansion="single" defaultValue="item-1" display="flex" flexDirection="column" gap="1r">
            <Collapsible id="item-1">
              <Collapsible.Trigger
                width="100%"
                textAlign="left"
                justifyContent="flex-start"
                bg="ui.field.background"
                color="ui.field.foreground"
                borderColor="ui.field.border"
              >
                Accordion Item 1
              </Collapsible.Trigger>
              <Collapsible.Content p="3r">
                <Span fontSize="3.5r" color="design.text.light">Content inside Accordion item 1.</Span>
              </Collapsible.Content>
            </Collapsible>
            <Collapsible id="item-2">
              <Collapsible.Trigger
                width="100%"
                textAlign="left"
                justifyContent="flex-start"
                bg="ui.field.background"
                color="ui.field.foreground"
                borderColor="ui.field.border"
              >
                Accordion Item 2
              </Collapsible.Trigger>
              <Collapsible.Content p="3r">
                <Span fontSize="3.5r" color="design.text.light">Content inside Accordion item 2.</Span>
              </Collapsible.Content>
            </Collapsible>
          </Accordion>
        </SectionCard>

        {/* Tabs */}
        <SectionCard title="Tabs">
          <Tabs defaultValue="tab1">
            <Tabs.List>
              <Tabs.Tab value="tab1">Overview</Tabs.Tab>
              <Tabs.Tab value="tab2">Tokens</Tabs.Tab>
              <Tabs.Tab value="tab3">Props</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="tab1">
              <Span fontSize="3r">Overview tab panel using semantic design tokens.</Span>
            </Tabs.Panel>
            <Tabs.Panel value="tab2">
              <Span fontSize="3r">Tokens tab panel styled with rhythm units.</Span>
            </Tabs.Panel>
            <Tabs.Panel value="tab3">
              <Span fontSize="3r">Props extending PrimitiveProps for type safety.</Span>
            </Tabs.Panel>
          </Tabs>
        </SectionCard>

        {/* Combobox & Listbox */}
        <SectionCard title="Combobox & Listbox">
          <Combobox value={comboboxVal} onChange={setComboboxVal}>
            <Field>
              <Combobox.Input placeholder="Select framework..." />
              <Button type="button" aria-label="Open suggestions">▾</Button>
            </Field>
            <Combobox.Popover>
              <Listbox>
                <Listbox.Option value="react">React</Listbox.Option>
                <Listbox.Option value="vue">Vue</Listbox.Option>
                <Listbox.Option value="svelte">Svelte</Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>

          <Listbox
            value={listboxVal}
            onChange={setListboxVal}
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="md"
            p="1r"
          >
            <Listbox.Option value="option-1">Listbox Option 1</Listbox.Option>
            <Listbox.Option value="option-2">Listbox Option 2</Listbox.Option>
            <Listbox.Option value="option-3">Listbox Option 3</Listbox.Option>
          </Listbox>
        </SectionCard>

        {/* DateField & Calendar */}
        <SectionCard title="DateField & Calendar">
          <DateField value={dateVal} onChange={setDateVal}>
            <Field>
              <DateField.Input />
              <DateField.Trigger />
            </Field>
            <DateField.Picker>
              <Calendar value={dateVal} onChange={setDateVal}>
                <Calendar.Header>
                  <Calendar.PrevButton />
                  <Calendar.Heading />
                  <Calendar.NextButton />
                </Calendar.Header>
                <Calendar.Grid />
              </Calendar>
            </DateField.Picker>
          </DateField>
        </SectionCard>

        {/* Tree */}
        <SectionCard title="Tree View">
          <Tree
            defaultValue="file-1"
            defaultExpanded={['folder-1']}
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="md"
            p="2r"
          >
            <Tree.Item id="folder-1" isBranch>
              <Div display="flex" alignItems="center" gap="1r" py="1r">
                <Tree.Expander itemId="folder-1" />
                <Span fontSize="3r" fontWeight="600">📁 components/</Span>
              </Div>
              <Tree.Group>
                <Tree.Item id="file-1">
                  <Div py="0.5r">
                    <Span fontSize="3r">📄 Button.tsx</Span>
                  </Div>
                </Tree.Item>
                <Tree.Item id="file-2">
                  <Div py="0.5r">
                    <Span fontSize="3r">📄 Switch.tsx</Span>
                  </Div>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item id="file-3">
              <Div py="1r">
                <Span fontSize="3r">📄 package.json</Span>
              </Div>
            </Tree.Item>
          </Tree>
        </SectionCard>

        {/* Modal Overlay */}
        <SectionCard title="Modal Overlay (Dialog)">
          <Button
            px="3r"
            py="1.5r"
            borderRadius="sm"
            bg="ui.button.background"
            color="ui.button.foreground"
            border="1px solid"
            borderColor="ui.field.border"
            cursor="pointer"
            alignSelf="flex-start"
            onClick={() => setIsOverlayOpen(true)}
          >
            Open Modal Dialog
          </Button>

          <Overlay open={isOverlayOpen} onOpenChange={setIsOverlayOpen}>
            <Overlay.Backdrop bg="rgba(0,0,0,0.4)" zIndex={40} />
            <Overlay.Content
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                p="5r"
                bg="ui.dialog.background"
                color="ui.dialog.foreground"
                borderRadius="lg"
                border="1px solid"
                borderColor="ui.dialog.border"
                boxShadow="0 10px 40px rgba(0,0,0,0.25)"
                minW="70r"
                zIndex={50}
              >
                <H3 fontSize="4.5r" fontWeight="600" m="0">Modal Dialog</H3>
                <P fontSize="3r" color="design.text.light" mt="2r">
                  Modal dialog overlay with backdrop and focus trap.
                </P>
                <Div display="flex" justifyContent="flex-end" gap="2r" mt="4r">
                  <Button
                    px="3r"
                    py="1.5r"
                    borderRadius="sm"
                    bg="colors.gray.100"
                    border="1px solid"
                    borderColor="ui.field.border"
                    cursor="pointer"
                    onClick={() => setIsOverlayOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    px="3r"
                    py="1.5r"
                    borderRadius="sm"
                    bg="ui.button.background"
                    color="ui.button.foreground"
                    border="1px solid"
                    borderColor="ui.field.border"
                    cursor="pointer"
                    onClick={() => setIsOverlayOpen(false)}
                  >
                    Confirm
                  </Button>
                </Div>
              </Overlay.Content>
          </Overlay>
        </SectionCard>

        {/* Splitter */}
        <SectionCard title="Splitter">
          <Div height="30r" border="1px solid" borderColor="ui.field.border" borderRadius="md" overflow="hidden">
            <Splitter defaultValue={[40, 60]} height="100%">
              <Splitter.Panel index={0} p="3r" bg="colors.gray.100">
                <Span fontSize="3r" fontWeight="500">Panel 1 (Resizable)</Span>
              </Splitter.Panel>
              <Splitter.Handle index={0} />
              <Splitter.Panel index={1} p="3r" bg="colors.gray.50">
                <Span fontSize="3r" fontWeight="500">Panel 2 (Resizable)</Span>
              </Splitter.Panel>
            </Splitter>
          </Div>
        </SectionCard>
      </Div>
    </Div>
  )
}
