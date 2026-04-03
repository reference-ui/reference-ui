// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/MemberType.tsx
import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div
      //px="1.5r"
      py="0.5r"
      color="blue.300"
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
