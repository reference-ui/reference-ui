import * as React from 'react'
import { Tooltip, ReferenceLibrary } from '@reference-ui/lib'

export function TooltipFixture() {
  return (
    <ReferenceLibrary>
      <div data-testid="tooltip-fixture-root">
        <h1>Tooltip Fixture</h1>

        <div style={{ display: 'flex', gap: '24px', margin: '80px 0 24px' }}>
          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-a">
                Button A
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              data-testid="tooltip-content-a"
              placement="top"
              style={{
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
          </Tooltip>

          <Tooltip openDelay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button type="button" data-testid="btn-tooltip-b">
                Button B
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              data-testid="tooltip-content-b"
              placement="top"
              style={{
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
          </Tooltip>
        </div>

        <button type="button" data-testid="btn-outside">
          Outside Control
        </button>
      </div>
    </ReferenceLibrary>
  )
}
