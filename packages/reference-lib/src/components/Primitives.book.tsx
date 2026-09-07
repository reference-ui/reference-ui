import * as React from 'react'
import { setupFocusVisible } from '../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

import {
  A,
  Abbr,
  Address,
  B,
  Blockquote,
  Button,
  Caption,
  Cite,
  Code,
  Datalist,
  Dd,
  Del,
  Details,
  Dialog,
  Div,
  Dl,
  Dt,
  Em,
  Fieldset,
  Figcaption,
  Figure,
  Form,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Hr,
  I,
  Img,
  Input,
  Ins,
  Kbd,
  Label,
  Legend,
  Li,
  Mark,
  Meter,
  Ol,
  Optgroup,
  Option,
  Output,
  P,
  Pre,
  Progress,
  Q,
  S,
  Samp,
  Select,
  Small,
  Span,
  Strong,
  Sub,
  Summary,
  Sup,
  Table,
  Tbody,
  Td,
  Textarea,
  Tfoot,
  Th,
  Thead,
  Time,
  Tr,
  U,
  Ul,
} from '@reference-ui/react'

const mediaPreviewMarkup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect width="400" height="225" rx="12" fill="url(#g)" />
    <circle cx="100" cy="90" r="36" fill="#93c5fd" fill-opacity="0.5" />
    <circle cx="310" cy="70" r="28" fill="#60a5fa" fill-opacity="0.4" />
    <path d="M50 175c35-40 70-60 100-60 25 0 45 10 70 30l20 18 30-30c15-15 30-22 50-22 28 0 55 18 80 50v40H50z" fill="#eff6ff" fill-opacity="0.75" />
    <text x="50" y="55" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Reference UI</text>
    <text x="50" y="80" fill="#bfdbfe" font-family="system-ui, sans-serif" font-size="13">Styled Primitive Surface</text>
  </svg>
`

const sampleImageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mediaPreviewMarkup)}`

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
      gap="3r"
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
      <Div display="flex" flexDirection="column" gap="3r">
        {children}
      </Div>
    </Div>
  )
}

function FormControlsSection() {
  const [rangeVal, setRangeVal] = React.useState(68)

  return (
    <SectionCard
      title="Form Controls & Inputs"
      description="Capitalized form controls with automatic control sizing (8.5r), focus states, and native styling."
    >
      <Form
        display="flex"
        flexDirection="column"
        gap="4r"
        onSubmit={e => e.preventDefault()}
      >
        <Div
          display="grid"
          gap="3.5r"
          gridTemplateColumns="repeat(auto-fit, minmax(60r, 1fr))"
        >
          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-text-input" fontSize="3r" fontWeight="500">
              Text Input
            </Label>
            <Input id="primitive-text-input" placeholder="Standard text input…" />
          </Div>

          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-email-input" fontSize="3r" fontWeight="500">
              Email Input
            </Label>
            <Input
              id="primitive-email-input"
              type="email"
              defaultValue="alex@example.com"
            />
          </Div>

          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-search-input" fontSize="3r" fontWeight="500">
              Search Input
            </Label>
            <Input
              id="primitive-search-input"
              type="search"
              placeholder="Search primitives…"
            />
          </Div>

          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-select" fontSize="3r" fontWeight="500">
              Select Dropdown
            </Label>
            <Select id="primitive-select" defaultValue="buttons">
              <Optgroup label="Interactive">
                <Option value="buttons">Buttons & Controls</Option>
                <Option value="inputs">Inputs & Fields</Option>
              </Optgroup>
              <Optgroup label="Display">
                <Option value="tables">Tables & Rows</Option>
                <Option value="code">Code & Typography</Option>
              </Optgroup>
            </Select>
          </Div>

          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-date-input" fontSize="3r" fontWeight="500">
              Date & Time
            </Label>
            <Div display="flex" gap="2r">
              <Input
                id="primitive-date-input"
                type="date"
                defaultValue="2026-09-06"
              />
              <Input type="time" defaultValue="11:30" />
            </Div>
          </Div>

          <Div display="flex" flexDirection="column" gap="1r">
            <Label htmlFor="primitive-file-input" fontSize="3r" fontWeight="500">
              File & Color
            </Label>
            <Div display="flex" gap="2r" alignItems="center">
              <Input id="primitive-file-input" type="file" flex="1" />
              <Input
                type="color"
                defaultValue="#3b82f6"
                width="8.5r"
                height="8.5r"
                p="0.5r"
                cursor="pointer"
                title="Choose color"
              />
            </Div>
          </Div>
        </Div>

        <Div display="flex" flexDirection="column" gap="1r">
          <Label htmlFor="primitive-textarea" fontSize="3r" fontWeight="500">
            Textarea
          </Label>
          <Textarea
            id="primitive-textarea"
            rows={3}
            placeholder="Multiline notes and descriptions styled with baseline typography…"
          />
        </Div>

        <Div display="flex" flexDirection="column" gap="1r">
          <Div display="flex" justifyContent="space-between" alignItems="center">
            <Label htmlFor="primitive-range-input" fontSize="3r" fontWeight="500">
              Range Slider
            </Label>
            <Output htmlFor="primitive-range-input" fontSize="3r" color="design.text.light">
              {rangeVal}%
            </Output>
          </Div>
          <Input
            id="primitive-range-input"
            type="range"
            min={0}
            max={100}
            value={rangeVal}
            onChange={e => setRangeVal(Number(e.target.value))}
            style={{ '--range-percent': `${rangeVal}%` } as React.CSSProperties}
          />
        </Div>
      </Form>
    </SectionCard>
  )
}

function ButtonsSection() {
  const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )

  return (
    <SectionCard
      title="Buttons"
      description="Standard native button primitive with hover, active, focus-visible, icon-clearance offsets, and icon-only 1:1 ratio."
    >
      <Div display="flex" flexWrap="wrap" gap="3r" alignItems="center">
        <Button type="button">Default Button</Button>

        <Button type="button" variant="primary">
          Primary Button
        </Button>

        <Button type="button" variant="ghost">
          Ghost Button
        </Button>

        <Button type="button" disabled>
          Disabled Button
        </Button>

        <Button type="button" variant="primary">
          <PlusIcon />
          <span>With Icon</span>
        </Button>

        <Button type="button" variant="ghost" aria-label="Add item" title="Add item">
          <PlusIcon />
        </Button>

        <Button
          type="button"
          bg="purple.600"
          color="white"
          borderColor="transparent"
        >
          Customized via Props
        </Button>
      </Div>
    </SectionCard>
  )
}

function SelectionControlsSection() {
  return (
    <SectionCard
      title="Selection Controls (Checkbox & Radio)"
      description="Pure CSS checkmark, radio dot, and fieldset grouping without heavy runtime wrappers."
    >
      <Div
        display="grid"
        gap="5r"
        gridTemplateColumns="repeat(auto-fit, minmax(50r, 1fr))"
      >
        {/* Checkboxes */}
        <Fieldset border="1px solid" borderColor="ui.field.border" borderRadius="md" p="3.5r" m="0">
          <Legend px="1.5r" fontSize="3r" fontWeight="600" color="design.text.base">
            Checkboxes
          </Legend>
          <Div display="flex" flexDirection="column" gap="2.5r" mt="1r">
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="pointer">
              <Input type="checkbox" defaultChecked />
              <Span fontSize="3.5r">Default checked with SVG tick</Span>
            </Label>
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="pointer">
              <Input type="checkbox" />
              <Span fontSize="3.5r">Unchecked state</Span>
            </Label>
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="not-allowed" opacity="0.6">
              <Input type="checkbox" disabled defaultChecked />
              <Span fontSize="3.5r">Disabled checked</Span>
            </Label>
          </Div>
        </Fieldset>

        {/* Radios */}
        <Fieldset border="1px solid" borderColor="ui.field.border" borderRadius="md" p="3.5r" m="0">
          <Legend px="1.5r" fontSize="3r" fontWeight="600" color="design.text.base">
            Radio Options
          </Legend>
          <Div display="flex" flexDirection="column" gap="2.5r" mt="1r">
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="pointer">
              <Input type="radio" name="primitive-density" defaultChecked />
              <Span fontSize="3.5r">Comfortable density (default)</Span>
            </Label>
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="pointer">
              <Input type="radio" name="primitive-density" />
              <Span fontSize="3.5r">Compact density</Span>
            </Label>
            <Label display="inline-flex" alignItems="center" gap="2r" cursor="not-allowed" opacity="0.6">
              <Input type="radio" name="primitive-density-disabled" disabled defaultChecked />
              <Span fontSize="3.5r">Disabled radio</Span>
            </Label>
          </Div>
        </Fieldset>
      </Div>
    </SectionCard>
  )
}

function MetersAndProgressSection() {
  return (
    <SectionCard
      title="Metrics & Progress Bars"
      description="Native meter and progress primitives with status-aware color fills."
    >
      <Div display="flex" flexDirection="column" gap="3.5r">
        <Div display="flex" flexDirection="column" gap="1r">
          <Div display="flex" justifyContent="space-between">
            <Span fontSize="3r" fontWeight="500">Task Progress</Span>
            <Span fontSize="3r" color="design.text.light">65%</Span>
          </Div>
          <Progress value={65} max={100} />
        </Div>

        <Div
          display="grid"
          gap="3.5r"
          gridTemplateColumns="repeat(auto-fit, minmax(40r, 1fr))"
        >
          <Div display="flex" flexDirection="column" gap="1r">
            <Span fontSize="3r" color="design.text.light">Low (Warning)</Span>
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={20} />
          </Div>
          <Div display="flex" flexDirection="column" gap="1r">
            <Span fontSize="3r" color="design.text.light">Medium (Suboptimum)</Span>
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={50} />
          </Div>
          <Div display="flex" flexDirection="column" gap="1r">
            <Span fontSize="3r" color="design.text.light">High (Optimum)</Span>
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={85} />
          </Div>
        </Div>
      </Div>
    </SectionCard>
  )
}

function TablesSection() {
  return (
    <SectionCard
      title="Tables"
      description="Standard HTML table elements styled with data density, row hover highlights, and border tokens."
    >
      <Div overflowX="auto" border="1px solid" borderColor="ui.table.border" borderRadius="md">
        <Table>
          <Caption p="2r" fontSize="3r" color="design.text.light" textAlign="left">
            Reference UI Styled Primitives Inventory
          </Caption>
          <Thead>
            <Tr>
              <Th scope="col">Element</Th>
              <Th scope="col">Category</Th>
              <Th scope="col">Selector</Th>
              <Th scope="col">Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td><Code>Button</Code></Td>
              <Td>Forms</Td>
              <Td><Code>.ref-button</Code></Td>
              <Td><Span color="design.positive.text" fontWeight="500">Styled</Span></Td>
            </Tr>
            <Tr>
              <Td><Code>Input</Code></Td>
              <Td>Forms</Td>
              <Td><Code>.ref-input</Code></Td>
              <Td><Span color="design.positive.text" fontWeight="500">Styled</Span></Td>
            </Tr>
            <Tr>
              <Td><Code>Table</Code></Td>
              <Td>Display</Td>
              <Td><Code>.ref-table</Code></Td>
              <Td><Span color="design.positive.text" fontWeight="500">Styled</Span></Td>
            </Tr>
            <Tr>
              <Td><Code>Kbd</Code></Td>
              <Td>Code</Td>
              <Td><Code>.ref-kbd</Code></Td>
              <Td><Span color="design.positive.text" fontWeight="500">Styled</Span></Td>
            </Tr>
            <Tr>
              <Td><Code>Blockquote</Code></Td>
              <Td>Typography</Td>
              <Td><Code>.ref-blockquote</Code></Td>
              <Td><Span color="design.positive.text" fontWeight="500">Styled</Span></Td>
            </Tr>
          </Tbody>
          <Tfoot>
            <Tr>
              <Td colSpan={4} p="2.5r" color="design.text.light">
                All 20+ styled native primitives respond directly to colorMode (light/dark).
              </Td>
            </Tr>
          </Tfoot>
        </Table>
      </Div>
    </SectionCard>
  )
}

function TypographySection() {
  return (
    <SectionCard
      title="Typography & Headings"
      description="Proportional heading scales (H1–H6), paragraphs, blockquotes, and dividers."
    >
      <Div display="flex" flexDirection="column" gap="3r">
        <Div display="flex" flexDirection="column" gap="1r">
          <H1>Heading 1 (9r / sans.semibold)</H1>
          <H2>Heading 2 (6r / sans.semibold)</H2>
          <H3>Heading 3 (5r / sans.semibold)</H3>
          <H4>Heading 4 (4.5r / sans.semibold)</H4>
          <H5>Heading 5 (4.5r / 500)</H5>
          <H6>Heading 6 (3.5r / uppercase)</H6>
        </Div>

        <Hr />

        <P>
          Body text rendered with <Code>&lt;P&gt;</Code> maintains standard 4r font size, comfortable 1.6
          line height, and token-aware baseline margins.
        </P>

        <Blockquote>
          “Reference UI is built on simplicity, the actual surface of it is deceptively simple. Capitalized HTML with native style props.”
          <Cite display="block" mt="1.5r" fontSize="3r" color="design.text.light">
            — Architecture Manifesto
          </Cite>
        </Blockquote>

        <Address>
          Reference UI Design Systems Lab
          <br />
          Platform Primacy &amp; LLM-First Component Architecture
        </Address>
      </Div>
    </SectionCard>
  )
}

function CodeAndKeyboardsSection() {
  return (
    <SectionCard
      title="Code & Keyboard Badges"
      description="Monospace inline code, preformatted code blocks, keyboard shortcut keys, and computer output."
    >
      <Div display="flex" flexDirection="column" gap="3r">
        <Div display="flex" flexWrap="wrap" alignItems="center" gap="2.5r">
          <Span fontSize="3.5r">Press</Span>
          <Kbd>⌘</Kbd>
          <Span fontSize="3.5r">+</Span>
          <Kbd>K</Kbd>
          <Span fontSize="3.5r">for Command Palette or</Span>
          <Kbd>Shift</Kbd>
          <Span fontSize="3.5r">+</Span>
          <Kbd>Tab</Kbd>
          <Span fontSize="3.5r">to navigate backward.</Span>
        </Div>

        <Div>
          <Span fontSize="3.5r">
            Inline code snippet: <Code>const theme = useColorMode()</Code> alongside sample output <Samp>build succeeded in 43ms</Samp>.
          </Span>
        </Div>

        <Pre>
{`// Reference UI Primitive Composition
import { Div, Button, Input } from '@reference-ui/react'

export function SearchField() {
  return (
    <Div display="flex" gap="2r" alignItems="center">
      <Input placeholder="Filter..." />
      <Button type="button">Search</Button>
    </Div>
  )
}`}
        </Pre>
      </Div>
    </SectionCard>
  )
}

function InlineSemanticsSection() {
  return (
    <SectionCard
      title="Inline Text Elements"
      description="Full suite of styled HTML inline semantics."
    >
      <Div display="flex" flexDirection="column" gap="2r" fontSize="3.5r" lineHeight="1.8">
        <Div>
          <Strong>Strong / Bold:</Strong> <Strong>Important notice</Strong> and <B>bold element</B>.
        </Div>
        <Div>
          <Em>Emphasis / Italic:</Em> <Em>Emphasized phrase</Em> and <I>italic text</I>.
        </Div>
        <Div>
          <A href="#links" onClick={e => e.preventDefault()}>Interactive Link (with hover underline)</A>
        </Div>
        <Div>
          <Mark>Marked / Highlighted:</Mark> This phrase has <Mark>important search highlights</Mark> applied.
        </Div>
        <Div>
          <Small>Small text:</Small> <Small>Terms and conditions apply to this license.</Small>
        </Div>
        <Div>
          <Del>Deleted</Del> &amp; <Ins>Inserted:</Ins> <Del>$120.00</Del> <Ins>$89.00</Ins> (or <S>strikethrough</S> / <U>underline</U>).
        </Div>
        <Div>
          <Sub>Subscript</Sub> &amp; <Sup>Superscript:</Sup> H<Sub>2</Sub>O and E = mc<Sup>2</Sup>.
        </Div>
        <Div>
          <Abbr title="Accessible Rich Internet Applications">ARIA</Abbr> (abbreviation with dotted underline).
        </Div>
        <Div>
          <Time dateTime="2026-09-06">Published on September 6, 2026</Time>
        </Div>
      </Div>
    </SectionCard>
  )
}

function ListsSection() {
  return (
    <SectionCard
      title="Lists (Unordered, Ordered, Description)"
      description="Standard list elements with comfortable line height and counter rhythm."
    >
      <Div
        display="grid"
        gap="4r"
        gridTemplateColumns="repeat(auto-fit, minmax(45r, 1fr))"
      >
        <Div>
          <H4 fontSize="3.5r" fontWeight="600" mb="2r">Unordered (&lt;Ul&gt;)</H4>
          <Ul>
            <Li>Zero-runtime token styling</Li>
            <Li>
              Nested bullet formatting:
              <Ul mt="1r">
                <Li>Automatic disc to circle marker</Li>
                <Li>Tightened descendant spacing</Li>
              </Ul>
            </Li>
            <Li>Responsive text wrapping</Li>
          </Ul>
        </Div>

        <Div>
          <H4 fontSize="3.5r" fontWeight="600" mb="2r">Ordered (&lt;Ol&gt;)</H4>
          <Ol>
            <Li>Run build dependencies</Li>
            <Li>Execute style prop sync</Li>
            <Li>Render Cosmos fixtures</Li>
          </Ol>
        </Div>

        <Div>
          <H4 fontSize="3.5r" fontWeight="600" mb="2r">Description List (&lt;Dl&gt;)</H4>
          <Dl>
            <Dt fontWeight="600">Primitive</Dt>
            <Dd ml="3r" mb="1.5r" color="design.text.light">A capitalized native HTML tag with style props.</Dd>
            <Dt fontWeight="600">Theme Class</Dt>
            <Dd ml="3r" color="design.text.light">The `.ref-*` selector that establishes visual baselines.</Dd>
          </Dl>
        </Div>
      </Div>
    </SectionCard>
  )
}

function DisclosureAndDialogSection() {
  return (
    <SectionCard
      title="Disclosure & Dialog Surfaces"
      description="Native expandable <Details>/<Summary> and static <Dialog> card primitives."
    >
      <Div
        display="grid"
        gap="4r"
        gridTemplateColumns="repeat(auto-fit, minmax(55r, 1fr))"
      >
        <Div>
          <Details open>
            <Summary>Expandable Primitive Disclosure</Summary>
            <P mt="2r" mb="0" fontSize="3.5r" color="design.text.light">
              Native HTML5 <Code>&lt;Details&gt;</Code> and <Code>&lt;Summary&gt;</Code> with animated indicator marker,
              focus ring, and container border.
            </P>
          </Details>

          <Details>
            <Summary>Additional System Details</Summary>
            <P mt="2r" mb="0" fontSize="3.5r" color="design.text.light">
              Closed by default; click to expand without JavaScript state machinery.
            </P>
          </Details>
        </Div>

        <Div>
          <Dialog
            open
            position="static"
            margin="0"
            width="100%"
            boxShadow="0 4px 16px rgba(0,0,0,0.12)"
          >
            <H4 fontSize="4r" fontWeight="600" m="0">
              Static Dialog Surface
            </H4>
            <P fontSize="3r" color="design.text.light" mt="1.5r" mb="3r">
              Native HTML5 dialog element with default surface elevation, borders, and typography.
            </P>
            <Div display="flex" justifyContent="flex-end" gap="2r">
              <Button
                type="button"
              >
                Dismiss
              </Button>
              <Button
                type="button"
                variant="primary"
              >
                Confirm
              </Button>
            </Div>
          </Dialog>
        </Div>
      </Div>
    </SectionCard>
  )
}

function MediaSection() {
  return (
    <SectionCard
      title="Media & Figures"
      description="Responsive image, figure, and figcaption primitives."
    >
      <Div display="flex" flexWrap="wrap" gap="4r" alignItems="flex-start">
        <Figure margin="0" maxWidth="75r">
          <Img
            src={sampleImageSrc}
            alt="Reference UI Primitive Media Artwork"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.field.border"
          />
          <Figcaption>
            <Span fontSize="3r" color="design.text.light">
              Figure 1: Capitalized native <Code>&lt;Figure&gt;</Code>, <Code>&lt;Img&gt;</Code>, and <Code>&lt;Figcaption&gt;</Code>.
            </Span>
          </Figcaption>
        </Figure>
      </Div>
    </SectionCard>
  )
}

export function PrimitivesOverview() {
  return (
    <Div display="flex" flexDirection="column" gap="6r" maxW="300r" mx="auto">
      {/* Header Banner */}
      <Div
        p="6r"
        borderRadius="xl"
        bg="ui.dialog.background"
        border="1px solid"
        borderColor="ui.dialog.border"
        boxShadow="0 4px 20px rgba(0,0,0,0.08)"
      >
        <H2 fontSize="7r" fontWeight="700" m="0" color="design.text.base">
          Reference UI Styled Primitives
        </H2>
        <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
          Visual showcase of all native HTML primitives styled by Reference UI's design token system.
          Zero wrapper bloat — standard HTML tags capitalized with native style props.
        </P>
      </Div>

      {/* Grid of all styled primitive categories */}
      <FormControlsSection />
      <ButtonsSection />
      <SelectionControlsSection />
      <MetersAndProgressSection />
      <TablesSection />
      <TypographySection />
      <CodeAndKeyboardsSection />
      <InlineSemanticsSection />
      <ListsSection />
      <DisclosureAndDialogSection />
      <MediaSection />
    </Div>
  )
}

export default {
  All: () => <PrimitivesOverview />,
  Forms: () => <FormControlsSection />,
  Buttons: () => <ButtonsSection />,
  Selection: () => <SelectionControlsSection />,
  Tables: () => <TablesSection />,
  Typography: () => <TypographySection />,
  Code: () => <CodeAndKeyboardsSection />,
  Inline: () => <InlineSemanticsSection />,
  Lists: () => <ListsSection />,
  Disclosure: () => <DisclosureAndDialogSection />,
}
