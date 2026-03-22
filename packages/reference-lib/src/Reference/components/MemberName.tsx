import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText.js'

export function MemberName({ name }: { name: string }) {
  return (
    <Div>
      <MonoText>{name}</MonoText>
    </Div>
  )
}
