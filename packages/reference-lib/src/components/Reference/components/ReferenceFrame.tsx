/**
 * Reference frame: the bordered container every reference state renders
 * inside. Takes children only; loading, error, empty, and document views
 * all share this chrome.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'

export function ReferenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <Div
      css={{
        color: 'reference.text',
      }}
    >
      {children}
    </Div>
  )
}
