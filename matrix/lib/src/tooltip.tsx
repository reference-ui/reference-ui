import * as React from 'react'
import { Tooltip, ReferenceLibrary } from '@reference-ui/lib'

export function TooltipFixture() {
  return (
    <ReferenceLibrary>
      <div data-testid="tooltip-fixture-root">
        <h1>Tooltip Fixture</h1>

        <div style={{ display: 'flex', gap: '24px', margin: '24px 0' }}>
          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-a">
                Button A
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                data-testid="tooltip-content-a"
                style={{
                  position: 'fixed',
                  top: '100px',
                  left: '50px',
                  background: '#333',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  zIndex: 1000,
                }}
              >
                Help text for Button A
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip>

          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-b">
                Button B
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                data-testid="tooltip-content-b"
                style={{
                  position: 'fixed',
                  top: '100px',
                  left: '200px',
                  background: '#333',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  zIndex: 1000,
                }}
              >
                Help text for Button B
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip>
        </div>

        <button type="button" data-testid="btn-outside">
          Outside Control
        </button>
      </div>
    </ReferenceLibrary>
  )
}
