import { Div, H3, Span } from '@reference-ui/react'
import { colors } from '@reference-ui/lib/theme'

/**
 * Full palette reference: every color scale and shade with its swatch and token
 * path. Values come straight from the shipped theme, rendered via inline
 * background because they are data, not authored styles.
 */
type Scale = Record<string, { value: string }>

export function ColorsDemo() {
  const palettes = Object.entries(colors as unknown as Record<string, Scale>)

  return (
    <Div display="flex" flexDirection="column" gap="8r">
      {palettes.map(([name, scale]) => (
        <Div key={name} display="flex" flexDirection="column" gap="3r">
          <H3 margin="0" fontSize="5r" textTransform="capitalize" color="docsText">
            {name}
          </H3>
          <Div
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))"
            gap="2r"
          >
            {Object.entries(scale).map(([shade, { value }]) => (
              <Div
                key={shade}
                display="flex"
                flexDirection="column"
                border="1px solid"
                borderColor="docsBorder"
                borderRadius="md"
                overflow="hidden"
              >
                <Div height="10r" style={{ backgroundColor: value }} />
                <Span
                  fontSize="0.75rem"
                  fontFamily="mono"
                  color="docsMuted"
                  paddingX="2r"
                  paddingY="1r"
                >
                  {name}.{shade}
                </Span>
              </Div>
            ))}
          </Div>
        </Div>
      ))}
    </Div>
  )
}
