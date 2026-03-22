import { Div, H2, P, Small } from '@reference-ui/react'
import { formatReferenceTypeParameter, type ReferenceDocument } from '@reference-ui/types'

export function ReferenceDocumentHeader({ document }: { document: ReferenceDocument }) {
  return (
    <Div display="grid" gap="reference.sm">
      <Div display="flex" alignItems="center" gap="reference.sm" flexWrap="wrap">
        <H2 margin="0" fontSize="1rem" color="reference.foreground">
          <Div fontFamily="reference.mono" fontSize="5r">
            {document.name}
          </Div>
        </H2>
        <Small color="reference.foreground">{document.kindLabel}</Small>
      </Div>
      {document.description ? (
        <P margin="0" color="reference.foreground">
          {document.description}
        </P>
      ) : null}
      {document.typeParameterDetails.length > 0 ? (
        <Small color="reference.foreground">
          Generics:{' '}
          {document.typeParameterDetails.map(formatReferenceTypeParameter).join(', ')}
        </Small>
      ) : null}
      {document.extendsNames.length > 0 ? (
        <Small color="reference.foreground">Extends: {document.extendsNames.join(', ')}</Small>
      ) : null}
    </Div>
  )
}
