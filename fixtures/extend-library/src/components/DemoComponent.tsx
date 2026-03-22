import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import { fixtureDemoBg, fixtureDemoText, fixtureDemoAccent } from '../tokens.js'

tokens({
  colors: {
    fixtureDemoBg: { value: fixtureDemoBg },
    fixtureDemoText: { value: fixtureDemoText },
    fixtureDemoAccent: { value: fixtureDemoAccent },
  },
})

export function DemoComponent(): React.ReactElement {
  return (
    <div
      data-testid="fixture-demo"
      className={css({
        backgroundColor: 'fixtureDemoBg',
        color: 'fixtureDemoText',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
    >
      <span
        data-testid="fixture-demo-eyebrow"
        className={css({ color: 'fixtureDemoAccent' })}
      >
        Fixture library component
      </span>
      <span data-testid="fixture-demo-copy" className={css({ color: 'fixtureDemoText' })}>
        DemoComponent renders from @fixtures/extend-library.
      </span>
    </div>
  )
}
