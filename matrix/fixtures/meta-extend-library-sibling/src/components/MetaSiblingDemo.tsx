/**
 * Meta-sibling demo component. Registers the disjoint `metaSibling*` tokens
 * and renders them alongside the shared base's `fixtureDemoAccent`, proving
 * both diamond siblings contributed without clashing (T7, T12).
 */
import * as React from 'react'
import { css } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'
import { metaSiblingBg, metaSiblingText } from '../tokens'

tokens({
  colors: {
    metaSiblingBg: { value: metaSiblingBg },
    metaSiblingText: { value: metaSiblingText },
  },
})

export function MetaSiblingDemo(): React.ReactElement {
  return (
    <div
      data-testid="meta-sibling-demo"
      className={css({
        backgroundColor: 'metaSiblingBg',
        color: 'metaSiblingText',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
    >
      <span
        data-testid="meta-sibling-demo-eyebrow"
        className={css({ color: 'fixtureDemoAccent' })}
      >
        Sibling accent (from extend-library)
      </span>
      <span
        data-testid="meta-sibling-demo-copy"
        className={css({ color: 'metaSiblingText' })}
      >
        MetaSiblingDemo renders from @fixtures/meta-extend-library-sibling.
      </span>
    </div>
  )
}
