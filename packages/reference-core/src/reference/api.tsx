import { Code, Div, H2, P } from '../system/primitives'
import { referenceTokens } from './tokens'

export interface ReferenceApiProps {
  name: string
}

/**
 * Main reference entry component.
 * The first pass stays intentionally simple while the worker/Tasty pipeline lands.
 */
export function API({ name }: ReferenceApiProps) {
  return (
    <Div
      css={{
        color: referenceTokens.color.foreground,
        background: referenceTokens.color.background,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: referenceTokens.color.border,
        padding: referenceTokens.space.lg,
      }}
    >
      <H2 margin="0 0 0.5rem 0" fontSize="1rem">
        API
      </H2>
      <P margin="0" color={referenceTokens.color.muted}>
        Reference docs for <Code fontFamily={referenceTokens.font.mono}>{name}</Code> will
        render here.
      </P>
    </Div>
  )
}
