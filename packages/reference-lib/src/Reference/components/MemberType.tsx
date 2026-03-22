import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText.js'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div
      //px="1.5r"
      py="0.5r"
      color="gray.100"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.mono"
    >
      {typeLabel}
    </Div>
  )
}
