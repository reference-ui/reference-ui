import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div paddingTop="reference.xs">
      <MonoText color="reference.muted">{typeLabel}</MonoText>
    </Div>
  )
}
