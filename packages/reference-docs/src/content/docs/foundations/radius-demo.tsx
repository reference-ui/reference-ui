// Radius scale specimen for the Foundations radius page.
// It takes nothing and emits the radius ramp. Colocated with the page that embeds it.
import type { ReactNode } from 'react'
import { Div, Span, css } from '@reference-ui/react'
import { Preview } from '../../../mdx/Preview'

/**
 * Radius specimens for the Radius page: one tile per lib radius token, with
 * its name and value. Every `borderRadius` is written out literally, because
 * the compiler only extracts static values.
 */

const box = css({
  width: '16r',
  height: '16r',
  bg: 'blue.500/medium',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'blue.500/medium',
})

function Tile({ name, value, children }: { name: string; value: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="2r" flex="1 1 6rem">
      {children}
      <Span fontFamily="mono" fontSize="3.5r" color="docsText">
        {name}
      </Span>
      <Span fontFamily="mono" fontSize="3r" color="docsMuted">
        {value}
      </Span>
    </Div>
  )
}

/** The four radii side by side. */
export function RadiusScale() {
  return (
    <Preview>
      <Div display="flex" flexWrap="wrap" gap="4r" width="100%">
        <Tile name="sm" value="0.27rem">
          <Div className={box} borderRadius="sm" />
        </Tile>
        <Tile name="md" value="0.4rem">
          <Div className={box} borderRadius="md" />
        </Tile>
        <Tile name="lg" value="0.6rem">
          <Div className={box} borderRadius="lg" />
        </Tile>
        <Tile name="full" value="9999px">
          <Div className={box} borderRadius="full" />
        </Tile>
      </Div>
    </Preview>
  )
}
