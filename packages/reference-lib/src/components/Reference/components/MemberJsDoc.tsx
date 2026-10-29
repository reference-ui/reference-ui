/**
 * Member JSDoc block: renders tags, params, and returns for one member.
 * Takes the parsed JSDoc payload; pure chrome over the member row.
 */
import * as React from 'react'
import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '@reference-ui/types'
import { JsDocParamChip } from './shared/JsDocParamChip'
import { InlineCode } from './shared/InlineCode'

export function MemberJsDoc({
  memberId,
  jsDoc,
  params,
}: {
  memberId: string
  jsDoc: ReferenceJsDoc
  params: ReferenceParamDoc[]
}) {
  /**
   * Defaults have their own labelled line; skip duplicate `@default` / `@param default`.
   * Params without a description add nothing over the signature, so they are dropped.
   */
  const paramRows = params.filter(param => param.name !== 'default' && Boolean(param.description))
  const tags = jsDoc.tags.filter(tag => tag.name !== 'param' && tag.name !== 'default')
  if (paramRows.length === 0 && tags.length === 0) return null

  return (
    <Div display="grid" gap="1.5r">
      {paramRows.map(param => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="0.5r">
          <Div display="flex" alignItems="center" flexWrap="wrap" gap="2r">
            <JsDocParamChip tagLabel="param" />
            <Div
              fontFamily="reference.mono"
              fontSize="4r"
              weight="mono.semibold"
              color="reference.text"
            >
              {param.name}
            </Div>
            {param.optional ? <Small color="reference.textLight">optional</Small> : null}

            {param.description && (
              <P margin="0" color="reference.textLighter">
                <InlineCode text={param.description ?? ''} />
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
                <InlineCode text={tag.value} />
              </P>
            ) : null}
          </Div>
        </Div>
      ))}
    </Div>
  )
}
