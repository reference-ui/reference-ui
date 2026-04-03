// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/MemberJsDoc.tsx
import { Div, P, Small } from '@reference-ui/react'
import type { ReferenceJsDoc, ReferenceParamDoc } from '../types'
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
      gap="reference.sm"
      position="relative"
      paddingTop="calc(0.875rem + 2px)"
      // css={{
      //   _before: {
      //     content: '""',
      //     position: 'absolute',
      //     insetInline: '0',
      //     top: '0',
      //     height: '2px',
      //     color: 'gray.800',
      //     backgroundImage:
      //       'radial-gradient(ellipse 5px 2px at 6px 1px, currentColor 98%, transparent 100%)',
      //     backgroundSize: '12px 2px',
      //     backgroundRepeat: 'repeat-x',
      //     backgroundPosition: 'left top',
      //   },
      // }}
    >
      <Div mb="2r" height="1r" background="reference.foreground" width="6r" />
      {paramRows.map(param => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" flexWrap="wrap" gap="2r">
            <JsDocParamChip tagLabel="param" />
            <Div fontFamily="reference.mono" fontSize="4r" fontWeight="550">
              {param.name}
            </Div>
            {param.optional ? <Small color="reference.muted">optional</Small> : null}

            {param.description && (
              <P margin="0" color="gray.400">
                {param.description}
              </P>
            )}
          </Div>
        </Div>
      ))}

      {tags.map((tag, index) => (
        <Div key={`${memberId}-${tag.name}-${index}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <JsDocParamChip tagLabel={tag.name} />
            {tag.value ? (
              <P margin="0" color="reference.foreground">
                {tag.value}
              </P>
            ) : null}
          </Div>
        </Div>
      ))}
    </Div>
  )
}
