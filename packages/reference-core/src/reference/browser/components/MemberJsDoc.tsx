import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '../types'
import { MonoText } from './shared/MonoText'
import { SummaryChip } from './shared/SummaryChip'

export function MemberJsDoc({
  memberId,
  jsDoc,
  params,
}: {
  memberId: string
  jsDoc: ReferenceJsDoc
  params: ReferenceParamDoc[]
}) {
  /** Defaults are shown on the type line (value chips); skip duplicate `@default` / `@param default`. */
  const paramRows = params.filter((param) => param.name !== 'default')
  const tags = jsDoc.tags.filter(
    (tag) => tag.name !== 'param' && tag.name !== 'default',
  )
  if (paramRows.length === 0 && tags.length === 0) return null

  return (
    <Div
      display="grid"
      gap="reference.sm"
      position="relative"
      paddingTop="calc(0.875rem + 2px)"
      css={{
        _before: {
          content: '""',
          position: 'absolute',
          insetInline: '0',
          top: '0',
          height: '2px',
          color: 'reference.border',
          backgroundImage:
            'radial-gradient(ellipse 5px 2px at 6px 1px, currentColor 98%, transparent 100%)',
          backgroundSize: '12px 2px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left top',
        },
      }}
    >
      {paramRows.map((param) => (
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
