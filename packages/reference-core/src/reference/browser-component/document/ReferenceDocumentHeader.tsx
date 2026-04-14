// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/document/ReferenceDocumentHeader.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div, H2, P } from '@reference-ui/react'
import { formatReferenceTypeParameter, type ReferenceDocument } from '../../browser/component-api'
import { MonoText } from '../components/shared/MonoText'

type TitleRowProps = {
  name: string
  kindLabel: string
}

/** Document symbol name and kind label (e.g. type alias, interface). */
function ReferenceDocumentHeaderTitleRow({ name, kindLabel }: TitleRowProps) {
  return (
    <Div display="flex" flexDir="column" gap="2r" flexWrap="wrap" mb="4r">
      <H2
        margin="0"
        color="reference.text"
        fontFamily="reference.sans"
        fontWeight="500"
        fontSize="8r"
      >
        {name}
      </H2>
      <Div
        fontFamily="reference.mono"
        color="reference.text"
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
    <P margin="0" color="reference.text" mb="4r">
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
    <Div color="reference.text">
      <MonoText color="reference.highlight" mr="1r">Generics</MonoText>
      {typeParameterDetails.map(formatReferenceTypeParameter).join(', ')}
    </Div>
  )
}

type ExtendsLineProps = {
  extendsNames: string[]
}

/** Renders base types / extends clause when present. */
function ReferenceDocumentHeaderExtendsLine({ extendsNames }: ExtendsLineProps) {
  return (
    <Div color="reference.text">
      <MonoText color="reference.highlight" mr="1r">Extends</MonoText>
      {extendsNames.join(', ')}
    </Div>
  )
}

export function ReferenceDocumentHeader({ document }: { document: ReferenceDocument }) {
  return (
    <Div display="grid" gap="2r">
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
