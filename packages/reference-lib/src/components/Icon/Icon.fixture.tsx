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
            Testing <code>aspect-ratio: 1</code> auto-squaring and optical spacing across compact (24px), standard (34px), touch (42px), and hero (52px) buttons.
          </P>
        </Div>

        {/* Diagnostic Spacing Lab */}
        {/* Diagnostic Spacing Lab */}
        <SectionCard
          title="Diagnostic Spacing Comparison: Why the Leading Icon Looked Weird"
          subtitle="Mathematical & optical breakdown of how leading icon placement behaves across heights"
        >
          <Div display="flex" flexDirection="column" gap="4r">
            {/* Treatment 1 */}
            <Div
              p="4r"
              borderRadius="sm"
              bg="rgba(239, 68, 68, 0.04)"
              border="1px solid rgba(239, 68, 68, 0.25)"
              display="flex"
              flexDirection="column"
              gap="2r"
            >
              <Div display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="2r">
                <Span fontSize="3r" fontWeight="700" color="red.400">
                  Treatment 1: Flawed (Static -4px pull + static 6px gap)
                </Span>
                <Span fontSize="2.5r" color="design.text.light">
                  Flaw: Gap stays 6px while button grows to 52px; 4px pull drags icon away from center.
                </Span>
              </Div>
              <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap" mt="1r">
                <Button height="6r" px="2.5r" fontSize="3r" gap="1.5r" style={{ ['--reference-icon-offset' as any]: '-1r' }}>
                  <AddIcon size="small" />
                  <span>24px Compact</span>
                </Button>
                <Button height="8.5r" fontSize="3.5r" gap="1.5r" style={{ ['--reference-icon-offset' as any]: '-1r' }}>
                  <AddIcon />
                  <span>34px Standard</span>
                </Button>
                <Button height="10.5r" px="4r" fontSize="4r" gap="1.5r" style={{ ['--reference-icon-offset' as any]: '-1r' }}>
                  <AddIcon />
                  <span>42px Touch</span>
                </Button>
                <Button height="13r" px="5r" fontSize="4.5r" gap="1.5r" style={{ ['--reference-icon-offset' as any]: '-1r' }}>
                  <AddIcon size="large" />
                  <span>52px Hero CTA</span>
                </Button>
              </Div>
            </Div>

        {/* Optical Spacing Lab: Edge vs Text Consistency */}
        <SectionCard
          title="Optical Spacing Lab: Leading Icon Edge vs. Text Distance"
          subtitle="Addressing the user feedback: 'The icon isn't really consistently spaced between the edge and the text (A: Edge to Icon vs. B: Icon to Text)'"
        >
          <Div display="flex" flexDirection="column" gap="4r">
            <Div
              p="3r"
              borderRadius="sm"
              bg="ui.panel.background"
              border="1px solid"
              borderColor="ui.field.border"
              fontSize="2.75r"
              color="design.text.light"
            >
              <P m="0">
                In the 48px button, <code>px="5r"</code> (20px) gives <strong>26px from edge to glyph</strong> (due to 5px SVG whitespace), but only <strong>14px between glyph and text</strong>. Below are 4 visual treatments:
              </P>
            </Div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Option A: Current (26px vs 14px) */}
              <Div p="3r" borderRadius="sm" border="1px solid" borderColor="ui.field.border" bg="ui.table.row.mutedBackground" display="flex" flexDirection="column" alignItems="flex-start" gap="2r">
                <Span fontSize="2.5r" fontWeight="700" color="red.400">A. As-Is (No pull)</Span>
                <Span fontSize="2.25r" color="design.text.light">Edge-to-glyph: <strong>26px</strong> | Glyph-to-text: <strong>14px</strong></Span>
                <Button height="12r" px="5r" fontSize="4.5r" style={{ ['--reference-icon-offset' as any]: '0px' }}>
                  <AddIcon size="large" />
                  <span>Create Project</span>
                </Button>
              </Div>

              {/* Option B: Gentle -4px Pull */}
              <Div p="3r" borderRadius="sm" border="1px solid" borderColor="ui.field.border" bg="ui.table.row.mutedBackground" display="flex" flexDirection="column" alignItems="flex-start" gap="2r">
                <Span fontSize="2.5r" fontWeight="700" color="yellow.400">B. -4px Pull (-1r)</Span>
                <Span fontSize="2.25r" color="design.text.light">Edge-to-glyph: <strong>22px</strong> | Glyph-to-text: <strong>14px</strong></Span>
                <Button height="12r" px="5r" fontSize="4.5r" style={{ ['--reference-icon-offset' as any]: '-4px' }}>
                  <AddIcon size="large" />
                  <span>Create Project</span>
                </Button>
              </Div>

              {/* Option C: Balanced -8px Pull */}
              <Div p="3r" borderRadius="sm" border="1px solid" borderColor="ui.field.border" bg="ui.table.row.mutedBackground" display="flex" flexDirection="column" alignItems="flex-start" gap="2r">
                <Span fontSize="2.5r" fontWeight="700" color="green.400">C. -8px Pull (-2r)</Span>
                <Span fontSize="2.25r" color="design.text.light">Edge-to-glyph: <strong>18px</strong> | Glyph-to-text: <strong>14px</strong></Span>
                <Button height="12r" px="5r" fontSize="4.5r" style={{ ['--reference-icon-offset' as any]: '-8px' }}>
                  <AddIcon size="large" />
                  <span>Create Project</span>
                </Button>
              </Div>

              {/* Option D: Exact Equal Spacing (14px = 14px) */}
              <Div p="3r" borderRadius="sm" border="1px solid" borderColor="ui.field.border" bg="ui.table.row.mutedBackground" display="flex" flexDirection="column" alignItems="flex-start" gap="2r">
                <Span fontSize="2.5r" fontWeight="700" color="blue.400">D. Equal Spacing (14px = 14px)</Span>
                <Span fontSize="2.25r" color="design.text.light">Edge-to-glyph: <strong>14px</strong> | Glyph-to-text: <strong>14px</strong></Span>
                <Button height="12r" px="5r" fontSize="4.5r" style={{ ['--reference-icon-offset' as any]: '-12px' }}>
                  <AddIcon size="large" />
                  <span>Create Project</span>
                </Button>
              </Div>
            </div>
          </Div>
        </SectionCard>

            {/* Treatment 3 */}
            <Div
              p="4r"
              borderRadius="sm"
              bg="rgba(59, 130, 246, 0.04)"
              border="1px solid rgba(59, 130, 246, 0.25)"
              display="flex"
              flexDirection="column"
              gap="2r"
            >
              <Div display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="2r">
                <Span fontSize="3r" fontWeight="700" color="blue.400">
                  Treatment 3: Pure Natural Flex (0px pull + Proportional Gap 0.5em)
                </Span>
                <Span fontSize="2.5r" color="design.text.light">
                  Zero negative margin hack. Relies entirely on natural button padding and proportional gap.
                </Span>
              </Div>
              <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap" mt="1r">
                <Button height="6r" px="2.5r" fontSize="3r" gap="0.5em" style={{ ['--reference-icon-offset' as any]: '0px' }}>
                  <AddIcon size="small" />
                  <span>24px Compact</span>
                </Button>
                <Button height="8.5r" fontSize="3.5r" gap="0.5em" style={{ ['--reference-icon-offset' as any]: '0px' }}>
                  <AddIcon />
                  <span>34px Standard</span>
                </Button>
                <Button height="10.5r" px="4r" fontSize="4r" gap="0.5em" style={{ ['--reference-icon-offset' as any]: '0px' }}>
                  <AddIcon />
                  <span>42px Touch</span>
                </Button>
                <Button height="13r" px="5r" fontSize="4.5r" gap="0.5em" style={{ ['--reference-icon-offset' as any]: '0px' }}>
                  <AddIcon size="large" />
                  <span>52px Hero CTA</span>
                </Button>
              </Div>
            </Div>
          </Div>
        </SectionCard>

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

        {/* Case Study: Custom button.xl (48px) with Arbitrary Icons */}
        <SectionCard
          title="Case Study: Custom 'button.xl' (48px) Handling Arbitrary Icons"
          subtitle="A developer only specifies height='12r', px='5r', fontSize='4.5r' (zero icon configuration). The engine calculates optical insets, auto-squaring, and alignment automatically."
        >
          <Div display="flex" flexDirection="column" gap="4r">
            {/* Code explanation box */}
            <Div
              p="3r"
              borderRadius="sm"
              bg="ui.panel.background"
              border="1px solid"
              borderColor="ui.field.border"
              display="flex"
              flexDirection="column"
              gap="1r"
              fontSize="2.75r"
              color="design.text.light"
            >
              <Span color="design.text.base" fontWeight="600">
                Developer Input (Zero icon props):
              </Span>
              <code>{`<Button height="12r" px="5r" fontSize="4.5r"> ... </Button>`}</code>
              <Span color="green.400" mt="1r" fontWeight="600">
                Automated System Calculations:
              </Span>
              <Span>1. Icon-only buttons: Dropped padding, computed <code>aspect-ratio: 1</code> → <strong>48px × 48px square</strong></Span>
              <Span>2. Leading icon: Detected <code>:first-child</code> → applied <code>margin-inline-start: -0.5r</code> (2px optical SVG inset pull)</Span>
              <Span>3. Trailing chevron: Detected <code>:last-child</code> → applied <code>margin-inline-end: -0.5r</code> (2px optical SVG inset pull)</Span>
              <Span>4. Proportional typography gap: <code>gap: 0.5em</code> scales seamlessly with font size (9px gap at 18px text)</Span>
              <Span>5. Target compatibility: Matches both <code>[data-slot="icon"]</code> and raw <code>&lt;svg&gt;</code> elements</Span>
            </Div>

            {/* Live buttons grid */}
            <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
              {/* Reference icon */}
              <Div display="flex" flexDirection="column" gap="1r">
                <Span fontSize="2.5r" color="design.text.light">Reference Icon (@reference-ui/icons)</Span>
                <Button height="12r" px="5r" fontSize="4.5r">
                  <AddIcon size="large" />
                  <span>Create Project</span>
                </Button>
              </Div>

              {/* Raw third-party SVG */}
              <Div display="flex" flexDirection="column" gap="1r">
                <Span fontSize="2.5r" color="design.text.light">Raw Third-Party SVG (Lucide/Figma)</Span>
                <Button height="12r" px="5r" fontSize="4.5r">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Featured Action</span>
                </Button>
              </Div>

              {/* Trailing chevron */}
              <Div display="flex" flexDirection="column" gap="1r">
                <Span fontSize="2.5r" color="design.text.light">Trailing Chevron Menu</Span>
                <Button
                  height="12r"
                  px="5r"
                  fontSize="4.5r"
                  bg="ui.table.row.mutedBackground"
                  color="design.text.base"
                  border="1px solid"
                  borderColor="ui.field.border"
                >
                  <span>Account Settings</span>
                  <KeyboardArrowDownIcon size="large" />
                </Button>
              </Div>

              {/* Standalone 48x48 icon-only button */}
              <Div display="flex" flexDirection="column" gap="1r">
                <Span fontSize="2.5r" color="design.text.light">Icon-Only Square (48×48)</Span>
                <Div display="flex" alignItems="center" gap="2r">
                  <Button
                    type="button"
                    aria-label="Settings"
                    height="12r"
                    bg="ui.table.row.mutedBackground"
                    color="design.text.base"
                    border="1px solid"
                    borderColor="ui.field.border"
                  >
                    <SettingsIcon size="large" />
                  </Button>
                  <Button
                    type="button"
                    aria-label="Raw Star"
                    height="12r"
                    bg="ui.table.row.mutedBackground"
                    color="design.text.base"
                    border="1px solid"
                    borderColor="ui.field.border"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </Button>
                </Div>
              </Div>
            </Div>
          </Div>
        </SectionCard>

        {/* Overrides & Escape Hatches */}
        <SectionCard
          title="Overrides & Escape Hatches (Zero Specificity Proof)"
          subtitle="Because default optical and squaring rules use :where(), any user prop or style wins effortlessly without !important"
        >
          <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
            {/* 1. Rectangular icon-only override */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">1. Non-Square Icon Button (width="20r" aspectRatio="auto")</Span>
              <Button aspectRatio="auto" width="20r">
                <SearchIcon />
              </Button>
            </Div>

            {/* 2. Neutralize optical offset via CSS variable */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">2. Neutralized Offset (--reference-icon-offset: 0)</Span>
              <Button style={{ ['--reference-icon-offset' as any]: '0px' }}>
                <AddIcon />
                <span>Zero Optical Pull</span>
              </Button>
            </Div>

            {/* 3. Explicit Margin on Icon */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">3. Explicit Icon Margin (ml="3r")</Span>
              <Button>
                <AddIcon ml="3r" />
                <span>Pushed Icon</span>
              </Button>
            </Div>
          </Div>
        </SectionCard>
      </Div>
    )
  },
}

