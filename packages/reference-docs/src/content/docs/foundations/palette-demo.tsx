// Palette swatch grid for the Foundations color page.
// It takes a palette group and emits its swatches. Colocated with the page that embeds it.
import { Div, H3, Span } from '@reference-ui/react'
import { colors } from '@reference-ui/lib/theme'

/**
 * Palette reference: every color ramp in lib and its steps, split into neutrals and
 * hues. Swatches paint the shipped value through an inline background, because
 * the values are data, not authored styles. The semantic `text` group holds
 * references to other steps rather than color values, so it is not a ramp and
 * is left out here.
 */
type Scale = Record<string, { value: string }>
type Family = [name: string, scale: Scale]
type Group = 'neutrals' | 'hues'

const NEUTRALS = ['slate', 'gray']
const FAMILIES = Object.entries(colors as unknown as Record<string, Scale>).filter(
  ([name]) => name !== 'text'
) as Family[]

function inGroup(name: string, group: Group): boolean {
  return group === 'neutrals' ? NEUTRALS.includes(name) : !NEUTRALS.includes(name)
}

function RampRow({ name, scale }: { name: string; scale: Scale }) {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
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
  )
}

/** One group of ramps: `neutrals` (slate, gray) or `hues` (every other family). */
export function PaletteDemo({ group }: { group: Group }) {
  const families = FAMILIES.filter(([name]) => inGroup(name, group))

  return (
    <Div display="flex" flexDirection="column" gap="8r">
      {families.map(([name, scale]) => (
        <RampRow key={name} name={name} scale={scale} />
      ))}
    </Div>
  )
}
