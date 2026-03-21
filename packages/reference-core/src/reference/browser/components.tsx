import * as React from 'react'
import type {
  ReferenceDocument,
  ReferenceMemberDocument,
  ReferenceMemberTypeSummary,
  ReferenceParamDoc,
  ReferenceValueOption,
} from './types'
import { Code, Div, H2, P, Small, Span } from '@reference-ui/react'

interface ReferenceFrameProps {
  children: React.ReactNode
}

interface ReferenceNoticeProps {
  children: React.ReactNode
}

interface ReferenceDocumentViewProps {
  document: ReferenceDocument
}

const MEMBER_GRID_COLUMNS = 'minmax(0, 13rem) minmax(0, 9rem) minmax(0, 1fr)'
const REFERENCE_CODE_RESET_CSS = {
  background: 'transparent',
  color: 'inherit',
  padding: '0',
  borderRadius: '0',
  boxShadow: 'none',
}

export function ReferenceFrame({ children }: ReferenceFrameProps) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
        background: 'reference.background',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.border',
        borderRadius: '0.75rem',
        padding: 'reference.xl',
      }}
    >
      {children}
    </Div>
  )
}

export function ReferenceNotice({ children }: ReferenceNoticeProps) {
  return (
    <P margin="0" color="reference.muted">
      {children}
    </P>
  )
}

export function ReferenceDocumentView({ document }: ReferenceDocumentViewProps) {
  return (
    <Div display="grid" gap="reference.lg">
      <Div display="grid" gap="reference.sm">
        <Div display="flex" alignItems="center" gap="reference.sm" flexWrap="wrap">
          <H2 margin="0" fontSize="1rem" color="reference.foreground">
            <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
              {document.name}
            </Code>
          </H2>
          <Small color="reference.muted">{document.kindLabel}</Small>
        </Div>
        {document.description ? <P margin="0">{document.description}</P> : null}
        {document.typeParameters.length > 0 ? (
          <Small color="reference.muted">Generics: {document.typeParameters.join(', ')}</Small>
        ) : null}
        {document.extendsNames.length > 0 ? (
          <Small color="reference.muted">Extends: {document.extendsNames.join(', ')}</Small>
        ) : null}
      </Div>

      {document.kind === 'typeAlias' ? (
        <ReferenceTypeAliasDefinition definition={document.definition} />
      ) : (
        <ReferenceMemberList members={document.members} />
      )}
    </Div>
  )
}

function ReferenceTypeAliasDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="reference.sm" paddingTop="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <Code
        display="block"
        fontFamily="reference.mono"
        css={{
          padding: '0.875rem 1rem',
          background: 'reference.primarySoftBackground',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'reference.primarySoftBorder',
          borderRadius: '0.75rem',
          color: 'reference.primarySoftForeground',
        }}
      >
        {definition ?? 'unknown'}
      </Code>
    </Div>
  )
}

function ReferenceMemberList({ members }: { members: ReferenceMemberDocument[] }) {
  if (members.length === 0) {
    return (
      <Small color="reference.muted">
        No members were emitted for this interface.
      </Small>
    )
  }

  return (
    <Div
      css={{
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      {members.map((member) => (
        <ReferenceMemberRow key={member.id} member={member} />
      ))}
    </Div>
  )
}

function ReferenceMemberRow({ member }: { member: ReferenceMemberDocument }) {
  return (
    <Div
      css={{
        display: 'grid',
        gridTemplateColumns: MEMBER_GRID_COLUMNS,
        columnGap: '1rem',
        alignItems: 'start',
        paddingBlock: '1.25rem',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'reference.border',
      }}
    >
      <Div paddingTop="reference.xs">
        <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
          {member.name}
        </Code>
      </Div>

      <Div paddingTop="reference.xs">
        <Code fontFamily="reference.mono" color="reference.muted" css={REFERENCE_CODE_RESET_CSS}>
          {member.typeLabel}
        </Code>
      </Div>

      <Div display="grid" gap="reference.md">
        {member.summary.memberTypeSummary ? (
          <ReferenceMemberTypeSummaryView summary={member.summary.memberTypeSummary} />
        ) : null}
        {member.summary.description ? (
          <P margin="0" color="reference.foreground">
            {member.summary.description}
          </P>
        ) : null}
        {member.summary.paramDocs.length > 0 ? (
          <ReferenceParamList memberId={member.id} params={member.summary.paramDocs} />
        ) : null}
      </Div>
    </Div>
  )
}

function ReferenceParamList({ memberId, params }: { memberId: string; params: ReferenceParamDoc[] }) {
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
      {params.map(param => (
        <Div key={`${memberId}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <Small color="reference.muted">Param</Small>
            <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
              {param.name}
            </Code>
            {param.type ? (
              <Small color="reference.muted">
                <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
                  {param.type}
                </Code>
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
    </Div>
  )
}

function ReferenceMemberTypeSummaryView({ summary }: { summary: ReferenceMemberTypeSummary }) {
  switch (summary.kind) {
    case 'valueSet':
      return <ReferenceValueSet options={summary.options} />
    case 'callSignature':
    case 'typeExpression':
    case 'opaqueType':
      return <ReferenceSummaryText text={summary.text} />
    default:
      return null
  }
}

function ReferenceSummaryText({ text }: { text: string }) {
  return (
    <Span
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '2rem',
        width: 'fit-content',
        maxWidth: '100%',
        paddingInline: '0.75rem',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.primarySoftBorder',
        borderRadius: '0.5rem',
        background: 'reference.primarySoftBackground',
        color: 'reference.primarySoftForeground',
      }}
    >
      <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
        {text}
      </Code>
    </Span>
  )
}

function ReferenceValueSet({ options }: { options: ReferenceValueOption[] }) {
  return (
    <Div display="flex" gap="reference.sm" flexWrap="wrap">
      {options.map(option => (
        <ReferenceValueOptionPill key={`${option.isDefault ? 'default' : 'value'}-${option.label}`} option={option} />
      ))}
    </Div>
  )
}

function ReferenceValueOptionPill({ option }: { option: ReferenceValueOption }) {
  return (
    <Span
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '2rem',
        paddingInline: '0.75rem',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: option.isDefault ? 'reference.primary' : 'reference.primarySoftBorder',
        borderRadius: '9999px',
        background: option.isDefault ? 'reference.primary' : 'reference.primarySoftBackground',
        color: option.isDefault ? 'reference.primaryForeground' : 'reference.primarySoftForeground',
      }}
    >
      <Code fontFamily="reference.mono" css={REFERENCE_CODE_RESET_CSS}>
        {option.label}
      </Code>
    </Span>
  )
}
