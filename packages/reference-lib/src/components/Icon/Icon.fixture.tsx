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
          title="Buttons with Icons (Automated Optical Default)"
          subtitle="Buttons at 34px controlHeight with leading icons, trailing chevrons, and standalone icon buttons. Zero custom padding needed."
        >
          <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
            {/* Primary button with leading icon */}
            <Button>
              <AddIcon />
              <span>Create Record</span>
            </Button>

            {/* Dropdown button with trailing chevron */}
            <Button
              bg="ui.table.row.mutedBackground"
              color="design.text.base"
              border="1px solid"
              borderColor="ui.field.border"
            >
              <span>Actions</span>
              <KeyboardArrowDownIcon />
            </Button>

            {/* Standalone ghost icon buttons (automatically square!) */}
            <Div display="flex" alignItems="center" gap="1.5r">
              <Button
                type="button"
                aria-label="Settings"
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

        {/* 5. Under the Hood: 2px SVG Internal Padding Breakdown */}
        <SectionCard
          title="Under the Hood: Material Symbols 2px Padding"
          subtitle="Material Symbols SVGs use a 24×24 viewBox with a 20×20 live area, creating a built-in 2px inset"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', alignItems: 'center' }}>
            <Div display="flex" alignItems="center" gap="4r">
              {/* Scaled 4x for visualization */}
              <Div
                position="relative"
                width="80px"
                height="80px"
                border="2px dashed rgba(239, 68, 68, 0.6)"
                bg="rgba(239, 68, 68, 0.05)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {/* 2px padding ring visualization (8px at 4x) */}
                <Div
                  position="absolute"
                  inset="8px"
                  border="1px dashed rgba(34, 197, 94, 0.6)"
                  bg="rgba(34, 197, 94, 0.05)"
                />
                <AddIcon style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }} />
              </Div>

              <Div display="flex" flexDirection="column" gap="1r">
                <Span fontSize="2.5r" color="red.400">■ Red dashed = 24×24 SVG Bounding Box</Span>
                <Span fontSize="2.5r" color="green.400">■ Green dashed = 20×20 Live Artwork Area</Span>
                <Span fontSize="2.5r" color="design.text.light">2px built-in whitespace on all 4 sides</Span>
              </Div>
            </Div>

            <Div display="flex" flexDirection="column" gap="1.5r" fontSize="3r" color="design.text.light">
              <P m="0">
                <strong>Why it exists:</strong> Google designed it so that circular, square, and tall glyphs have the same optical weight without clipping.
              </P>
              <P m="0">
                <strong>The consequence:</strong> In buttons, a 16px left padding plus the 2px internal padding means the visible glyph sits <strong>~18px</strong> from the edge, while the gap to text is only <strong>~8px</strong>.
              </P>
              <P m="0">
                <strong>The clean fix:</strong> A <code>marginInlineStart: -1r</code> on the outer edge of the leading icon naturally absorbs the 2px internal inset, and <code>aspectRatio: 1</code> auto-squares icon buttons without needing any custom CSS variables or hardcoded dimensions.
              </P>
            </Div>
          </div>
        </SectionCard>
      </Div>
    )
  },

  ButtonHeightScale: () => {
    const scales = [
      {
        name: 'Compact / Dense',
        height: '6r',
        px: '24px',
        customPx: '2.5r',
        fontSize: '3r',
        iconSize: 'small' as const,
        description: 'Tight data tables, toolbars, sub-actions. Uses custom px="2.5r" (10px).',
      },
      {
        name: 'Standard Control (Default)',
        height: '8.5r',
        px: '34px',
        customPx: undefined,
        fontSize: '3.5r',
        iconSize: 'base' as const,
        description: 'Default controlHeight across all Reference UI inputs and buttons. Inherits default 3.5r (14px) padding.',
      },
      {
        name: 'Large / Touch',
        height: '10.5r',
        px: '42px',
        customPx: '4r',
        fontSize: '4r',
        iconSize: 'large' as const,
        description: 'Apple HIG touch target, prominent forms, mobile cards. Uses custom px="4r" (16px).',
      },
      {
        name: 'Hero / Marketing',
        height: '13r',
        px: '52px',
        customPx: '5r',
        fontSize: '4.5r',
        iconSize: 'large' as const,
        description: 'Landing page CTAs, hero sections, modal primaries. Uses custom px="5r" (20px).',
      },
    ]

    return (
      <Div maxW="240r" mx="auto" p="6r" display="flex" flexDirection="column" gap="6r">
        <Div>
          <H3 fontSize="5r" fontWeight="700" m="0" color="design.text.base">
            Button Optical Behavior Across Varying Heights
          </H3>
          <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
            Testing <code>aspect-ratio: 1</code> auto-squaring and <code>margin-inline: -1r</code> optical insets across compact (24px), standard (34px), touch (42px), and hero (52px) buttons.
          </P>
        </Div>

        {scales.map(scale => (
          <SectionCard
            key={scale.height}
            title={`${scale.name} — ${scale.height} (${scale.px})`}
            subtitle={scale.description}
          >
            <Div display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="4r">
              {/* 1. Text Only */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Text Only</Span>
                <Button height={scale.height} fontSize={scale.fontSize} px={scale.customPx}>
                  <span>Continue</span>
                </Button>
              </Div>

              {/* 2. Leading Icon */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Leading Icon</Span>
                <Button height={scale.height} fontSize={scale.fontSize} px={scale.customPx}>
                  <AddIcon size={scale.iconSize} />
                  <span>Create Item</span>
                </Button>
              </Div>

              {/* 3. Trailing Chevron */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Trailing Chevron</Span>
                <Button
                  height={scale.height}
                  fontSize={scale.fontSize}
                  px={scale.customPx}
                  bg="ui.table.row.mutedBackground"
                  color="design.text.base"
                  border="1px solid"
                  borderColor="ui.field.border"
                >
                  <span>Options</span>
                  <KeyboardArrowDownIcon size={scale.iconSize} />
                </Button>
              </Div>

              {/* 4. Standalone Icon-Only (Proving auto-square aspect-ratio: 1) */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Icon-Only (aspect-ratio: 1)</Span>
                <Div display="flex" alignItems="center" gap="1.5r">
                  <Button
                    type="button"
                    aria-label="Settings"
                    height={scale.height}
                    bg="ui.table.row.mutedBackground"
                    color="design.text.base"
                    border="1px solid"
                    borderColor="ui.field.border"
                  >
                    <SettingsIcon size={scale.iconSize} />
                  </Button>
                  <Button
                    type="button"
                    aria-label="Close"
                    height={scale.height}
                    bg="ui.table.row.mutedBackground"
                    color="design.text.base"
                    border="1px solid"
                    borderColor="ui.field.border"
                  >
                    <CloseIcon size={scale.iconSize} />
                  </Button>
                </Div>
              </Div>

              {/* 5. Geometry Check Badge */}
              <Div
                px="3r"
                py="1.5r"
                borderRadius="sm"
                bg="ui.panel.background"
                border="1px dashed"
                borderColor="ui.field.border"
                display="flex"
                flexDirection="column"
                gap="0.5r"
                fontSize="2.5r"
              >
                <Span color="design.text.light">Height: <strong>{scale.px}</strong></Span>
                <Span color="green.400">Square: <strong>{scale.px} × {scale.px}</strong></Span>
              </Div>
            </Div>
          </SectionCard>
        ))}
      </Div>
    )
  },
}

