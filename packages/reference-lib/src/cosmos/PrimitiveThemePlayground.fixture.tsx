import type { ReactNode } from 'react'
import {
  A,
  Abbr,
  Address,
  B,
  Blockquote,
  Br,
  Button,
  Caption,
  Cite,
  Code,
  Data,
  Datalist,
  Dd,
  Del,
  Details,
  Dialog,
  Dfn,
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
  Rp,
  Rt,
  Ruby,
  S,
  Samp,
  Select,
  Small,
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
  Var,
} from '@reference-ui/react'

const mediaPreviewMarkup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
    <defs>
      <linearGradient id="preview-gradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f766e" />
        <stop offset="100%" stop-color="#164e63" />
      </linearGradient>
    </defs>
    <rect width="320" height="180" rx="18" fill="url(#preview-gradient)" />
    <circle cx="78" cy="72" r="30" fill="#99f6e4" fill-opacity="0.45" />
    <circle cx="246" cy="56" r="24" fill="#67e8f9" fill-opacity="0.35" />
    <path d="M40 138c28-32 54-48 78-48 18 0 35 8 53 25l16 15 23-25c11-12 24-18 40-18 22 0 44 14 66 41v34H40z" fill="#ecfeff" fill-opacity="0.68" />
    <text x="40" y="42" fill="#ecfeff" font-family="ui-sans-serif, sans-serif" font-size="18" font-weight="700">Reference UI</text>
    <text x="40" y="64" fill="#cffafe" font-family="ui-sans-serif, sans-serif" font-size="12">Primitive media preview</text>
  </svg>
`

const mediaPreviewSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  mediaPreviewMarkup,
)}`

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Div
      borderWidth="1px"
      borderStyle="solid"
      borderColor="reference.border"
      borderRadius="lg"
      padding="5r"
    >
      <Div
        color="reference.textLight"
        fontSize="xs"
        fontWeight="700"
        letterSpacing="0.08em"
        marginBottom="4r"
        textTransform="uppercase"
      >
        {title}
      </Div>
      {children}
    </Div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" gap="1r">
      <Label>{label}</Label>
      {children}
    </Div>
  )
}

export default function PrimitiveThemePlaygroundFixture() {
  return (
    <Div display="flex" flexDirection="column" gap="5r" color="reference.text">
      <Div>
        <H1>Primitive theme playground</H1>
        <P>
          A curated pass over the HTML primitives that usually need a theme class:
          typography, inline text, controls, data display, and disclosure patterns.
        </P>
      </Div>

      <SectionCard title="Headings">
        <H1>Heading one</H1>
        <H2>Heading two</H2>
        <H3>Heading three</H3>
        <H4>Heading four</H4>
        <H5>Heading five</H5>
        <H6>Heading six</H6>
      </SectionCard>

      <SectionCard title="Rich Text">
        <P>
          Paragraph copy with an <A href="https://reference-ui.com">inline anchor</A>,{' '}
          <Strong>strong text</Strong>, <Em>emphasis</Em>, <B>bold</B>, <U>underline</U>,{' '}
          <S>struck text</S>, <Mark>highlighted text</Mark>,{' '}
          <Abbr title="Reference UI">RUI</Abbr>, <Dfn>definition text</Dfn>,{' '}
          <Var>themeValue</Var>, H<Sub>2</Sub>O, and x<Sup>2</Sup>.
        </P>
        <P>
          <Q>Short quotations should feel intentional</Q>, then regular copy should resume
          without awkward spacing.
        </P>
        <Blockquote>
          Good defaults make primitives useful before a component abstraction exists.{' '}
          <Cite>Theme notes</Cite>
        </Blockquote>
        <Small>
          Small print is still readable and aligned with the surrounding rhythm.
        </Small>
        <Hr />
        <P>
          <Del>Removed language</Del> can sit next to <Ins>inserted language</Ins> and a{' '}
          <Time dateTime="2026-04-25">dated note</Time>.
        </P>
      </SectionCard>

      <SectionCard title="Links And Meta">
        <Div
          display="grid"
          gap="5r"
          gridTemplateColumns="repeat(auto-fit, minmax(16rem, 1fr))"
        >
          <Div display="grid" gap="3r">
            <H3>Anchors</H3>
            <A href="#theme-audit">Jump to theme audit</A>
            <A href="https://reference-ui.com/docs?view=primitives">
              External documentation link with a longer label that wraps across lines
            </A>
            <A href="mailto:theme-lab@reference-ui.com">theme-lab@reference-ui.com</A>
          </Div>
          <Div display="grid" gap="3r">
            <H3>Meta text</H3>
            <P>
              Build <Data value="1.4.2">1.4.2</Data> shipped at{' '}
              <Time dateTime="2026-04-26T09:41">9:41 AM</Time>.
            </P>
            <P>
              <Ruby>
                参<Rp>(</Rp>
                <Rt>theme</Rt>
                <Rp>)</Rp>
              </Ruby>{' '}
              and meta primitives should sit comfortably in running copy.
            </P>
          </Div>
        </Div>
      </SectionCard>

      <SectionCard title="Code">
        <P>
          Inline code like <Code>buttonRecipe()</Code>, keyboard input like <Kbd>Cmd</Kbd>{' '}
          + <Kbd>K</Kbd>, sample output like <Samp>theme synced</Samp>, and a preformatted
          block:
        </P>
        <Pre>{`const tone = tokens.colors.accent
return <Button>{tone}</Button>`}</Pre>
      </SectionCard>

      <SectionCard title="Lists">
        <Div
          display="grid"
          gap="5r"
          gridTemplateColumns="repeat(auto-fit, minmax(16rem, 1fr))"
        >
          <Div>
            <H3>Unordered</H3>
            <Ul>
              <Li>Base item spacing</Li>
              <Li>Nested markers and indentation</Li>
              <Li>Longer items that wrap across multiple lines in the playground card</Li>
            </Ul>
          </Div>
          <Div>
            <H3>Ordered</H3>
            <Ol>
              <Li>Default counter style</Li>
              <Li>Readable wrapped lines</Li>
              <Li>Comfortable block rhythm</Li>
            </Ol>
          </Div>
          <Div>
            <H3>Description</H3>
            <Dl>
              <Dt>Primitive</Dt>
              <Dd>A styled HTML element exported from Reference UI.</Dd>
              <Dt>Theme class</Dt>
              <Dd>The `.ref-*` selector that gives the primitive its visual baseline.</Dd>
            </Dl>
          </Div>
        </Div>
      </SectionCard>

      <SectionCard title="Buttons">
        <Div display="flex" flexWrap="wrap" gap="3r" alignItems="center">
          <Input defaultValue="Aligned input" width="12rem" />
          <Button type="button">Button</Button>
          <Button type="button" disabled>
            Disabled button
          </Button>
        </Div>
      </SectionCard>  

      <SectionCard title="Forms">
        <Form
          display="flex"
          flexDirection="column"
          gap="5r"
          onSubmit={event => event.preventDefault()}
        >
          <Div
            display="grid"
            gap="4r"
            gridTemplateColumns="repeat(auto-fit, minmax(16rem, 1fr))"
          >
            <Field label="Text input">
              <Input placeholder="Untitled primitive" />
            </Field>
            <Field label="Email input">
              <Input type="email" defaultValue="hello@example.com" />
            </Field>
            <Field label="Select">
              <Select defaultValue="button">
                <Optgroup label="Controls">
                  <Option value="button">Button</Option>
                  <Option value="input">Input</Option>
                </Optgroup>
                <Optgroup label="Display">
                  <Option value="table">Table</Option>
                </Optgroup>
              </Select>
            </Field>
            <Field label="Textarea">
              <Textarea defaultValue="Theme notes for the next styling pass." rows={4} />
            </Field>
            <Field label="Search input">
              <Div display="grid" gap="2r">
                <Input list="primitive-suggestions" type="search" defaultValue="Primitive" />
                <Datalist id="primitive-suggestions">
                  <Option value="Primitive theme" />
                  <Option value="Dialog surface" />
                  <Option value="Image surface" />
                </Datalist>
              </Div>
            </Field>
            <Field label="Date input">
              <Input type="date" defaultValue="2026-04-26" />
            </Field>
            <Field label="Time input">
              <Input type="time" defaultValue="09:41" />
            </Field>
            <Field label="Color input">
              <Input type="color" defaultValue="#0f766e" width="5rem" padding="1r" />
            </Field>
            <Field label="File input">
              <Input type="file" />
            </Field>
            <Field label="Range input">
              <Div display="grid" gap="2r">
                <Input type="range" min={0} max={100} defaultValue={68} />
                <Output>Standalone slider surface</Output>
              </Div>
            </Field>
            <Field label="Progress">
              <Progress value={68} max={100} />
            </Field>
          </Div>

          <Fieldset>
            <Legend>Options</Legend>
            <Div display="grid" gap="2r">
              <Label>
                <Input type="checkbox" defaultChecked /> Include state styles
              </Label>
              <Label>
                <Input type="radio" name="density" defaultChecked /> Comfortable density
              </Label>
              <Label>
                <Input type="radio" name="density" /> Compact density
              </Label>
            </Div>
          </Fieldset>

          <Div display="flex" flexWrap="wrap" justifyContent="flex-end" gap="3r">
            <Button type="button" disabled>
              Disabled
            </Button>
            <Button type="submit">Save theme pass</Button>
          </Div>
        </Form>
      </SectionCard>

      <SectionCard title="Meters">
        <Div
          display="grid"
          gap="4r"
          gridTemplateColumns="repeat(auto-fit, minmax(16rem, 1fr))"
        >
          <Field label="Low">
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={20} />
          </Field>
          <Field label="Suboptimum">
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={50} />
          </Field>
          <Field label="Optimum">
            <Meter min={0} max={100} low={33} high={66} optimum={80} value={84} />
          </Field>
        </Div>
      </SectionCard>

      <SectionCard title="Tables">
        <Div overflowX="auto">
          <Table>
            <Caption>Primitive styling audit</Caption>
            <Thead>
              <Tr>
                <Th scope="col">Primitive</Th>
                <Th scope="col">Use case</Th>
                <Th scope="col">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Button</Td>
                <Td>Actions and affordances</Td>
                <Td>Needs theme</Td>
              </Tr>
              <Tr>
                <Td>Input</Td>
                <Td>Fields and form controls</Td>
                <Td>Needs theme</Td>
              </Tr>
              <Tr>
                <Td>Table</Td>
                <Td>Data density and borders</Td>
                <Td>Needs theme</Td>
              </Tr>
            </Tbody>
            <Tfoot>
              <Tr>
                <Td colSpan={3}>
                  Use the decorator toggle to compare dark and light mode.
                </Td>
              </Tr>
            </Tfoot>
          </Table>
        </Div>
      </SectionCard>

      <SectionCard title="Dialog">
        <Dialog open>
          <H3>Primitive theme review</H3>
          <P>
            Dialog containers need surface, border, spacing, and readable typography before
            higher-level modal behavior exists.
          </P>
          <Div display="flex" justifyContent="flex-end" gap="3r" marginTop="4r">
            <Button type="button" disabled>
              Later
            </Button>
            <Button type="button">Apply review</Button>
          </Div>
        </Dialog>
      </SectionCard>

      <SectionCard title="Image">
        <Figure margin="0" maxWidth="20rem">
          <Img src={mediaPreviewSrc} alt="Abstract Reference UI preview artwork" />
          <Figcaption>Image primitives should inherit sizing and radius defaults.</Figcaption>
        </Figure>
      </SectionCard>

      <SectionCard title="Disclosure And Figure">
        <Details>
          <Summary>Show primitive notes</Summary>
          <P>
            Details and summary need hover, focus, marker, and spacing defaults that still
            feel native.
          </P>
        </Details>
        <Figure>
          <Div
            borderRadius="md"
            bg="reference.border"
            marginTop="4r"
            minHeight="8rem"
            display="grid"
            placeItems="center"
          >
            Figure media placeholder
          </Div>
          <Figcaption>A figcaption should feel connected to its media.</Figcaption>
        </Figure>
        <Address>
          Reference UI
          <Br />
          Theme Lab, Primitive Avenue
        </Address>
      </SectionCard>
    </Div>
  )
}
