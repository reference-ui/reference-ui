import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberName({ name }: { name: string }) {
  return (
    <Div
      py="0.5r"
      color="reference.text"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.mono"
      fontWeight="550"
      fontSize="4.5r"
    >
      {name}
    </Div>
  )
}
