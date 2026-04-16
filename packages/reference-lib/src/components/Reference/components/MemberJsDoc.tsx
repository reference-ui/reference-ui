import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '@reference-ui/types'
import { JsDocParamChip } from './shared/JsDocParamChip'
import { MonoText } from './shared/MonoText'

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
  const paramRows = params.filter(param => param.name !== 'default')
  const tags = jsDoc.tags.filter(tag => tag.name !== 'param' && tag.name !== 'default')
  if (paramRows.length === 0 && tags.length === 0) return null

  return (
    <Div
      display="grid"
      gap="2r"
      position="relative"
      paddingTop="calc(0.875rem + 2px)"
    >
      <Div mb="2r" height="1r" background="reference.text" width="6r" />
      {paramRows.map(param => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="0.5r">
          <Div display="flex" alignItems="center" flexWrap="wrap" gap="2r">
            <JsDocParamChip tagLabel="param" />
            <Div
              fontFamily="reference.mono"
              fontSize="4r"
              fontWeight="550"
              color="reference.text"
            >
              {param.name}
            </Div>
            {param.optional ? <Small color="reference.textLight">optional</Small> : null}

            {param.description && (
              <P margin="0" color="reference.textLighter">
                {param.description}
              </P>
            )}
          </Div>
        </Div>
      ))}

      {tags.map((tag, index) => (
        <Div key={`${memberId}-${tag.name}-${index}`} display="grid" gap="0.5r">
          <Div display="flex" alignItems="center" gap="1r" flexWrap="wrap">
            <JsDocParamChip tagLabel={tag.name} />
            {tag.value ? (
              <P margin="0" color="reference.textLighter">
                {tag.value}
              </P>
            ) : null}
          </Div>
        </Div>
      ))}
    </Div>
  )
}
