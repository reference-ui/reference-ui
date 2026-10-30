// Section specimens for the Foundations typography page.
// They take nothing and emit font families, the type scale, and inline samples. Colocated
// with the page that embeds them.
import type { ReactNode } from 'react'
import {
  Abbr,
  Code,
  Div,
  Em,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Kbd,
  Mark,
  P,
  Small,
  Span,
  Strong,
} from '@reference-ui/react'

/**
 * Typography specimens for the Typography page: the three families, the type
 * scale and lib's inline text styles. Text primitives render with lib's own
 * styles and no overrides, so the page shows what ships. Kept in a component
 * (not MDX) so the style props are statically extracted.
 */

function FontCard({ name, font, sample }: { name: string; font: 'sans' | 'serif' | 'mono'; sample: string }) {
  return (
    <Div bg="docsPanelBg" borderRadius="md" padding="4r" display="flex" flexDirection="column" gap="3r">
      <Span fontSize="3.5r" weight="sans.semibold" color="docsMuted">
        {name}
      </Span>
      <Div font={font} fontSize="5r" lineHeight="1.3" color="docsText">
        {sample}
      </Div>
    </Div>
  )
}

/** One card per family, each set with the `font` prop. */
export function FontFamilies() {
  const sample = 'The quick brown fox jumps over the lazy dog.'
  return (
    <Div
      display="grid"
      gridTemplateColumns="1fr"
      gap="4r"
      r={{ 640: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } }}
    >
      <FontCard name="Sans · Inter" font="sans" sample={sample} />
      <FontCard name="Serif · Literata" font="serif" sample={sample} />
      <FontCard name="Mono · JetBrains Mono" font="mono" sample={sample} />
    </Div>
  )
}

function ScaleRow({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <Div display="flex" alignItems="baseline" gap="4r" flexWrap="wrap">
      <Span width="24r" flexShrink="0" fontSize="3.5r" color="docsMuted" fontFamily="mono">
        {spec}
      </Span>
      {children}
    </Div>
  )
}

/** Headings and body text at lib's sizes, bottom margins cleared so rows sit evenly. */
export function TypeScale() {
  return (
    <Div display="flex" flexDirection="column" gap="2r" marginBottom="6r">
      <ScaleRow spec="H1 · 36px">
        <H1 marginBottom="0">Heading 1</H1>
      </ScaleRow>
      <ScaleRow spec="H2 · 24px">
        <H2 marginBottom="0">Heading 2</H2>
      </ScaleRow>
      <ScaleRow spec="H3 · 20px">
        <H3 marginBottom="0">Heading 3</H3>
      </ScaleRow>
      <ScaleRow spec="H4 · 18px">
        <H4 marginBottom="0">Heading 4</H4>
      </ScaleRow>
      <ScaleRow spec="H5 · 18px">
        <H5 marginBottom="0">Heading 5</H5>
      </ScaleRow>
      <ScaleRow spec="H6 · 14px">
        <H6 marginBottom="0">Heading 6</H6>
      </ScaleRow>
      <ScaleRow spec="P · 16px">
        <P marginBottom="0">Body text for paragraphs and long reading.</P>
      </ScaleRow>
      <ScaleRow spec="Small">
        <Small>Small text for fine print and captions.</Small>
      </ScaleRow>
    </Div>
  )
}

/** Lib's inline text styles, unstyled by the page. */
export function InlineSamples() {
  return (
    <Div display="flex" flexDirection="column" gap="1r" marginBottom="6r">
      <P>
        <Strong>Strong for importance</Strong>, <Em>emphasis for stress</Em>, and{' '}
        <Mark>a mark for highlights</Mark>.
      </P>
      <P>
        Declare it with <Code>const</Code>, or press <Kbd>Cmd</Kbd> + <Kbd>S</Kbd> to save.
      </P>
      <P marginBottom="0">
        The <Abbr title="World Wide Web">WWW</Abbr> runs on links.
      </P>
    </Div>
  )
}
