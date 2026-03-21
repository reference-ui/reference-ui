import { Div } from '@reference-ui/react'
import { MonoText } from './shared/MonoText'

export function MemberName({ name }: { name: string }) {
  return (
    <Div paddingTop="reference.xs">
      <MonoText>{name}</MonoText>
    </Div>
  )
}
