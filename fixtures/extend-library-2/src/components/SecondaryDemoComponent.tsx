import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import { secondaryDemoBg, secondaryDemoText, secondaryDemoAccent } from '../tokens'

tokens({
  colors: {
    secondaryDemoBg: { value: secondaryDemoBg },
    secondaryDemoText: { value: secondaryDemoText },
    secondaryDemoAccent: { value: secondaryDemoAccent },
  },
})

export function SecondaryDemoComponent(): React.ReactElement {
  return (
    <div
      data-testid="secondary-demo"
      className={css({
        backgroundColor: 'secondaryDemoBg',
        color: 'secondaryDemoText',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
    >
      <span
        data-testid="secondary-demo-eyebrow"
        className={css({ color: 'secondaryDemoAccent' })}
      >
        Secondary fixture component
      </span>
      <span
        data-testid="secondary-demo-copy"
        className={css({ color: 'secondaryDemoText' })}
      >
        SecondaryDemoComponent renders from @fixtures/extend-library-2.
      </span>
    </div>
  )
}
