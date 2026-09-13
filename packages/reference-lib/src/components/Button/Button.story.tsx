import * as React from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import { AddIcon, KeyboardArrowDownIcon, SettingsIcon } from '@reference-ui/icons'

export function ButtonStatesFixture() {
  const [clickCount, setClickCount] = React.useState(0)

  return (
    <Div
      data-testid="button-fixture-root"
      p="6r"
      display="flex"
      flexDirection="column"
      gap="6r"
      fontFamily="sans-serif"
      maxW="600px"
    >
      <Div display="flex" flexDirection="column" gap="2r">
        <Span fontSize="3.5r" fontWeight="600" color="design.text.base">
          Button Variants &amp; States
        </Span>
        <Span fontSize="2.5r" color="design.text.light">
          Clicks: <span data-testid="click-counter">{clickCount}</span>
        </Span>
      </Div>

      {/* Row 1: Default / Secondary Variant */}
      <Div display="flex" flexDirection="column" gap="2r">
        <Span fontSize="2.5r" fontWeight="600" color="design.text.light">
          Default Variant
        </Span>
        <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
          <Button
            type="button"
            data-testid="btn-default"
            onClick={() => setClickCount(c => c + 1)}
          >
            Default Button
          </Button>

          <Button
            type="button"
            data-testid="btn-default-disabled"
            disabled
          >
            Default Disabled
          </Button>

          <Button
            type="button"
            data-testid="btn-default-icon-leading"
          >
            <AddIcon />
            <span>Create</span>
          </Button>

          <Button
            type="button"
            data-testid="btn-default-icon-trailing"
          >
            <span>Options</span>
            <KeyboardArrowDownIcon />
          </Button>

          <Button
            type="button"
            data-testid="btn-default-icon-only"
            aria-label="Settings"
          >
            <SettingsIcon />
          </Button>
        </Div>
      </Div>

      {/* Row 2: Primary Variant */}
      <Div display="flex" flexDirection="column" gap="2r">
        <Span fontSize="2.5r" fontWeight="600" color="design.text.light">
          Primary Variant
        </Span>
        <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
          <Button
            type="button"
            variant="primary"
            data-testid="btn-primary"
            onClick={() => setClickCount(c => c + 1)}
          >
            Primary Button
          </Button>

          <Button
            type="button"
            variant="primary"
            data-testid="btn-primary-disabled"
            disabled
          >
            Primary Disabled
          </Button>

          <Button
            type="button"
            variant="primary"
            data-testid="btn-primary-icon-leading"
          >
            <AddIcon />
            <span>Add Item</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            data-testid="btn-primary-icon-only"
            aria-label="Settings"
          >
            <SettingsIcon />
          </Button>
        </Div>
      </Div>

      {/* Row 3: Ghost Variant */}
      <Div display="flex" flexDirection="column" gap="2r">
        <Span fontSize="2.5r" fontWeight="600" color="design.text.light">
          Ghost Variant
        </Span>
        <Div display="flex" alignItems="center" gap="3r" flexWrap="wrap">
          <Button
            type="button"
            variant="ghost"
            data-testid="btn-ghost"
            onClick={() => setClickCount(c => c + 1)}
          >
            Ghost Button
          </Button>

          <Button
            type="button"
            variant="ghost"
            data-testid="btn-ghost-disabled"
            disabled
          >
            Ghost Disabled
          </Button>

          <Button
            type="button"
            variant="ghost"
            data-testid="btn-ghost-icon-leading"
          >
            <AddIcon />
            <span>Ghost Icon</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            data-testid="btn-ghost-icon-only"
            aria-label="Settings"
          >
            <SettingsIcon />
          </Button>
        </Div>
      </Div>
    </Div>
  )
}
