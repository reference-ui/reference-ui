import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import { metaExtend2Bg, metaExtend2Text } from '../tokens'

tokens({
  colors: {
    metaExtend2Bg: { value: metaExtend2Bg },
    metaExtend2Text: { value: metaExtend2Text },
  },
})

export function MetaExtend2Demo(): React.ReactElement {
  return (
    <div
      data-testid="meta-extend-2-demo"
      className={css({
        backgroundColor: 'metaExtend2Bg',
        color: 'metaExtend2Text',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
    >
      <span
        data-testid="meta-extend-2-demo-eyebrow"
        className={css({ color: 'secondaryDemoAccent' })}
      >
        Transitive accent (from extend-library-2)
      </span>
      <span
        data-testid="meta-extend-2-demo-copy"
        className={css({ color: 'metaExtend2Text' })}
      >
        MetaExtend2Demo renders from @fixtures/meta-extend-library-2.
      </span>
    </div>
  )
}
