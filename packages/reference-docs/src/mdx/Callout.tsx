// Info and warning callouts for MDX pages.
// They take children (and an optional title) and emit a quiet aside: a tone icon beside the
// text on a faint tint of the same tone. Info is blue, Warn is amber; the hue carries meaning.
import type { ComponentType, ReactNode } from 'react'
import { Aside, Div, css } from '@reference-ui/react'
import { InfoIcon, WarningIcon } from '@reference-ui/lib'

/**
 * `<Info>` for context worth knowing, `<Warn>` for a limit that bites. Both
 * sit in the reading column with the body's type; the tint and icon are the
 * only signal, so the page stays calm.
 */

const frame = css({
  display: 'flex',
  gap: '3r',
  padding: '4r',
  marginY: '5r',
  borderRadius: 'md',
  fontSize: '3.75r',
  lineHeight: '1.6',
  color: 'docsBody',
  '& p': { margin: '0', fontSize: 'inherit', lineHeight: 'inherit' },
  '& p + p': { marginTop: '2r' },
})

const icon = css({ flexShrink: '0', display: 'inline-flex', paddingTop: '0.5r' })

const title = css({ weight: 'sans.semibold', color: 'docsText', marginBottom: '1r' })

type Tone = 'info' | 'warn'

const toneFrame: Record<Tone, string> = {
  info: css({ bg: 'blue.500/ghost' }),
  warn: css({ bg: 'amber.500/ghost' }),
}

const toneIcon: Record<Tone, string> = {
  info: css({ color: 'blue.700', _dark: { color: 'blue.300' } }),
  warn: css({ color: 'amber.700', _dark: { color: 'amber.300' } }),
}

const toneGlyph: Record<Tone, ComponentType<{ size?: string }>> = {
  info: InfoIcon,
  warn: WarningIcon,
}

type CalloutProps = { title?: ReactNode; children: ReactNode }

function Callout({ tone, title: heading, children }: CalloutProps & { tone: Tone }) {
  const Glyph = toneGlyph[tone]
  return (
    <Aside className={`${frame} ${toneFrame[tone]}`}>
      <Div className={`${icon} ${toneIcon[tone]}`} aria-hidden="true">
        <Glyph size="5r" />
      </Div>
      <Div minWidth="0">
        {heading ? <Div className={title}>{heading}</Div> : null}
        {children}
      </Div>
    </Aside>
  )
}

export function Info(props: CalloutProps) {
  return <Callout tone="info" {...props} />
}

export function Warn(props: CalloutProps) {
  return <Callout tone="warn" {...props} />
}
