import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText.js'

export function MemberType({ typeLabel }: { typeLabel: string }) {
  return (
    <Div>
      <MonoText color="reference.muted">{typeLabel}</MonoText>
    </Div>
  )
}
