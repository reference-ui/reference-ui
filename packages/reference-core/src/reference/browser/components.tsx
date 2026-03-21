import * as React from 'react'
import type { ReferenceDocument, ReferenceMemberDocument } from './types'
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

interface ReferenceTagListProps {
  tags: ReferenceMemberDocument['tags']
}

const MEMBER_GRID_COLUMNS = 'minmax(0, 12rem) minmax(0, 8rem) minmax(0, 1fr)'

export function ReferenceFrame({ children }: ReferenceFrameProps) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
        background: 'reference.background',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.border',
        padding: 'reference.lg',
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
            <Code fontFamily="reference.mono">{document.name}</Code>
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
    <Div display="grid" gap="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <Code
        display="block"
        fontFamily="reference.mono"
        padding="reference.sm"
        background="reference.subtleBackground"
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
    <Div>
      {members.map(member => (
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
        paddingBlock: '1rem',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      <Div>
        <Code fontFamily="reference.mono">{member.name}</Code>
      </Div>

      <Div>
        <Code fontFamily="reference.mono">{member.typeLabel}</Code>
      </Div>

      <Div display="grid" gap="reference.sm">
        {member.tags.length > 0 ? <ReferenceTagList tags={member.tags} /> : null}
        {member.description ? (
          <P margin="0" color="reference.foreground">
            {member.description}
          </P>
        ) : null}
        {member.params.length > 0 ? <ReferenceParamList member={member} /> : null}
      </Div>
    </Div>
  )
}

function ReferenceParamList({ member }: { member: ReferenceMemberDocument }) {
  return (
    <Div display="grid" gap="reference.xs">
      {member.params.map(param => (
        <Div key={`${member.id}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <Small color="reference.muted">Param</Small>
            <Code fontFamily="reference.mono">{param.name}</Code>
            {param.type ? (
              <Small color="reference.muted">
                <Code fontFamily="reference.mono">{param.type}</Code>
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

function ReferenceTagList({ tags }: ReferenceTagListProps) {
  return (
    <Div display="flex" gap="reference.sm" flexWrap="wrap">
      {tags.map(tag => (
        <Span
          key={`${tag.highlighted ? 'highlighted' : 'default'}-${tag.label}`}
          css={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '2rem',
            paddingInline: '0.75rem',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: tag.highlighted ? 'reference.foreground' : 'reference.border',
            borderRadius: '0.375rem',
            background: tag.highlighted ? 'reference.foreground' : 'reference.subtleBackground',
            color: tag.highlighted ? 'reference.background' : 'reference.foreground',
          }}
        >
          <Code fontFamily="reference.mono">{tag.label}</Code>
        </Span>
      ))}
    </Div>
  )
}
