import React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    fixtureDemoBg: { value: '#0f172a' },
    fixtureDemoText: { value: '#f8fafc' },
    fixtureDemoAccent: { value: '#14b8a6' },
  },
})

export function DemoComponent() {
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
      <span
        data-testid="fixture-demo-copy"
        className={css({ color: 'fixtureDemoText' })}
      >
        DemoComponent renders from @fixtures/extend-library.
      </span>
    </div>
  )
}
