import { Div, Span, css } from '@reference-ui/react'
import { Preview } from '../../../mdx/Preview'

/**
 * Colour specimens for the Colour page, built from real tones. Every value is a
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

const label = css({ fontFamily: 'mono', fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const toneName = css({
  fontFamily: 'mono',
  fontSize: 'sm',
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

const caseGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '6r',
  r: { 640: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
})

const caseColumn = css({ display: 'flex', flexDirection: 'column', gap: '3r', minWidth: '0' })

/* No border colour here: every case class owns its own borderColor, so two
 * classes never fight over the same property. */
const caseBox = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  gap: '1r',
  minHeight: '16r',
  padding: '4r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
})

const surfaceCase = css({ bg: 'blue.500/medium', borderColor: 'blue.500/medium' })

const selectedCase = css({ bg: 'blue.500/strong', borderColor: 'blue.500/strong' })

const edgeCase = css({ borderColor: 'blue.500/strong' })

const graphBox = css({
  padding: '3r',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'docsBorder',
  minHeight: '16r',
})

const graphArea = css({ fill: 'blue.500/medium' })

const graphEdge = css({ stroke: 'blue.500', fill: 'none', strokeWidth: '2px' })

const caseTitle = css({ fontSize: '4r', fontWeight: '600', color: 'docsText', lineHeight: '1.3' })

const caseSub = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const meterTrack = css({ height: '2r', borderRadius: 'full', bg: 'blue.500/firm' })

const meterFill = css({ height: '2r', width: '62%', borderRadius: 'full', bg: 'blue.500' })

/** Four jobs for one blue: a surface, a selection, a data fill and an accent edge. */
export function RoleCases() {
  return (
    <Div className={caseGrid}>
      <Div className={caseColumn}>
        <Span className={eyebrow}>Surface · medium</Span>
        <Div className={`${caseBox} ${surfaceCase}`}>
          <Span className={caseTitle}>Filter</Span>
          <Span className={caseSub}>Low-pass · 24 dB</Span>
        </Div>
      </Div>
      <Div className={caseColumn}>
        <Span className={eyebrow}>Selected · strong</Span>
        <Div className={`${caseBox} ${selectedCase}`}>
          <Span className={caseTitle}>Filter</Span>
          <Span className={caseSub}>Active module</Span>
        </Div>
      </Div>
      <Div className={caseColumn}>
        <Span className={eyebrow}>Graph fill · medium</Span>
        <Div className={graphBox}>
          <svg viewBox="0 0 240 96" width="100%" height="96" aria-hidden="true" focusable="false">
            <path
              className={graphArea}
              d="M0 78 Q60 78 100 42 T200 22 L240 30 L240 96 L0 96 Z"
            />
            <path className={graphEdge} d="M0 78 Q60 78 100 42 T200 22 L240 30" />
          </svg>
        </Div>
      </Div>
      <Div className={caseColumn}>
        <Span className={eyebrow}>Accent edge · strong</Span>
        <Div className={`${caseBox} ${edgeCase}`}>
          <Span className={caseTitle}>Output</Span>
          <Div className={meterTrack}>
            <Div className={meterFill} />
          </Div>
          <Span className={caseSub}>−6 dB</Span>
        </Div>
      </Div>
    </Div>
  )
}
