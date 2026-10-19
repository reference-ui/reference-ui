// Live color-mode demo for the Foundations color page.
// It takes nothing and emits specimens rendered across light and dark modes. Colocated
// with the page that embeds it.
import { Div, Span, css } from '@reference-ui/react'

/**
 * Lib's semantic color tokens in both modes, side by side. Each panel is a
 * `colorMode` subtree, so the same token names resolve to their light or dark
 * value. Swatches are token-backed classes written out literally, because the
 * compiler only extracts static values.
 */
type Mode = 'light' | 'dark'

const grid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '4r',
  r: { 640: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
})

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3r',
  padding: '6r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'design.accent.border',
  bg: 'design.background',
  color: 'design.foreground',
})

const eyebrow = css({
  fontFamily: 'mono',
  fontSize: '0.75rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'design.text.lighter',
})

const rowStyle = css({ display: 'flex', alignItems: 'center', gap: '3r' })

const swatchBase = css({
  width: '5r',
  height: '5r',
  flexShrink: '0',
  borderRadius: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'design.accent.border',
})

const tokenName = css({ fontFamily: 'mono', fontSize: '3.5r', color: 'design.text.light' })

const SWATCHES = [
  ['design.background', css({ bg: 'design.background' })],
  ['design.foreground', css({ bg: 'design.foreground' })],
  ['design.text.light', css({ bg: 'design.text.light' })],
  ['design.primary.background', css({ bg: 'design.primary.background' })],
  ['design.accent.foreground', css({ bg: 'design.accent.foreground' })],
  ['design.bg.muted', css({ bg: 'design.bg.muted' })],
] as const

function ModePanel({ mode }: { mode: Mode }) {
  return (
    <Div colorMode={mode} className={panel}>
      <Span className={eyebrow}>{`colorMode="${mode}"`}</Span>
      {SWATCHES.map(([name, fill]) => (
        <Div key={name} className={rowStyle}>
          <Div className={`${swatchBase} ${fill}`} />
          <Span className={tokenName}>{name}</Span>
        </Div>
      ))}
    </Div>
  )
}

/** The same six tokens in a light subtree and a dark one. */
export function ColorModeDemo() {
  return (
    <Div className={grid}>
      <ModePanel mode="light" />
      <ModePanel mode="dark" />
    </Div>
  )
}
