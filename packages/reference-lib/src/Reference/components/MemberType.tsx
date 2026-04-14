import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div
      //px="1.5r"
      py="0.5r"
      color="reference.highlight"
      borderRadius="1r"
      display="inline-flex"
      width="fit-content"
      fontFamily="reference.sans"
      fontWeight="550"
      mb="2r"
    >
      {typeLabel}
    </Div>
  )
}
