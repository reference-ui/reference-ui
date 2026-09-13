import * as React from 'react'
import { RovingFocus } from './RovingFocus'

export function RovingFocusFixture() {
  const [orientation, setOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal')
  const [loop, setLoop] = React.useState(true)
  const [typeahead, setTypeahead] = React.useState(true)

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    fontSize: '14px',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
    background: '#f1f5f9',
  }

  return (
    <div
      data-testid="roving-focus-fixture-root"
      style={{
        padding: '24px',
        fontFamily: 'sans-serif',
        maxWidth: '700px',
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>RovingFocus Fixture</h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          data-testid="outside-before-btn"
          style={buttonStyle}
        >
          Outside Before
        </button>
      </div>

      <section style={{ margin: '16px 0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Toolbar Composite</h3>
        <RovingFocus.Root
          orientation={orientation}
          loop={loop}
          typeahead={typeahead}
        >
          <div
            role="toolbar"
            data-testid="toolbar-composite"
            style={{
              display: 'flex',
              gap: '8px',
              border: '1px solid #94a3b8',
              borderRadius: '6px',
              padding: '12px',
              background: '#f8fafc',
            }}
          >
            <RovingFocus.Item id="item-apple" textValue="Apple">
              <button
                type="button"
                data-testid="item-apple"
                style={buttonStyle}
              >
                Apple
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-banana" textValue="Banana" disabled>
              <button
                type="button"
                data-testid="item-banana"
                disabled
                style={disabledButtonStyle}
              >
                Banana (Disabled)
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-blueberry" textValue="Blueberry">
              <button
                type="button"
                data-testid="item-blueberry"
                style={buttonStyle}
              >
                Blueberry
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-cherry" textValue="Cherry">
              <button
                type="button"
                data-testid="item-cherry"
                style={buttonStyle}
              >
                Cherry
              </button>
            </RovingFocus.Item>
          </div>
        </RovingFocus.Root>
      </section>

      <div>
        <button
          type="button"
          data-testid="outside-after-btn"
          style={buttonStyle}
        >
          Outside After
        </button>
      </div>
    </div>
  )
}
