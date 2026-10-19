import { type ReactNode, useState } from 'react'
import { Button, Div, Span, css } from '@reference-ui/react'
import { Preview } from '../../../mdx/Preview'

/**
 * Live specimens for the Motion page, each running one of lib's animation
 * tokens. Looping presets run continuously; the one-shot presets remount on
 * Replay so they can run again. Animation values are written out literally,
 * because the compiler only extracts static values.
 */

const dot = css({ width: '8r', height: '8r', borderRadius: 'sm', bg: 'blue.500' })

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r" padding="3r">
      <Div display="flex" alignItems="center" justifyContent="center" height="14r">
        {children}
      </Div>
      <Span fontFamily="mono" fontSize="3.5r" color="docsMuted">
        {label}
      </Span>
    </Div>
  )
}

/** Looping presets: they run until the element goes away. */
export function LoopingPresets() {
  return (
    <Preview>
      <Div display="flex" flexWrap="wrap" justifyContent="center" gap="4r">
        <Tile label="spin.slow">
          <Div className={dot} animation="spin.slow" />
        </Tile>
        <Tile label="pulse.normal">
          <Div className={dot} animation="pulse.normal" />
        </Tile>
        <Tile label="bounce.normal">
          <Div className={dot} animation="bounce.normal" />
        </Tile>
        <Tile label="ping.normal">
          <Div className={dot} animation="ping.normal" />
        </Tile>
      </Div>
    </Preview>
  )
}

/** One-shot presets: they run once when the element renders. */
export function EntrancePresets() {
  const [replay, setReplay] = useState(0)

  return (
    <Preview>
      <Div display="flex" flexWrap="wrap" alignItems="center" justifyContent="center" gap="4r">
        <Tile label="fadeIn.normal">
          <Div key={replay} className={dot} animation="fadeIn.normal" />
        </Tile>
        <Tile label="scaleIn.normal">
          <Div key={replay} className={dot} animation="scaleIn.normal" />
        </Tile>
        <Tile label="slideDown.normal">
          <Div key={replay} className={dot} animation="slideDown.normal" />
        </Tile>
        <Button type="button" onClick={() => setReplay(value => value + 1)}>
          Replay
        </Button>
      </Div>
    </Preview>
  )
}
