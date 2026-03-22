import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText.js'

export function MemberName({ name }: { name: string }) {
  return (
    <Div
      p="1r"
      backgroundColor="reference.subtleBackground"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
    >
      {name}
    </Div>
  )
}
