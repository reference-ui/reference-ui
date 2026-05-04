import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import {
  fixtureDemoAccent,
  fixtureDemoBg,
  fixtureDemoPrivateBrand,
  fixtureDemoText,
} from '../tokens'

tokens({
  colors: {
    fixtureDemoBg: { value: fixtureDemoBg },
    fixtureDemoText: { value: fixtureDemoText },
    fixtureDemoAccent: { value: fixtureDemoAccent },
    /**
     * Private token branch. Resolves locally for this component but is
     * stripped from any downstream consumer that extends extend-library.
     */
    _private: {
      brand: { value: fixtureDemoPrivateBrand },
    },
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
      <span
        data-testid="fixture-demo-private"
        className={css({
          color: '_private.brand',
          borderColor: '_private.brand',
          borderStyle: 'solid',
          borderWidth: '2px',
          padding: '4px',
        })}
      >
        Private token swatch (extend-library local resolution).
      </span>
    </div>
  )
}
