import * as React from 'react'
import { Div, Span, Button, Input, P, H3, H4 } from '@reference-ui/react'
import {
  SearchIcon,
  KeyboardArrowDownIcon,
  CheckIcon,
  AddIcon,
  CloseIcon,
  SettingsIcon,
  CalendarTodayIcon,
  FilterListIcon,
} from '@reference-ui/icons'
import { DateField } from '../DateField'
import { Combobox } from '../Combobox'
import { Field } from '../Field'
import { Listbox } from '../Listbox'
import { controlHeight, iconSizes, defaultIconSize } from '../../core/theme/primitives/shared'

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Div
      p="5r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="lg"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      display="flex"
      flexDirection="column"
      gap="4r"
    >
      <Div>
        <H4 fontSize="3.5r" fontWeight="600" m="0" color="design.text.base">
          {title}
        </H4>
        {subtitle && (
          <P fontSize="3r" color="design.text.light" mt="0.5r" mb="0">
            {subtitle}
          </P>
        )}
      </Div>
      {children}
    </Div>
  )
}

export default {
  Overview: () => {
    return (
      <Div maxW="220r" mx="auto" p="6r" display="flex" flexDirection="column" gap="5r">
        {/* Header */}
        <Div>
          <H3 fontSize="5r" fontWeight="700" m="0" color="design.text.base">
            Icon Sizing & Control Integration
          </H3>
          <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
            Standard icon tokens packaged with Reference UI. Icons default to <strong>base (5r / 20px)</strong> to fit controls out of the box with zero props needed.
          </P>
        </Div>

        {/* 1. The 3 Icon Tokens */}
        <SectionCard
          title="The 3 Icon Sizing Tokens"
          subtitle="Simple, un-opinionated sizing scale mapped directly to the rhythm grid"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* small */}
            <Div
              p="3r"
              borderRadius="sm"
              border="1px solid"
              borderColor="ui.field.border"
              bg="ui.table.row.mutedBackground"
              display="flex"
              alignItems="center"
              gap="3r"
            >
              <SettingsIcon size="small" />
              <Div display="flex" flexDirection="column">
                <Span fontSize="3r" fontWeight="600">small ({iconSizes.small} / 16px)</Span>
                <Span fontSize="2.5r" color="design.text.light">Dense controls & inline copy</Span>
              </Div>
            </Div>

            {/* base (default) */}
            <Div
              p="3r"
              borderRadius="sm"
              border="1px solid"
              borderColor="ui.focus.ring"
              bg="ui.table.row.mutedBackground"
              display="flex"
              alignItems="center"
              gap="3r"
            >
              <SettingsIcon />
              <Div display="flex" flexDirection="column">
                <Span fontSize="3r" fontWeight="600">base ({defaultIconSize} / 20px) ★ Default</Span>
                <Span fontSize="2.5r" color="design.text.light">Fits 34px controls natively</Span>
              </Div>
            </Div>

            {/* large */}
            <Div
              p="3r"
              borderRadius="sm"
              border="1px solid"
              borderColor="ui.field.border"
              bg="ui.table.row.mutedBackground"
              display="flex"
              alignItems="center"
              gap="3r"
            >
              <SettingsIcon size="large" />
              <Div display="flex" flexDirection="column">
                <Span fontSize="3r" fontWeight="600">large ({iconSizes.large} / 24px)</Span>
                <Span fontSize="2.5r" color="design.text.light">Prominent UI & headings</Span>
              </Div>
            </Div>
          </div>
        </SectionCard>

        {/* 2. Form Inputs with Prefix & Suffix */}
        <SectionCard
          title="Icons in Form Inputs"
          subtitle="Height 8.5r (34px), text 3.5r (14px). Base 20px icons integrate seamlessly as prefixes and trigger buttons."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Input with prefix */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Search Input (Prefix Icon)
              </Span>
              <Div data-reference-field display="flex" alignItems="center">
                <SearchIcon color="{colors.design.text.light}" />
                <Input placeholder="Search records..." />
              </Div>
            </Div>

            {/* Input with prefix and suffix clear button */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Input with Prefix & Clear Button
              </Span>
              <Div data-reference-field display="flex" alignItems="center">
                <FilterListIcon color="{colors.design.text.light}" />
                <Input placeholder="Filter by keyword..." defaultValue="Active Filter" />
                <Button
                  type="button"
                  aria-label="Clear filter"
                  width="6r"
                  height="6r"
                  minWidth="6r"
                  marginInlineEnd="-2r"
                  borderRadius="sm"
                  p="0"
                  bg="transparent"
                  border="none"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  color="design.text.light"
                  _hover={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base' }}
                >
                  <CloseIcon size="small" />
                </Button>
              </Div>
            </Div>
          </div>
        </SectionCard>

        {/* 3. Controls with Accessory Triggers */}
        <SectionCard
          title="Controls with Accessory Trigger Buttons"
          subtitle="Pill triggers use 6r (24px) container height; default 5r (20px) icons leave exact 2px clearance"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* DateField FoldedPicker */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                DateField with FoldedPicker Trigger
              </Span>
              <DateField defaultValue="2026-09-05">
                <DateField.Picker />
              </DateField>
            </Div>

            {/* Combobox Trigger */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Combobox with Chevron Trigger
              </Span>
              <Combobox defaultValue="option-1">
                <Field width="100%">
                  <Combobox.Input placeholder="Select an option..." />
                  <Button
                    type="button"
                    aria-label="Open suggestions"
                    width="6r"
                    height="6r"
                    minWidth="6r"
                    marginInlineEnd="-2r"
                    borderRadius="sm"
                    p="0"
                    bg="transparent"
                    border="none"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    color="design.text.base"
                    _hover={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base' }}
                  >
                    <KeyboardArrowDownIcon />
                  </Button>
                </Field>
                <Combobox.Popover>
                  <Listbox>
                    <Listbox.Option value="option-1">Option 1</Listbox.Option>
                    <Listbox.Option value="option-2">Option 2</Listbox.Option>
                  </Listbox>
                </Combobox.Popover>
              </Combobox>
            </Div>
          </div>
        </SectionCard>

        {/* 4. Buttons with Icons */}
        <SectionCard
          title="Buttons with Icons"
          subtitle="Buttons at 34px controlHeight with leading icons, trailing chevrons, and standalone icon buttons"
        >
          <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
            {/* Primary button with leading icon */}
            <Button display="inline-flex" alignItems="center" gap="1.5r">
              <AddIcon />
              <span>Create Record</span>
            </Button>

            {/* Dropdown button with trailing chevron */}
            <Button
              display="inline-flex"
              alignItems="center"
              gap="1.5r"
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
              border="1px solid"
              borderColor="ui.field.border"
            >
              <span>Actions</span>
              <KeyboardArrowDownIcon />
            </Button>

            {/* Standalone ghost icon buttons */}
            <Div display="flex" alignItems="center" gap="1.5r">
              <Button
                type="button"
                aria-label="Settings"
                width={controlHeight}
                height={controlHeight}
                p="0"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="sm"
                bg="ui.table.row.mutedBackground"
                color="design.text.base"
                border="1px solid"
                borderColor="ui.field.border"
                cursor="pointer"
              >
                <SettingsIcon />
              </Button>

              <Button
                type="button"
                aria-label="Close"
                width={controlHeight}
                height={controlHeight}
                p="0"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="sm"
                bg="ui.table.row.mutedBackground"
                color="design.text.base"
                border="1px solid"
                borderColor="ui.field.border"
                cursor="pointer"
              >
                <CloseIcon />
              </Button>
            </Div>

            {/* Small Badge / Chip */}
            <Div
              display="inline-flex"
              alignItems="center"
              gap="1r"
              px="2.5r"
              py="1r"
              borderRadius="full"
              bg="ui.table.row.mutedBackground"
              border="1px solid"
              borderColor="ui.field.border"
              fontSize="3r"
              color="design.text.base"
            >
              <CheckIcon size="small" color="{colors.green.600}" />
              <span>Active Status</span>
            </Div>
          </Div>
        </SectionCard>
      </Div>
    )
  },
}
