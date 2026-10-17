import { Button, Div } from '@reference-ui/react'
import { RovingFocus } from '@reference-ui/lib'

/** A formatting toolbar: one Tab stop, arrow keys move between buttons. */
export function RovingFocusDemo() {
  return (
    <RovingFocus.Root orientation="horizontal" loop>
      <Div role="toolbar" aria-label="Formatting" display="flex" gap="2r">
        <RovingFocus.Item>
          <Button>Bold</Button>
        </RovingFocus.Item>
        <RovingFocus.Item>
          <Button>Italic</Button>
        </RovingFocus.Item>
        <RovingFocus.Item disabled>
          <Button disabled>Underline</Button>
        </RovingFocus.Item>
        <RovingFocus.Item>
          <Button>Strike</Button>
        </RovingFocus.Item>
      </Div>
    </RovingFocus.Root>
  )
}
