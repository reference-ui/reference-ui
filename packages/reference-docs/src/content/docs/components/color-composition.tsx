import { Div, Span, css } from '@reference-ui/react'

/**
 * Colour composition: a colour is a base plus its tints, mixed over one neutral
 * face. Base is the pure family step; a tint is that step at a low percentage
 * `color-mix`ed over the panel, so the neutral always shows through. The same
 * mix paints a background, a border, a graph fill, or a foreground — only the
 * role and the amount change. Blue stands in for every family; the tokens are
 * the real palette.
 */

const face = css({
  bg: 'docsPanelBg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  padding: '6r',
  display: 'flex',
  flexDirection: 'column',
  gap: '5r',
})

const swatchRow = css({ display: 'flex', gap: '3r', flexWrap: 'wrap' })

const swatch = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  flex: '1 1 8rem',
  minWidth: '0',
})

const swatchFill = css({
  height: '12r',
  borderRadius: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
})

/* The recipe: base is the step at full strength; a tint is the same step at a
 * low percentage over the face. Every class owns bg + borderColor only, so any
 * shape can wear it. */
const surfaceBase = css({ bg: 'blue.500', borderColor: 'blue.500' })

const surfaceMedium = css({
  bg: 'color-mix(in oklab, var(--colors-blue-500) 10%, var(--colors-docs-panel-bg))',
  borderColor: 'color-mix(in oklab, var(--colors-blue-500) 30%, var(--colors-docs-border))',
})

const surfaceStrong = css({
  bg: 'color-mix(in oklab, var(--colors-blue-500) 18%, var(--colors-docs-panel-bg))',
  borderColor: 'color-mix(in oklab, var(--colors-blue-500) 46%, var(--colors-docs-border))',
})

const swatchName = css({
  fontSize: '4r',
  fontWeight: '600',
  color: 'docsText',
  lineHeight: '1.3',
})

const swatchMeta = css({ fontFamily: 'mono', fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const appliedCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3r',
  borderRadius: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
  padding: '4r',
})

const appliedHead = css({ display: 'flex', alignItems: 'center', gap: '3r' })

const appliedDot = css({ width: '3r', height: '3r', borderRadius: 'full', bg: 'blue.500', flexShrink: '0' })

const appliedTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const appliedSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const meter = css({
  height: '2r',
  borderRadius: 'full',
  bg: 'color-mix(in oklab, var(--colors-blue-500) 16%, var(--colors-docs-panel-bg))',
})

const meterFill = css({ height: '2r', width: '62%', borderRadius: 'full', bg: 'blue.500' })

function Swatch({ name, meta, surface }: { name: string; meta: string; surface: string }) {
  return (
    <Div className={swatch}>
      <Div className={`${swatchFill} ${surface}`} />
      <Span className={swatchName}>{name}</Span>
      <Span className={swatchMeta}>{meta}</Span>
    </Div>
  )
}

export function ColorComposition() {
  return (
    <Div className={face}>
      <Div className={swatchRow}>
        <Swatch name="Base" meta="blue.500 · 100%" surface={surfaceBase} />
        <Swatch name="Medium" meta="blue.500 · 10%" surface={surfaceMedium} />
        <Swatch name="Strong" meta="blue.500 · 18%" surface={surfaceStrong} />
      </Div>

      <Div className={`${appliedCard} ${surfaceMedium}`}>
        <Div className={appliedHead}>
          <Div className={appliedDot} />
          <Span className={appliedTitle}>Tinted surface</Span>
        </Div>
        <Span className={appliedSub}>Background 10% · hairline 30% · fill 100%</Span>
        <Div className={meter}>
          <Div className={meterFill} />
        </Div>
      </Div>
    </Div>
  )
}
