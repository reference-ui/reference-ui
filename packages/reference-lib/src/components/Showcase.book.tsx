import * as React from 'react'
import {
  Div,
  Button,
  Input,
  Span,
  H2,
  H3,
  H4,
  P,
} from '@reference-ui/react'
import { KeyboardArrowDownIcon } from '@reference-ui/icons'
import { dividerContent, dividerTrigger } from './disclosureChrome'
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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
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
      gap="4r"
    >
      <Div display="flex" flexDirection="column" gap="0.5r">
        <H3 fontSize="4r" fontWeight="600" m="0" color="design.text.base">
          {title}
        </H3>
        {description && (
          <Span fontSize="3r" color="design.text.light">
            {description}
          </Span>
        )}
      </Div>
      {children}
    </Div>
  )
}

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Div
      p="4r"
      border="1px solid"
      borderColor="ui.field.border"
      borderRadius="md"
      display="flex"
      flexDirection="column"
      gap="3r"
    >
      <H4 fontSize="3.5r" fontWeight="600" m="0" color="design.text.base">
        {label}
      </H4>
      <Div display="flex" flexDirection="column" gap="3r">
        {children}
      </Div>
    </Div>
  )
}

const disclosureTrigger = dividerTrigger

function FormInputsRow({
  switchChecked,
  setSwitchChecked,
  numberVal,
  setNumberVal,
  singleSliderVal,
  setSingleSliderVal,
  sliderVal,
  setSliderVal,
}: {
  switchChecked: boolean
  setSwitchChecked: (v: boolean) => void
  numberVal: number | null
  setNumberVal: (v: number | null) => void
  singleSliderVal: number
  setSingleSliderVal: (v: number) => void
  sliderVal: number | number[]
  setSliderVal: (v: number | number[]) => void
}) {
  return (
    <SectionCard
      title="Form Inputs"
      description="Toggles, text fields, numeric steppers, and sliders for capturing user input."
    >
      <Div display="grid" gap="4r" gridTemplateColumns="repeat(auto-fit, minmax(60r, 1fr))">
        <DemoCell label="Switch">
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
        </DemoCell>

        <DemoCell label="Field">
          <Div display="flex" alignItems="center" gap="2r">
            <Field flex="1">
              <Input placeholder="Enter username..." />
            </Field>
            <Button type="button">Save</Button>
          </Div>
          <Field borderColor="colors.amber.500" width="100%">
            <Input placeholder="Custom warning styling..." />
          </Field>
        </DemoCell>

        <DemoCell label="NumberField">
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
        </DemoCell>

        <DemoCell label="Slider">
          <Div display="flex" flexDirection="column" gap="1.5r">
            <Span fontSize="3r" color="design.text.light">
              Single Thumb ({singleSliderVal}%)
            </Span>
            <Div px="2r">
              <Slider
                value={singleSliderVal}
                onChange={setSingleSliderVal}
                min={0}
                max={100}
                step={1}
              >
                <Slider.Track>
                  <Slider.Range />
                  <Slider.Thumb aria-label="Volume" />
                </Slider.Track>
              </Slider>
            </Div>
          </Div>
          <Div display="flex" flexDirection="column" gap="1.5r">
            <Span fontSize="3r" color="design.text.light">
              Range Thumbs ({Array.isArray(sliderVal) ? `${sliderVal[0]}% – ${sliderVal[1]}%` : `${sliderVal}%`})
            </Span>
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
                  <Slider.Thumb index={0} aria-label="Minimum" />
                  <Slider.Thumb index={1} aria-label="Maximum" />
                </Slider.Track>
              </Slider>
            </Div>
          </Div>
        </DemoCell>
      </Div>
    </SectionCard>
  )
}

function FloatingUIRow({
  isOverlayOpen,
  setIsOverlayOpen,
}: {
  isOverlayOpen: boolean
  setIsOverlayOpen: (v: boolean) => void
}) {
  return (
    <SectionCard
      title="Floating UI & Feedback"
      description="Tooltips, popovers, menus, modal dialogs, and toasts rendered in floating layers."
    >
      <Div display="grid" gap="4r" gridTemplateColumns="repeat(auto-fit, minmax(60r, 1fr))">
        <DemoCell label="Tooltip & Popover">
          <Div display="flex" gap="3r" flexWrap="wrap" alignItems="center">
            <Tooltip>
              <Tooltip.Trigger>
                <Button variant="primary">
                  Hover for Tooltip
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content placement="top">
                Fast, responsive tooltip
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip>

            <Popover>
              <Popover.Trigger variant="primary">
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
                  <Popover.Close alignSelf="flex-start">
                    Close
                  </Popover.Close>
                </Div>
                <Popover.Arrow />
              </Popover.Content>
            </Popover>
          </Div>
        </DemoCell>

        <DemoCell label="Menu">
          <Menu>
            <Menu.Trigger
              variant="primary"
              alignSelf="flex-start"
            >
              <span>Actions Menu</span>
              <KeyboardArrowDownIcon />
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onClick={() => toast.show('Profile clicked')}>Profile</Menu.Item>
              <Menu.Item onClick={() => toast.show('Settings clicked')}>Settings</Menu.Item>
              <Menu.Separator />
              <Menu.Item disabled>Disabled Action</Menu.Item>
            </Menu.Content>
          </Menu>
        </DemoCell>

        <DemoCell label="Modal Overlay (Dialog)">
          <Button
            variant="primary"
            alignSelf="flex-start"
            onClick={() => setIsOverlayOpen(true)}
          >
            Open Modal Dialog
          </Button>

          <Overlay open={isOverlayOpen} onOpenChange={setIsOverlayOpen}>
            <Overlay.Backdrop bg="rgba(0,0,0,0.4)" />
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
            >
              <H3 fontSize="4.5r" fontWeight="600" m="0">Modal Dialog</H3>
              <P fontSize="3r" color="design.text.light" mt="2r">
                Modal dialog overlay with backdrop and focus trap.
              </P>
              <Div display="flex" justifyContent="flex-end" gap="2r" mt="4r">
                <Button
                  onClick={() => setIsOverlayOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsOverlayOpen(false)}
                >
                  Confirm
                </Button>
              </Div>
            </Overlay.Content>
          </Overlay>
        </DemoCell>

        <DemoCell label="Toast Notifications">
          <Div display="flex" gap="2r" flexWrap="wrap">
            <Button
              variant="primary"
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
        </DemoCell>
      </Div>
    </SectionCard>
  )
}

function DisclosureRow() {
  return (
    <SectionCard
      title="Disclosure & Tabs"
      description="Collapsibles, accordions, and tabs for progressively revealing content."
    >
      <Div display="grid" gap="4r" gridTemplateColumns="repeat(auto-fit, minmax(70r, 1fr))">
        <DemoCell label="Collapsible & Accordion">
          <Collapsible defaultOpen>
            <Collapsible.Trigger {...disclosureTrigger}>
              Toggle Collapsible Section
            </Collapsible.Trigger>
            <Collapsible.Content {...dividerContent}>
              <Span fontSize="3.5r" color="design.text.light">
                Collapsible content revealed smoothly using Reference primitives.
              </Span>
            </Collapsible.Content>
          </Collapsible>

          <Accordion expansion="single" defaultValue="item-1" display="flex" flexDirection="column">
            <Collapsible id="item-1">
              <Collapsible.Trigger {...disclosureTrigger}>
                Accordion Item 1
              </Collapsible.Trigger>
              <Collapsible.Content {...dividerContent}>
                <Span fontSize="3.5r" color="design.text.light">Content inside Accordion item 1.</Span>
              </Collapsible.Content>
            </Collapsible>
            <Collapsible id="item-2">
              <Collapsible.Trigger {...disclosureTrigger}>
                Accordion Item 2
              </Collapsible.Trigger>
              <Collapsible.Content {...dividerContent}>
                <Span fontSize="3.5r" color="design.text.light">Content inside Accordion item 2.</Span>
              </Collapsible.Content>
            </Collapsible>
          </Accordion>
        </DemoCell>

        <DemoCell label="Tabs">
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
        </DemoCell>
      </Div>
    </SectionCard>
  )
}

function SelectionRow({
  comboboxVal,
  setComboboxVal,
  listboxVal,
  setListboxVal,
  dateVal,
  setDateVal,
}: {
  comboboxVal: string | null
  setComboboxVal: (v: string | null) => void
  listboxVal: any
  setListboxVal: (v: any) => void
  dateVal: string | null
  setDateVal: (v: string | null) => void
}) {
  return (
    <SectionCard
      title="Selection & Pickers"
      description="Comboboxes, listboxes, and date pickers for choosing from a set of options."
    >
      <Div display="grid" gap="4r" gridTemplateColumns="repeat(auto-fit, minmax(70r, 1fr))">
        <DemoCell label="Combobox & Listbox">
          <Combobox value={comboboxVal} onChange={setComboboxVal}>
            <Field>
              <Combobox.Input placeholder="Select framework..." />
              <Button
                type="button"
                aria-label="Open suggestions"
                width="8.5r"
                height="8.5r"
                minWidth="8.5r"
                p="0"
                bg="transparent"
                border="none"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                color="design.text.base"
                _hover={{ bg: 'ui.button.mutedBackground' }}
              >
                <KeyboardArrowDownIcon width="4r" height="4r" />
              </Button>
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
        </DemoCell>

        <DemoCell label="DateField & Calendar">
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
        </DemoCell>
      </Div>
    </SectionCard>
  )
}

function DataLayoutRow() {
  return (
    <SectionCard
      title="Data & Layout"
      description="Tree views and resizable splitter panels for structured content."
    >
      <Div display="grid" gap="4r" gridTemplateColumns="repeat(auto-fit, minmax(70r, 1fr))">
        <DemoCell label="Tree View">
          <Tree
            defaultValue="file-1"
            defaultExpanded={['folder-1']}
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="md"
            p="2r"
          >
            <Tree.Item id="folder-1" isBranch>
              <Tree.Expander itemId="folder-1" />
              <Span fontSize="3r" fontWeight="600">📁 components/</Span>
              <Tree.Group>
                <Tree.Item id="file-1">
                  <Span fontSize="3r">📄 Button.tsx</Span>
                </Tree.Item>
                <Tree.Item id="file-2">
                  <Span fontSize="3r">📄 Switch.tsx</Span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
            <Tree.Item id="file-3">
              <Span fontSize="3r">📄 package.json</Span>
            </Tree.Item>
          </Tree>
        </DemoCell>

        <DemoCell label="Splitter">
          <Div height="30r" border="1px solid" borderColor="ui.field.border" borderRadius="md" overflow="hidden">
            <Splitter defaultValue={[40, 60]} height="100%">
              <Splitter.Panel index={0} p="3r" bg="ui.table.row.mutedBackground" color="design.text.base">
                <Span fontSize="3r" fontWeight="500">Panel 1 (Resizable)</Span>
              </Splitter.Panel>
              <Splitter.Handle index={0} />
              <Splitter.Panel index={1} p="3r" bg="ui.field.background" color="design.text.base">
                <Span fontSize="3r" fontWeight="500">Panel 2 (Resizable)</Span>
              </Splitter.Panel>
            </Splitter>
          </Div>
        </DemoCell>
      </Div>
    </SectionCard>
  )
}

export default function ShowcaseFixture() {
  const [switchChecked, setSwitchChecked] = React.useState(true)
  const [singleSliderVal, setSingleSliderVal] = React.useState(40)
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
          Interactive Book showcasing all Reference UI components built with JSX primitives & tokens.
        </P>
      </Div>

      {/* Full-width rows of grouped components */}
      <FormInputsRow
        switchChecked={switchChecked}
        setSwitchChecked={setSwitchChecked}
        numberVal={numberVal}
        setNumberVal={setNumberVal}
        singleSliderVal={singleSliderVal}
        setSingleSliderVal={setSingleSliderVal}
        sliderVal={sliderVal}
        setSliderVal={setSliderVal}
      />
      <FloatingUIRow isOverlayOpen={isOverlayOpen} setIsOverlayOpen={setIsOverlayOpen} />
      <DisclosureRow />
      <SelectionRow
        comboboxVal={comboboxVal}
        setComboboxVal={setComboboxVal}
        listboxVal={listboxVal}
        setListboxVal={setListboxVal}
        dateVal={dateVal}
        setDateVal={setDateVal}
      />
      <DataLayoutRow />
    </Div>
  )
}
