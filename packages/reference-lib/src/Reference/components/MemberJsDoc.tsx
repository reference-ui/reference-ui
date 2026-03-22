import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '@reference-ui/types'
import { JsDocParamChip } from './shared/JsDocParamChip.js'
import { MonoText } from './shared/MonoText.js'

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
      css={{
        paddingTop: '0.875rem',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      {paramRows.map((param) => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <JsDocParamChip tagLabel="param" />
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
            <JsDocParamChip tagLabel={tag.name} />
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
