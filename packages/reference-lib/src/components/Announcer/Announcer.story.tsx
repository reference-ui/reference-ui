import * as React from 'react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { announce } from './index'

/**
 * Manual + AT verification fixture for the invisible announcer runtime
 * (FEATURES.md #1). The live regions themselves are visually hidden; the
 * readout below mirrors their textContent via MutationObserver, so every
 * click proves an AT-observable insertion happened.
 */
export function AnnouncerFixture() {
  const [politeMirror, setPoliteMirror] = React.useState('')
  const [assertiveMirror, setAssertiveMirror] = React.useState('')
  const [mutations, setMutations] = React.useState(0)
  const politeCount = React.useRef(0)
  const assertiveCount = React.useRef(0)

  React.useEffect(() => {
    let observer: MutationObserver | null = null
    let cancelled = false

    const sync = (polite: Element | null, assertive: Element | null) => {
      setPoliteMirror(polite?.textContent ?? '')
      setAssertiveMirror(assertive?.textContent ?? '')
    }

    const attach = () => {
      if (cancelled) return
      const polite = document.querySelector('[data-reference-announcer="polite"]')
      const assertive = document.querySelector('[data-reference-announcer="assertive"]')
      if (!polite || !assertive) {
        requestAnimationFrame(attach)
        return
      }
      sync(polite, assertive)
      observer = new MutationObserver(records => {
        setMutations(count => count + records.length)
        sync(polite, assertive)
      })
      observer.observe(polite, { childList: true, characterData: true, subtree: true })
      observer.observe(assertive, { childList: true, characterData: true, subtree: true })
    }
    attach()

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  return (
    <ReferenceLibrary>
      <div
        data-testid="announcer-fixture-root"
        style={{
          padding: '24px',
          fontFamily: 'sans-serif',
          maxWidth: '560px',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Announcer</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
          The polite/assertive live regions are visually hidden. Click to
          announce, then confirm the readout mirror and (with a screen reader)
          the spoken message.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            data-testid="btn-announce-polite"
            onClick={() => {
              politeCount.current += 1
              announce(`Polite message #${politeCount.current}`, { politeness: 'polite' })
            }}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Announce Polite
          </button>
          <button
            type="button"
            data-testid="btn-announce-assertive"
            onClick={() => {
              assertiveCount.current += 1
              announce(`Assertive message #${assertiveCount.current}`, { politeness: 'assertive' })
            }}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Announce Assertive
          </button>
        </div>

        <dl style={{ margin: 0, fontSize: '13px', display: 'grid', gap: '4px' }}>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Polite region: </dt>
            <dd data-testid="readout-polite" style={{ display: 'inline', margin: 0 }}>
              {politeMirror === '' ? '(empty)' : politeMirror}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Assertive region: </dt>
            <dd data-testid="readout-assertive" style={{ display: 'inline', margin: 0 }}>
              {assertiveMirror === '' ? '(empty)' : assertiveMirror}
            </dd>
          </div>
          <div>
            <dt style={{ display: 'inline', fontWeight: 600 }}>Observed mutations: </dt>
            <dd data-testid="readout-mutations" style={{ display: 'inline', margin: 0 }}>
              {mutations}
            </dd>
          </div>
        </dl>
      </div>
    </ReferenceLibrary>
  )
}
