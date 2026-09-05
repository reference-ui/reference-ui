import * as React from 'react'
import { Div, Span, Button, Input, P, H3, H4 } from '@reference-ui/react'
import {
  SearchIcon,
  KeyboardArrowDownIcon,
  CheckIcon,
  AddIcon,
  InfoIcon,
  SettingsIcon,
} from '@reference-ui/icons'
import { DateField } from '../DateField'
import { Combobox } from '../Combobox'
import { Field } from '../Field'
import { Listbox } from '../Listbox'
import { controlHeight, controlHeightPx } from '../../core/theme/primitives/shared'

// Font scale definitions
const FONT_SCALE = [
  { token: '3r', px: 12, label: 'Micro / Badge', optical: '3.5r', opticalPx: 14 },
  { token: '3.5r', px: 14, label: 'Control / Input (Default)', optical: '4r', opticalPx: 16 },
  { token: '4r', px: 16, label: 'Body Text (Default)', optical: '4.5r', opticalPx: 18 },
  { token: '4.5r', px: 18, label: 'Subhead / Quote', optical: '5r', opticalPx: 20 },
  { token: '5r', px: 20, label: 'Section Title (H3)', optical: '6r', opticalPx: 24 },
  { token: '6r', px: 24, label: 'Heading (H2)', optical: '7r', opticalPx: 28 },
  { token: '9r', px: 36, label: 'Page Title (H1)', optical: '10r', opticalPx: 40 },
]

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Div mb="4r">
      <H3 fontSize="4.5r" fontWeight="600" m="0" color="design.text.base">
        {title}
      </H3>
      {subtitle && (
        <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
          {subtitle}
        </P>
      )}
    </Div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
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
      {children}
    </Div>
  )
}

export default {
  ScaleMatrix: () => {
    const [showGuides, setShowGuides] = React.useState(true)

    return (
      <Div maxW="240r" mx="auto" p="6r" display="flex" flexDirection="column" gap="6r">
        <Div display="flex" justifyContent="space-between" alignItems="center">
          <SectionHeader
            title="Font Scale vs Icon Scale Matrix"
            subtitle="Comparing 1:1 geometric matching vs optical offset pairing vs standard 5r control size"
          />
          <Button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            fontSize="3r"
            height="6r"
            px="2.5r"
            bg="ui.table.row.mutedBackground"
            color="design.text.base"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
          >
            {showGuides ? 'Hide Guides' : 'Show Guides'}
          </Button>
        </Div>

        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 140px 1fr 1fr 1fr',
              gap: '12px',
              alignItems: 'center',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Span fontSize="2.5r" fontWeight="600" color="design.text.light">FONT</Span>
            <Span fontSize="2.5r" fontWeight="600" color="design.text.light">ROLE</Span>
            <Span fontSize="2.5r" fontWeight="600" color="design.text.light">1:1 MATCH</Span>
            <Span fontSize="2.5r" fontWeight="600" color="design.text.light">OPTICAL PAIRING</Span>
            <Span fontSize="2.5r" fontWeight="600" color="design.text.light">CONTROL ({controlHeight} / 34px)</Span>
          </div>

          {FONT_SCALE.map((item) => (
            <div
              key={item.token}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 140px 1fr 1fr 1fr',
                gap: '12px',
                alignItems: 'center',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Font info */}
              <Div display="flex" flexDirection="column">
                <Span fontSize="3.5r" fontWeight="600">{item.token}</Span>
                <Span fontSize="2.5r" color="design.text.light">{item.px}px</Span>
              </Div>

              {/* Usage */}
              <Span fontSize="3r" color="design.text.light">{item.label}</Span>

              {/* 1:1 match */}
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1.5r"
                p="1r"
                borderRadius="sm"
                bg={showGuides ? 'rgba(59, 130, 246, 0.08)' : 'transparent'}
                border={showGuides ? '1px dashed rgba(59, 130, 246, 0.4)' : '1px solid transparent'}
              >
                <SettingsIcon size={item.token as any} />
                <Span fontSize={item.token as any} lineHeight="1">Label</Span>
                <Span fontSize="2.5r" color="design.text.light" ml="auto">({item.token})</Span>
              </Div>

              {/* Optical match */}
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1.5r"
                p="1r"
                borderRadius="sm"
                bg={showGuides ? 'rgba(16, 185, 129, 0.08)' : 'transparent'}
                border={showGuides ? '1px dashed rgba(16, 185, 129, 0.4)' : '1px solid transparent'}
              >
                <SettingsIcon size={item.optical as any} />
                <Span fontSize={item.token as any} lineHeight="1">Label</Span>
                <Span fontSize="2.5r" color="design.text.light" ml="auto">({item.optical})</Span>
              </Div>

              {/* Fixed 5r icon in actual 34px controlHeight container */}
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1.5r"
                height={controlHeight}
                px="3r"
                borderRadius="sm"
                boxSizing="border-box"
                bg={showGuides ? 'rgba(245, 158, 11, 0.08)' : 'transparent'}
                border={showGuides ? '1px dashed rgba(245, 158, 11, 0.4)' : '1px solid transparent'}
              >
                <SettingsIcon />
                <Span fontSize={item.token as any} lineHeight="1">Label</Span>
                <Span fontSize="2.5r" color="design.text.light" ml="auto">(5r)</Span>
              </Div>
            </div>
          ))}
        </Card>
      </Div>
    )
  },

  ControlsAndInputs: () => {
    return (
      <Div maxW="240r" mx="auto" p="6r" display="flex" flexDirection="column" gap="6r">
        <SectionHeader
          title="Icons Inside Controls & Form Inputs"
          subtitle="Form control height is 8.5r (34px), input text is 3.5r (14px). Comparing prefix & suffix icon sizes."
        />

        {/* Input Prefix Icons Comparison */}
        <Card>
          <H4 fontSize="3.5r" fontWeight="600" m="0">Input Prefix Icon Comparison</H4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* 4r prefix */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Prefix: 4r (16px) — Optical match for 14px text
              </Span>
              <Div data-reference-field display="flex" alignItems="center">
                <SearchIcon size="4r" color="{colors.design.text.light}" />
                <Input placeholder="Search records..." />
              </Div>
            </Div>

            {/* 4.5r prefix */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Prefix: 4.5r (18px) — Balanced presence
              </Span>
              <Div data-reference-field display="flex" alignItems="center">
                <SearchIcon size="4.5r" color="{colors.design.text.light}" />
                <Input placeholder="Search records..." />
              </Div>
            </Div>

            {/* 5r prefix */}
            <Div display="flex" flexDirection="column" gap="1.5r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Prefix: 5r (20px) — Current default
              </Span>
              <Div data-reference-field display="flex" alignItems="center">
                <SearchIcon color="{colors.design.text.light}" />
                <Input placeholder="Search records..." />
              </Div>
            </Div>
          </div>
        </Card>

        {/* Real Production Components */}
        <Card>
          <H4 fontSize="3.5r" fontWeight="600" m="0">Real Components with Accessory Triggers</H4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <Div display="flex" flexDirection="column" gap="2r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                DateField with FoldedPicker (Default 5r icon in 6r trigger)
              </Span>
              <DateField defaultValue="2026-09-05">
                <DateField.Picker />
              </DateField>
            </Div>

            <Div display="flex" flexDirection="column" gap="2r">
              <Span fontSize="2.5r" fontWeight="500" color="design.text.light">
                Combobox with Chevron Trigger (Default 5r icon in 6r trigger)
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
                    _hover={{ bg: 'gray.800', color: 'ui.field.foreground' }}
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
        </Card>
      </Div>
    )
  },

  ButtonsAndInline: () => {
    return (
      <Div maxW="240r" mx="auto" p="6r" display="flex" flexDirection="column" gap="6r">
        <SectionHeader
          title="Icons in Buttons, Badges & Inline Text"
          subtitle="Testing optical balance when icons sit alongside text labels"
        />

        {/* Buttons with Icons using the 3 tokens */}
        <Card>
          <H4 fontSize="3.5r" fontWeight="600" m="0">The 3 Icon Tokens: small (4r), base (5r default), large (6r)</H4>
          <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
            {/* small */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="center">
              <Span fontSize="2.5r" color="design.text.light">size="small" (4r / 16px)</Span>
              <Button display="inline-flex" alignItems="center" gap="1.5r">
                <AddIcon size="small" />
                <span>Create New</span>
              </Button>
            </Div>

            {/* base (explicit or default) */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="center">
              <Span fontSize="2.5r" color="design.text.light">Default / size="base" (5r / 20px)</Span>
              <Button display="inline-flex" alignItems="center" gap="1.5r">
                <AddIcon />
                <span>Create New</span>
              </Button>
            </Div>

            {/* large */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="center">
              <Span fontSize="2.5r" color="design.text.light">size="large" (6r / 24px)</Span>
              <Button display="inline-flex" alignItems="center" gap="1.5r">
                <AddIcon size="large" />
                <span>Create New</span>
              </Button>
            </Div>

            {/* Trailing chevron */}
            <Div display="flex" flexDirection="column" gap="1r" alignItems="center">
              <Span fontSize="2.5r" color="design.text.light">Default Chevron (5r)</Span>
              <Button display="inline-flex" alignItems="center" gap="1.5r">
                <span>Actions</span>
                <KeyboardArrowDownIcon />
              </Button>
            </Div>
          </Div>
        </Card>

        {/* Badges and Chips */}
        <Card>
          <H4 fontSize="3.5r" fontWeight="600" m="0">Badges & Chips (Text: 3r / 12px)</H4>
          <Div display="flex" gap="4r" alignItems="center">
            {/* 3r icon */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">Icon 3r (1:1)</Span>
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1r"
                px="2r"
                py="0.75r"
                borderRadius="full"
                bg="ui.table.row.mutedBackground"
                fontSize="3r"
                color="design.text.base"
              >
                <CheckIcon size="3r" color="{colors.green.600}" />
                <span>Active</span>
              </Div>
            </Div>

            {/* 3.5r icon */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">Icon 3.5r (optical)</Span>
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1r"
                px="2r"
                py="0.75r"
                borderRadius="full"
                bg="ui.table.row.mutedBackground"
                fontSize="3r"
                color="design.text.base"
              >
                <CheckIcon size="3.5r" color="{colors.green.600}" />
                <span>Active</span>
              </Div>
            </Div>

            {/* 4r icon */}
            <Div display="flex" flexDirection="column" gap="1r">
              <Span fontSize="2.5r" color="design.text.light">Icon 4r</Span>
              <Div
                display="inline-flex"
                alignItems="center"
                gap="1r"
                px="2r"
                py="0.75r"
                borderRadius="full"
                bg="ui.table.row.mutedBackground"
                fontSize="3r"
                color="design.text.base"
              >
                <CheckIcon size="4r" color="{colors.green.600}" />
                <span>Active</span>
              </Div>
            </Div>
          </Div>
        </Card>

        {/* Prose Inline */}
        <Card>
          <H4 fontSize="3.5r" fontWeight="600" m="0">Inline with Body Text (Text: 4r / 16px)</H4>
          <Div display="flex" flexDirection="column" gap="3r">
            <P fontSize="4r" lineHeight="1.6" m="0" display="flex" alignItems="center" gap="1.5r">
              <InfoIcon size="4r" color="{colors.blue.500}" />
              <span>With <strong>4r (16px)</strong> icon: Icon matches font-size exactly.</span>
            </P>
            <P fontSize="4r" lineHeight="1.6" m="0" display="flex" alignItems="center" gap="1.5r">
              <InfoIcon size="4.5r" color="{colors.blue.500}" />
              <span>With <strong>4.5r (18px)</strong> icon: Optical compensation for glyph padding.</span>
            </P>
            <P fontSize="4r" lineHeight="1.6" m="0" display="flex" alignItems="center" gap="1.5r">
              <InfoIcon size="5r" color="{colors.blue.500}" />
              <span>With <strong>5r (20px)</strong> default icon: Matches section rhythm and control icons.</span>
            </P>
          </Div>
        </Card>
      </Div>
    )
  },
}
