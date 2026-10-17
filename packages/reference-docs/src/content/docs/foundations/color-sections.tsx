import { Div, Span, css } from '@reference-ui/react'
import { Preview } from '../../../mdx/Preview'

/**
 * Color specimens for the Color page, built from lib's real tones. Every value is a
 * static class or prop, so the compiler extracts it at build time. A tone is
 * picked from a static map, never built from a string, because computed values
 * are dropped. Each tone tile sets `bg` and `borderColor`, so one tone shows
 * both of its amounts: the surface in the fill and the line on the edge.
 */

const TONES = ['ghost', 'medium', 'firm', 'strong'] as const
const SHADES = [100, 300, 500, 700, 900] as const
type Tone = (typeof TONES)[number]

const STRENGTH: Record<Tone, string> = {
  ghost: '4% / 22%',
  medium: '10% / 34%',
  firm: '14% / 46%',
  strong: '18% / 58%',
}

const toneTile: Record<Tone, string> = {
  ghost: css({ bg: 'blue.500/ghost', borderColor: 'blue.500/ghost' }),
  medium: css({ bg: 'blue.500/medium', borderColor: 'blue.500/medium' }),
  firm: css({ bg: 'blue.500/firm', borderColor: 'blue.500/firm' }),
  strong: css({ bg: 'blue.500/strong', borderColor: 'blue.500/strong' }),
}

const shadeFill: Record<(typeof SHADES)[number], string> = {
  100: css({ bg: 'blue.100', borderColor: 'blue.100' }),
  300: css({ bg: 'blue.300', borderColor: 'blue.300' }),
  500: css({ bg: 'blue.500', borderColor: 'blue.500' }),
  700: css({ bg: 'blue.700', borderColor: 'blue.700' }),
  900: css({ bg: 'blue.900', borderColor: 'blue.900' }),
}

const stack = css({ display: 'flex', flexDirection: 'column', gap: '6r', width: '100%' })

const row = css({ display: 'flex', flexWrap: 'wrap', gap: '3r', width: '100%' })

const cell = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  flex: '1 1 6rem',
  minWidth: '0',
})

const tile = css({
  height: '12r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
})

const label = css({ fontFamily: 'mono', fontSize: '3.5r', color: 'docsMuted', lineHeight: '1.5' })

const toneName = css({
  fontFamily: 'mono',
  fontSize: '3.5r',
  fontWeight: '600',
  color: 'docsText',
  lineHeight: '1.5',
})

const eyebrow = css({
  fontFamily: 'mono',
  fontSize: '0.75rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'docsMuted',
})

function Chip({ text, fill }: { text: string; fill: string }) {
  return (
    <Div className={cell}>
      <Div className={`${tile} ${fill}`} />
      <Span className={label}>{text}</Span>
    </Div>
  )
}

/** Shades are fixed steps; tones are one shade at four strengths over the panel. */
export function ShadesAndTones() {
  return (
    <Preview>
      <Div className={stack}>
        <Span className={eyebrow}>Shades · fixed steps</Span>
        <Div className={row}>
          {SHADES.map(shade => (
            <Chip key={shade} text={`blue.${shade}`} fill={shadeFill[shade]} />
          ))}
        </Div>
        <Span className={eyebrow}>Tones · blue.500 at four strengths</Span>
        <Div className={row}>
          {TONES.map(tone => (
            <Chip key={tone} text={`blue.500/${tone}`} fill={toneTile[tone]} />
          ))}
        </Div>
      </Div>
    </Preview>
  )
}

const modeFrame = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4r',
  bg: 'docsPageBg',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  padding: '6r',
})

const toneGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '3r',
  r: { 640: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' } },
})

function IntensityRow({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <Div colorMode={mode} className={modeFrame}>
      <Span className={eyebrow}>{mode === 'light' ? 'Light' : 'Dark'} · surface / line</Span>
      <Div className={toneGrid}>
        {TONES.map(tone => (
          <Div key={tone} className={cell}>
            <Div className={`${tile} ${toneTile[tone]}`} />
            <Span className={toneName}>{tone}</Span>
            <Span className={label}>{STRENGTH[tone]}</Span>
          </Div>
        ))}
      </Div>
    </Div>
  )
}

/** The four strengths side by side, once on a light page and once on a dark one. */
export function IntensityGrid() {
  return (
    <Div display="flex" flexDirection="column" gap="4r">
      <IntensityRow mode="light" />
      <IntensityRow mode="dark" />
    </Div>
  )
}

const specimenLine = css({
  height: '14r',
  borderRadius: 'md',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: 'blue.500/strong',
})

const specimenSurface = css({ height: '14r', borderRadius: 'md', bg: 'blue.500/strong' })

const specimenText = css({
  color: 'blue.500/strong',
  fontSize: '4r',
  fontWeight: '600',
  lineHeight: '1.3',
})

function RoleLabel({ prop, kind, amount }: { prop: string; kind: string; amount: string }) {
  return (
    <>
      <Span className={toneName}>{prop}</Span>
      <Span className={label}>
        {kind} · {amount}
      </Span>
    </>
  )
}

/** One tone, three props: the same `strong` is 18% as a surface and 58% as a line. */
export function RoleSpecimens() {
  return (
    <Preview>
      <Div className={row}>
        <Div className={cell}>
          <Div className={specimenSurface} />
          <RoleLabel prop="bg" kind="surface" amount="18%" />
        </Div>
        <Div className={cell}>
          <Div className={specimenLine} />
          <RoleLabel prop="borderColor" kind="line" amount="58%" />
        </Div>
        <Div className={cell}>
          <Span className={specimenText}>Accent label</Span>
          <RoleLabel prop="color" kind="line" amount="58%" />
        </Div>
      </Div>
    </Preview>
  )
}
