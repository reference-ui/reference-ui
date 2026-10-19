// Section specimens for the System primitives page.
// They take nothing and emit the primitive card specimens. Colocated with the page that
// embeds them.
import { A, Div, H3, P } from '@reference-ui/react'

/**
 * Live specimen for the System > Primitives page: a card built from three
 * primitives with style props only. Kept in a component, not inline in MDX,
 * so the compiler reads its style props.
 */
export function PrimitiveCard() {
  return (
    <Div
      display="grid"
      gap="2r"
      padding="5r"
      maxWidth="80r"
      borderRadius="md"
      bg="docsPageBg"
      _hover={{ bg: 'docsHoverBg' }}
    >
      <H3 margin="0" fontSize="4.5r" color="docsText">
        A card
      </H3>
      <P margin="0" color="docsMuted">
        A Div, an H3, a P and an A. Each renders its own HTML element.
      </P>
      <A href="#primitive-props" color="docsHighlight" textDecoration="underline">
        Read the props
      </A>
    </Div>
  )
}
