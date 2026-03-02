import { Div } from '@reference-ui/react'

/**
 * Core system style props test: Div with custom tokens + inline values.
 * Use case: reference-ui primitives only, custom tokens via tokens().
 * Verifies borders, radii, colors resolve and render correctly.
 */
export default function StylePropsTest() {
  return (
    <div id="style-props-test" data-testid="style-props-test">
      {/* 1. Custom tokens: color, bg, padding, borderRadius, borderWidth */}
      <Div
        data-testid="style-props-tokens"
        color="test.primary"
        backgroundColor="test.muted"
        padding="test-md"
        borderRadius="test-round"
        borderWidth="test-1"
        borderStyle="solid"
        borderColor="test.primary"
      >
        Tokens: color, bg, padding, radii, border
      </Div>

      {/* 2. Inline / on-the-fly colors */}
      <Div
        data-testid="style-props-inline-color"
        color="#dc2626"
        backgroundColor="#fef3c7"
        padding="0.75rem"
      >
        Inline: hex color and bg
      </Div>

      {/* 3. Inline border shorthand */}
      <Div
        data-testid="style-props-inline-border"
        border="3px solid #16a34a"
        borderRadius="8px"
        padding="1rem"
      >
        Inline: border shorthand + radius
      </Div>

      {/* 4. Inline border shorthand with shorthand hex (#123 → #112233) */}
      <Div
        data-testid="style-props-border-shorthand-hex"
        border="1px solid #123"
      >
        Inline: 1px solid #123
      </Div>

      {/* 5. Mix: token radius + inline border color */}
      <Div
        data-testid="style-props-mixed"
        borderRadius="test-round"
        borderWidth="2px"
        borderStyle="solid"
        borderColor="#7c3aed"
        padding="test-sm"
      >
        Mixed: token radius + inline border
      </Div>
    </div>
  )
}
