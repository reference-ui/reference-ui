import { A, Div, H2, Li, P, Span, Ul } from '@reference-ui/react'

/**
 * Live specimens for the Primitives page. Component-hosted so the style props
 * are statically extracted (inline JSX in MDX is not).
 */

export function PrimitiveCard() {
  return (
    <Div
      display="grid"
      gap="3r"
      padding="4r"
      border="1px solid"
      borderColor="docsBorder"
      borderRadius="lg"
      bg="docsPanelBg"
    >
      <Span color="docsMuted">A primitive can be a layout container.</Span>
      <Span fontWeight="600" color="docsText">
        It still renders a real element.
      </Span>
    </Div>
  )
}

export function PrimitiveContent() {
  return (
    <Div display="grid" gap="2r">
      <H2 margin="0">Primitives work well for prose and UI</H2>
      <P margin="0" color="docsMuted">
        Use semantic tags for the structure you already want. Style props support
        the element, they do not replace it.
      </P>
      <A href="#" color="docsHighlight" textDecoration="underline">
        This is still just a link
      </A>
    </Div>
  )
}

export function PrimitiveList() {
  return (
    <Ul display="grid" gap="1r" paddingLeft="5r">
      <Li>Prefer semantic elements first.</Li>
      <Li>Reach for style props before introducing wrappers.</Li>
      <Li>Extract to `css()` or recipes when repetition shows up.</Li>
      <Li>Keep primitives boring — HTML with superpowers.</Li>
    </Ul>
  )
}
