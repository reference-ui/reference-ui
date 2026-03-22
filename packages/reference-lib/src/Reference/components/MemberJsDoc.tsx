import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '@reference-ui/types'
import { MonoText } from './shared/MonoText.js'
import { SummaryChip } from './shared/SummaryChip.js'

export function MemberJsDoc({
  memberId,
  jsDoc,
  params,
}: {
  memberId: string
  jsDoc: ReferenceJsDoc
  params: ReferenceParamDoc[]
}) {
  const tags = jsDoc.tags.filter((tag) => tag.name !== 'param')
  if (params.length === 0 && tags.length === 0) return null

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
            <SummaryChip>
              <MonoText>@param</MonoText>
            </SummaryChip>
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

      {tags.map((tag, index) => (
        <Div key={`${memberId}-${tag.name}-${index}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <SummaryChip>
              <MonoText>@{tag.name}</MonoText>
            </SummaryChip>
          </Div>
          {tag.value ? (
            <P margin="0" color="reference.muted">
              {tag.value}
            </P>
          ) : null}
        </Div>
      ))}
    </Div>
  )
}
