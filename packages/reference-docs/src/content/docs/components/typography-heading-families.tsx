import type { ReactNode } from 'react'
import { Div, H1, H2, H3, H4, H5, H6, Span } from '@reference-ui/react'

/**
 * Heading specimens grouped by level: each level renders in all three shipped
 * families, stacked, so their metrics and baselines can be compared. Families
 * are written out literally — the style engine extracts `fontFamily` from
 * literal JSX, so a loop over data would drop it. `fontFamily` (not `font`)
 * keeps each heading's own size and weight and swaps only the family.
 */

const specStyle = {
  width: '12r',
  fontSize: 'sm',
  color: 'docsMuted',
  fontFamily: 'mono',
} as const

function HeadingRow({ family, children }: { family: string; children: ReactNode }) {
  return (
    <Div display="flex" alignItems="baseline" gap="4r">
      <Span {...specStyle}>{family}</Span>
      {children}
    </Div>
  )
}

export function HeadingFamilies() {
  return (
    <Div display="flex" flexDirection="column" gap="6r">
      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H1 margin="0" fontFamily="sans">Heading 1</H1>
        </HeadingRow>
        <HeadingRow family="serif">
          <H1 margin="0" fontFamily="serif">Heading 1</H1>
        </HeadingRow>
        <HeadingRow family="mono">
          <H1 margin="0" fontFamily="mono">Heading 1</H1>
        </HeadingRow>
      </Div>

      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H2 margin="0" fontFamily="sans">Heading 2</H2>
        </HeadingRow>
        <HeadingRow family="serif">
          <H2 margin="0" fontFamily="serif">Heading 2</H2>
        </HeadingRow>
        <HeadingRow family="mono">
          <H2 margin="0" fontFamily="mono">Heading 2</H2>
        </HeadingRow>
      </Div>

      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H3 margin="0" fontFamily="sans">Heading 3</H3>
        </HeadingRow>
        <HeadingRow family="serif">
          <H3 margin="0" fontFamily="serif">Heading 3</H3>
        </HeadingRow>
        <HeadingRow family="mono">
          <H3 margin="0" fontFamily="mono">Heading 3</H3>
        </HeadingRow>
      </Div>

      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H4 margin="0" fontFamily="sans">Heading 4</H4>
        </HeadingRow>
        <HeadingRow family="serif">
          <H4 margin="0" fontFamily="serif">Heading 4</H4>
        </HeadingRow>
        <HeadingRow family="mono">
          <H4 margin="0" fontFamily="mono">Heading 4</H4>
        </HeadingRow>
      </Div>

      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H5 margin="0" fontFamily="sans">Heading 5</H5>
        </HeadingRow>
        <HeadingRow family="serif">
          <H5 margin="0" fontFamily="serif">Heading 5</H5>
        </HeadingRow>
        <HeadingRow family="mono">
          <H5 margin="0" fontFamily="mono">Heading 5</H5>
        </HeadingRow>
      </Div>

      <Div display="flex" flexDirection="column" gap="0">
        <HeadingRow family="sans">
          <H6 margin="0" fontFamily="sans">Heading 6</H6>
        </HeadingRow>
        <HeadingRow family="serif">
          <H6 margin="0" fontFamily="serif">Heading 6</H6>
        </HeadingRow>
        <HeadingRow family="mono">
          <H6 margin="0" fontFamily="mono">Heading 6</H6>
        </HeadingRow>
      </Div>
    </Div>
  )
}
