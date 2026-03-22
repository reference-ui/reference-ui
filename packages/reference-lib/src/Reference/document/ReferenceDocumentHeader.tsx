import { Div, H2, P, Small } from '@reference-ui/react'
import { formatReferenceTypeParameter, type ReferenceDocument } from '@reference-ui/types'

type TitleRowProps = {
  name: string
  kindLabel: string
}

/** Document symbol name and kind label (e.g. type alias, interface). */
function ReferenceDocumentHeaderTitleRow({ name, kindLabel }: TitleRowProps) {
  return (
    <Div display="flex" flexDir="column" gap="reference.sm" flexWrap="wrap">
      <H2
        margin="0"
        color="reference.foreground"
        fontFamily="reference.sans"
        fontWeight="500"
        fontSize="7r"
      >
        {name}
      </H2>
      <Div
        fontFamily="reference.mono"
        color="reference.foreground"
        fontSize="4r"
        fontWeight="550"
      >
        {kindLabel}
      </Div>
    </Div>
  )
}

type DescriptionProps = {
  description: string
}

/** Optional JSDoc / summary paragraph for the document. */
function ReferenceDocumentHeaderDescription({ description }: DescriptionProps) {
  return (
    <P margin="0" color="reference.foreground">
      {description}
    </P>
  )
}

type GenericsLineProps = {
  typeParameterDetails: ReferenceDocument['typeParameterDetails']
}

/** Renders generic type parameters when present. */
function ReferenceDocumentHeaderGenericsLine({
  typeParameterDetails,
}: GenericsLineProps) {
  return (
    <Small color="reference.foreground">
      Generics: {typeParameterDetails.map(formatReferenceTypeParameter).join(', ')}
    </Small>
  )
}

type ExtendsLineProps = {
  extendsNames: string[]
}

/** Renders base types / extends clause when present. */
function ReferenceDocumentHeaderExtendsLine({ extendsNames }: ExtendsLineProps) {
  return <Small color="reference.foreground">Extends: {extendsNames.join(', ')}</Small>
}

export function ReferenceDocumentHeader({ document }: { document: ReferenceDocument }) {
  return (
    <Div display="grid" gap="reference.sm">
      <ReferenceDocumentHeaderTitleRow
        name={document.name}
        kindLabel={document.kindLabel}
      />
      {document.description ? (
        <ReferenceDocumentHeaderDescription description={document.description} />
      ) : null}
      {document.typeParameterDetails.length > 0 ? (
        <ReferenceDocumentHeaderGenericsLine
          typeParameterDetails={document.typeParameterDetails}
        />
      ) : null}
      {document.extendsNames.length > 0 ? (
        <ReferenceDocumentHeaderExtendsLine extendsNames={document.extendsNames} />
      ) : null}
    </Div>
  )
}
