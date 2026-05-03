import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import { metaExtendBg, metaExtendText } from '../tokens'

tokens({
  colors: {
    metaExtendBg: { value: metaExtendBg },
    metaExtendText: { value: metaExtendText },
  },
})

/**
 * MetaExtendDemo proves two things at once:
 * 1. Local tokens (metaExtendBg) are visible to consumers that extend this library.
 * 2. Upstream tokens (fixtureDemoAccent — from extend-library) are also visible
 *    here, proving transitive extend.
 */
export function MetaExtendDemo(): React.ReactElement {
  return (
    <div
      data-testid="meta-extend-demo"
      className={css({
        backgroundColor: 'metaExtendBg',
        color: 'metaExtendText',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
    >
      <span
        data-testid="meta-extend-demo-eyebrow"
        className={css({ color: 'fixtureDemoAccent' })}
      >
        Transitive accent (from extend-library)
      </span>
      <span
        data-testid="meta-extend-demo-copy"
        className={css({ color: 'metaExtendText' })}
      >
        MetaExtendDemo renders from @fixtures/meta-extend-library.
      </span>
    </div>
  )
}
