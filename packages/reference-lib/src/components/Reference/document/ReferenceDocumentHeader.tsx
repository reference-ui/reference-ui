/**
 * Reference document header: the title band for one indexed document.
 * Takes the document payload and renders its name, kind, and summary.
 */
import * as React from 'react'
import { Div, P } from '@reference-ui/react'
import { formatReferenceTypeParameter, type ReferenceDocument } from '@reference-ui/types'
import { InlineCode } from '../components/shared/InlineCode'
import { MonoText } from '../components/shared/MonoText'
import { useReferenceHeading } from './ReferenceHeadingLevel'

type TitleRowProps = {
  name: string
  kindLabel: string
}

/**
 * Document symbol name and kind label (e.g. type alias, interface) on one line. The title sits under
 * the host page's own headings, so it stays small and its size never follows the heading level.
 */
function ReferenceDocumentHeaderTitleRow({ name, kindLabel }: TitleRowProps) {
  const Heading = useReferenceHeading()
  return (
    <Div display="flex" alignItems="baseline" flexWrap="wrap" columnGap="3r" rowGap="1r">
      <Heading
        margin="0"
        color="reference.text"
        fontFamily="reference.mono"
        weight="mono.semibold"
        fontSize="4r"
        lineHeight="1.5"
      >
        {name}
      </Heading>
      <Div fontFamily="reference.mono" color="reference.textLighter" fontSize="3.5r">
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
    <P margin="0" color="reference.text">
      <InlineCode text={description} />
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
    <Div display="grid" gap="1.5r" mb="1r">
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
