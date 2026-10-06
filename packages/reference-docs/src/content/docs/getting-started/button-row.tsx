import { Button, Div } from '@reference-ui/react'

/** The live button row from the Get Started page (component-hosted so the
 *  style props are statically extracted — inline JSX in MDX is not). */
export function ButtonRow() {
  return (
    <Div display="flex" gap="3r" alignItems="center" marginBottom="4r">
      <Button variant="primary">Primary</Button>
      <Button variant="default">Default</Button>
      <Button variant="ghost">Ghost</Button>
    </Div>
  )
}
