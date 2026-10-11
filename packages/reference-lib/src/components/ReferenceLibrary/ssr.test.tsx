import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReferenceLibrary } from './ReferenceLibrary'

describe('ReferenceLibrary server rendering', () => {
  it('RL-ENV-04: SSR emits application children without runtime hosts across repeated requests', () => {
    const children = (
      <main id="library-ssr-app">
        <button type="button" aria-label="Save document">Save</button>
      </main>
    )
    const plain = renderToString(children)
    const omitted = renderToString(<ReferenceLibrary>{children}</ReferenceLibrary>)
    const configured = renderToString(
      <ReferenceLibrary toaster={{ defaultDuration: false, hotkey: false }} tooltip={{ skipDelay: 0 }}>
        {children}
      </ReferenceLibrary>
    )
    const repeated = renderToString(<ReferenceLibrary>{children}</ReferenceLibrary>)

    for (const html of [omitted, configured, repeated]) {
      expect(html).toBe(plain)
      expect(html).toContain('aria-label="Save document"')
      expect(html).not.toContain('data-reference-toast-host')
      expect(html).not.toContain('data-reference-announcer')
      expect(html).not.toContain('aria-live')
    }
  })
})
