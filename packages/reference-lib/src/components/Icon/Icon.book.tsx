import * as React from 'react'
import { Div, Span, Button, Input, P, H3, H4 } from '@reference-ui/react'
import * as AllIcons from '@reference-ui/icons'
import {
  SearchIcon,
  KeyboardArrowDownIcon,
  CheckIcon,
  AddIcon,
  CloseIcon,
  SettingsIcon,
  CalendarTodayIcon,
  FilterListIcon,
  DeleteIcon,
  EditIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  MenuIcon,
  NotificationsIcon,
  FavoriteIcon,
  ShareIcon,
  VisibilityIcon,
  DownloadIcon,
  RefreshIcon,
  HomeIcon,
  PersonIcon,
  LockIcon,
  MailIcon,
} from '@reference-ui/icons'
import { DateField } from '../DateField'
import { Combobox } from '../Combobox'
import { Field } from '../Field'
import { Listbox } from '../Listbox'
import { controlHeight, iconSizes, defaultIconSize } from '../../core/theme/primitives/shared'

const ALL_ICONS_LIST = (
  Object.entries(AllIcons).filter(
    ([k, v]) => k.endsWith('Icon') && (typeof v === 'object' || typeof v === 'function') && v !== null
  ) as [string, React.ComponentType<{ size?: string | number; color?: string; style?: React.CSSProperties }>][]
).sort(([a], [b]) => a.localeCompare(b))

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
        paddingPx: '10px',
        fontSize: '3r',
        iconSize: 'small' as const,
        description: 'Tight data tables, toolbars, sub-actions. Uses custom px="2.5r" (10px).',
      },
      {
        name: 'Standard Control (Default)',
        height: '8.5r',
        px: '34px',
        customPx: undefined,
        paddingPx: '14px',
        fontSize: '3.5r',
        iconSize: 'base' as const,
        description: 'Default controlHeight across all Reference UI inputs and buttons. Inherits default 3.5r (14px) padding.',
      },
      {
        name: 'Large / Touch',
        height: '10.5r',
        px: '42px',
        customPx: '4r',
        paddingPx: '16px',
        fontSize: '4r',
        iconSize: 'large' as const,
        description: 'Apple HIG touch target, prominent forms, mobile cards. Uses custom px="4r" (16px).',
      },
      {
        name: 'Hero / Marketing',
        height: '13r',
        px: '52px',
        customPx: '5r',
        paddingPx: '20px',
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

        {/* Core Mathematical Law Summary Card */}
        <SectionCard
          title="Automated Optical System: Proportional Gap & Dynamic Insets"
          subtitle="How Reference UI calculates button icon alignment across all sizes with zero developer configuration"
        >
          <Div display="flex" flexDirection="column" gap="2r" fontSize="3r" color="design.text.light">
            <Span>
              1. <strong>Proportional Typography Gap (<code>gap: 0.5em</code>)</strong>: Spacing scales naturally with typography across every button height (6px at 12px text → 7px at 14px text → 9px at 18px text).
            </Span>
            <Span>
              2. <strong>Perimeter Clearance Guarantee (<code>margin-inline: -0.25em</code>)</strong>: Insets absorb internal SVG whitespace (~2–4px) while ensuring horizontal perimeter clearance always exceeds vertical clearance (H &gt; V).
            </Span>
            <Span>
              3. <strong>Auto-Squaring (<code>aspect-ratio: 1 / 1</code>)</strong>: Icon-only buttons drop horizontal padding and automatically lock to a perfect square at whatever height the button has.
            </Span>
            <Span>
              4. <strong>Universal Compatibility</strong>: Automatically matches both <code>[data-slot="icon"]</code> components and raw third-party <code>&lt;svg&gt;</code> elements with zero configuration.
            </Span>
            <Span>
              5. <strong>Zero-Specificity Escapes</strong>: Defaults use CSS variables (<code>var(--reference-icon-offset)</code>) so consumer props always win cleanly.
            </Span>
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
                <Button height={scale.height} style={{ height: scale.px, paddingInline: scale.paddingPx }} fontSize={scale.fontSize} px={scale.customPx}>
                  <span>Continue</span>
                </Button>
              </Div>

              {/* 2. Leading Icon */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Leading Icon</Span>
                <Button height={scale.height} style={{ height: scale.px, paddingInline: scale.paddingPx }} fontSize={scale.fontSize} px={scale.customPx}>
                  <AddIcon size={scale.iconSize} />
                  <span>Create Item</span>
                </Button>
              </Div>

              {/* 3. Trailing Chevron */}
              <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
                <Span fontSize="2.5r" color="design.text.light">Trailing Chevron</Span>
                <Button
                  height={scale.height}
                  style={{ height: scale.px, paddingInline: scale.paddingPx }}
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
                    style={{ height: scale.px }}
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
                    style={{ height: scale.px }}
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
              <Span>2. Leading icon: Detected <code>:first-child</code> → applied <code>margin-inline-start: calc(-1.4em + 14px)</code> (-11.2px optical pull at 18px font)</Span>
              <Span>3. Trailing chevron: Detected <code>:last-child</code> → applied <code>margin-inline-end: calc(-1.4em + 14px)</code> (-11.2px optical pull at 18px font)</Span>
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

        {/* Arbitrary Icon Sizing: "Make the icon bigger" */}
        <SectionCard
          title="Arbitrary Icon Scaling: 'Make the Icon Bigger'"
          subtitle="A user or designer asks to make the icon smaller (16px), default (20px), large (24px), or prominent (28px). Because layout uses proportional typography gap and -0.25em inset, it stays optically centered and balanced automatically."
        >
          <Div display="flex" gap="4r" alignItems="flex-start" flexWrap="wrap">
            {/* 1. small (16px) */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">small (16px)</Span>
              <Button>
                <AddIcon size="small" />
                <span>Create Item</span>
              </Button>
            </Div>

            {/* 2. base (20px - default) */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">base (20px - default)</Span>
              <Button>
                <AddIcon size="base" />
                <span>Create Item</span>
              </Button>
            </Div>

            {/* 3. large (24px - bigger) */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">large (24px - bigger)</Span>
              <Button>
                <AddIcon size="large" />
                <span>Create Item</span>
              </Button>
            </Div>

            {/* 4. custom 28px */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">custom (28px - prominent)</Span>
              <Button>
                <AddIcon size={28} />
                <span>Create Item</span>
              </Button>
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

  Batch: () => {
    const [batch, setBatch] = React.useState(0)
    const [pageInput, setPageInput] = React.useState('')
    const [copiedName, setCopiedName] = React.useState<string | null>(null)
    const copyTimeoutRef = React.useRef<any>(null)

    const handleCopy = (name: string) => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(name).catch(() => {})
      }
      setCopiedName(name)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopiedName(null), 1500)
    }

    React.useEffect(() => {
      const setter = (b: any) => {
        const num = typeof b === 'number' ? b : parseInt(String(b), 10)
        if (!isNaN(num)) setBatch(num)
      }
      ;(window as any).setBatch = setter
      try {
        if (window.parent && window.parent !== window) {
          ;(window.parent as any).setBatch = setter
        }
      } catch {}
      const urlParams = new URLSearchParams(window.location.search)
      const b = urlParams.get('batch')
      if (b && !isNaN(parseInt(b, 10))) setBatch(parseInt(b, 10))
    }, [])

    const pageSize = 20
    const total = ALL_ICONS_LIST.length
    const totalBatches = Math.ceil(total / pageSize)
    const current = Math.max(0, Math.min(batch, totalBatches - 1))
    const start = current * pageSize
    const end = Math.min(start + pageSize, total)
    const items = ALL_ICONS_LIST.slice(start, end)

    return (
      <Div maxW="300r" w="100%" mx="auto" p="3r" display="flex" flexDirection="column" gap="4r">
        {/* Header & Batch Navigation */}
        <Div display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="4r">
          <Div>
            <H3 fontSize="5r" fontWeight="700" m="0" color="design.text.base">
              Icon Contact Sheet (Batch #{current + 1} of {totalBatches})
            </H3>
            <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
              Icons #{start + 1} – #{end} of {total.toLocaleString()} • 20 icons per atomized sheet
            </P>
          </Div>

          <Div display="flex" gap="2r" alignItems="center">
            <Button
              type="button"
              disabled={current <= 0}
              onClick={() => setBatch(current - 1)}
            >
              ← Previous (20)
            </Button>

            <Div display="flex" alignItems="center" gap="1r">
              <Input
                type="number"
                min={1}
                max={totalBatches}
                placeholder={String(current + 1)}
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(pageInput, 10)
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalBatches) {
                      setBatch(parsed - 1)
                      setPageInput('')
                    }
                  }
                }}
                width="16r"
                textAlign="center"
              />
              <Span fontSize="3r" color="design.text.light">
                / {totalBatches}
              </Span>
            </Div>

            <Button
              type="button"
              disabled={current >= totalBatches - 1}
              onClick={() => setBatch(current + 1)}
            >
              Next (20) →
            </Button>
          </Div>
        </Div>

        {/* 4x5 Contact Sheet Grid (Seamless, no outer overflow box or border wrapping) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
          }}
        >
          {items.map(([name, Comp], idx) => {
            const globalIdx = start + idx + 1
            const isCopied = copiedName === name
            const IconComp = Comp as React.ComponentType<{ size?: string | number; color?: string }>
            const nameFontSize =
              name.length > 28 ? '12px' : name.length > 22 ? '13px' : '14px'

            return (
              <div
                key={name}
                onClick={() => handleCopy(name)}
                title={`#${globalIdx}: ${name} (Click to copy)`}
                style={{
                  position: 'relative',
                  padding: '16px 8px 14px',
                  borderRadius: '10px',
                  border: isCopied
                    ? '1px solid var(--colors-ui-focus-ring, #3b82f6)'
                    : '1px solid var(--colors-ui-field-border, rgba(255,255,255,0.08))',
                  backgroundColor: isCopied
                    ? 'rgba(59,130,246,0.12)'
                    : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  minHeight: '156px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                {/* Index tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '10px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--colors-design-text-light, #888)',
                    lineHeight: 1,
                  }}
                >
                  #{String(globalIdx).padStart(4, '0')}
                </div>

                {/* Icon Glyph (pure glyph, prominent, no background box) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '88px',
                    width: '100%',
                    marginTop: '4px',
                  }}
                >
                  <IconComp size={80} color="design.text.base" />
                </div>

                {/* Exact Reference UI Component Name (single line, no description) */}
                <span
                  style={{
                    fontSize: nameFontSize,
                    fontWeight: 600,
                    color: isCopied ? 'var(--colors-primary, #3b82f6)' : 'var(--colors-design-text-base, #fff)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'center',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {isCopied ? 'Copied!' : name}
                </span>
              </div>
            )
          })}
        </div>
      </Div>
    )
  },
}


