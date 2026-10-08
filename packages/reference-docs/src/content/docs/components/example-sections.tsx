import { Button, Div, Input, Label, Span, css } from '@reference-ui/react'

/**
 * Live specimens for the Example page. Component-hosted so the style props are
 * statically extracted (inline JSX in MDX is not).
 */

const badgeBase = css({
  display: 'inline-flex',
  alignItems: 'center',
  height: '6r',
  paddingX: '2.5r',
  borderRadius: 'md',
  fontSize: '0.75rem',
  fontWeight: '500',
  lineHeight: '1',
})

const badgeNeutral = css({
  background: 'docsInlineCodeBg',
  color: 'docsMuted',
})

const badgeSolid = css({
  background: 'docsHighlight',
  color: 'docsPageBg',
})

const badgeOutline = css({
  border: '1px solid',
  borderColor: 'docsBorder',
  color: 'docsText',
})

export function ExampleToolbar() {
  return (
    <Div display="flex" flexWrap="wrap" gap="3r" alignItems="center" justifyContent="center">
      <Button variant="primary">Save changes</Button>
      <Button variant="default">Cancel</Button>
      <Button variant="ghost">Learn more</Button>
    </Div>
  )
}

export function ExampleBadges() {
  return (
    <Div display="flex" flexWrap="wrap" gap="2r" alignItems="center" justifyContent="center">
      <Span className={`${badgeBase} ${badgeNeutral}`}>Neutral</Span>
      <Span className={`${badgeBase} ${badgeSolid}`}>Solid</Span>
      <Span className={`${badgeBase} ${badgeOutline}`}>Outline</Span>
    </Div>
  )
}

export function ExampleField() {
  return (
    <Div display="flex" flexDirection="column" gap="2r" width="100%" maxWidth="22rem">
      <Label htmlFor="docs-example-email">Email</Label>
      <Input id="docs-example-email" placeholder="you@example.com" />
    </Div>
  )
}
