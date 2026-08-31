import * as React from 'react'
import { RovingFocus } from '@reference-ui/lib'

export function RovingFocusFixture() {
  const [orientation, setOrientation] = React.useState<'horizontal' | 'vertical'>('horizontal')
  const [loop, setLoop] = React.useState(true)
  const [typeahead, setTypeahead] = React.useState(true)

  return (
    <div data-testid="roving-focus-fixture-root">
      <h1>RovingFocus Fixture</h1>

      <button type="button" data-testid="outside-before-btn">
        Outside Before
      </button>

      <section style={{ margin: '16px 0' }}>
        <h2>Toolbar Composite</h2>
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
              border: '1px solid gray',
              padding: '8px',
            }}
          >
            <RovingFocus.Item id="item-apple" textValue="Apple">
              <button type="button" data-testid="item-apple">
                Apple
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-banana" textValue="Banana" disabled>
              <button type="button" data-testid="item-banana" disabled>
                Banana (Disabled)
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-blueberry" textValue="Blueberry">
              <button type="button" data-testid="item-blueberry">
                Blueberry
              </button>
            </RovingFocus.Item>

            <RovingFocus.Item id="item-cherry" textValue="Cherry">
              <button type="button" data-testid="item-cherry">
                Cherry
              </button>
            </RovingFocus.Item>
          </div>
        </RovingFocus.Root>
      </section>

      <button type="button" data-testid="outside-after-btn">
        Outside After
      </button>
    </div>
  )
}
