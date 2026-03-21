import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceParamDoc } from '../types'
import { MonoText } from './shared/MonoText'

export function MemberJsDoc({ memberId, params }: { memberId: string; params: ReferenceParamDoc[] }) {
  if (params.length === 0) return null

  return (
    <Div
      display="grid"
      gap="reference.sm"
      css={{
        paddingTop: '0.875rem',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      {params.map((param) => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <Small color="reference.muted">Param</Small>
            <MonoText>{param.name}</MonoText>
            {param.type ? (
              <Small color="reference.muted">
                <MonoText>{param.type}</MonoText>
              </Small>
            ) : null}
            {param.optional ? <Small color="reference.muted">optional</Small> : null}
          </Div>
          {param.description ? (
            <P margin="0" color="reference.muted">
              {param.description}
            </P>
          ) : null}
        </Div>
      ))}
    </Div>
  )
}
