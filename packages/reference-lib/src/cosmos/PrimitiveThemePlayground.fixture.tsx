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
  Dd,
  Del,
  Details,
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
  Input,
  Ins,
  Kbd,
  Label,
  Legend,
  Li,
  Mark,
  Meter,
  Ol,
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
          <Button type="button">Button</Button>
          <Button type="button" disabled>
            Disabled button
          </Button>
        </Div>
      </SectionCard>

      <SectionCard title="Forms">
        <Form
          display="grid"
          gap="4r"
          gridTemplateColumns="repeat(auto-fit, minmax(16rem, 1fr))"
          onSubmit={event => event.preventDefault()}
        >
          <Field label="Text input">
            <Input placeholder="Untitled primitive" />
          </Field>
          <Field label="Email input">
            <Input type="email" defaultValue="hello@example.com" />
          </Field>
          <Field label="Select">
            <Select defaultValue="button">
              <Option value="button">Button</Option>
              <Option value="input">Input</Option>
              <Option value="table">Table</Option>
            </Select>
          </Field>
          <Field label="Textarea">
            <Textarea defaultValue="Theme notes for the next styling pass." rows={4} />
          </Field>
          <Field label="Progress">
            <Progress value={68} max={100} />
          </Field>
          <Field label="Meter">
            <Meter min={0} max={100} low={30} high={80} optimum={70} value={72} />
          </Field>
          <Fieldset>
            <Legend>Options</Legend>
            <Div display="flex" flexDirection="column" gap="2r">
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
          <Div display="flex" alignItems="end" gap="3r">
            <Button type="submit">Save theme pass</Button>
            <Button type="button" disabled>
              Disabled
            </Button>
            <Output name="status">Idle</Output>
          </Div>
        </Form>
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
