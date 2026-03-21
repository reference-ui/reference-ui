import * as React from 'react'
import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import {
  Code,
  Div,
  H2,
  P,
  Small,
  Span,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from './primitives'
import { createReferenceRuntime, useReferenceStatus } from './Runtime'
import type { ReferenceProps, ReferenceStatus } from './types'

function renderSummary(status: ReferenceStatus, name: string): React.ReactNode {
  if (status.state === 'loading') {
    return (
      <P margin="0" color="reference.muted">
        Loading reference docs for <Code fontFamily="reference.mono">{name}</Code>.
      </P>
    )
  }

  if (status.state === 'error') {
    return (
      <P margin="0" color="reference.muted">
        Failed to load <Code fontFamily="reference.mono">{name}</Code>: {status.message}
      </P>
    )
  }

  const { data } = status
  const kindLabel = data.kind === 'typeAlias' ? 'Type alias' : 'Interface'

  return (
    <Div display="grid" gap="reference.xs">
      <P margin="0" color="reference.muted">
        {kindLabel} loaded from the generated Tasty manifest for{' '}
        <Code fontFamily="reference.mono">{data.name}</Code>.
      </P>
      {data.typeParameters.length > 0 ? (
        <Small color="reference.muted">Generics: {data.typeParameters.join(', ')}</Small>
      ) : null}
      {data.extendsNames.length > 0 ? (
        <Small color="reference.muted">Extends: {data.extendsNames.join(', ')}</Small>
      ) : null}
    </Div>
  )
}

function renderContent(status: ReferenceStatus): React.ReactNode {
  if (status.state !== 'ready') {
    return null
  }

  const { data } = status

  if (data.kind === 'typeAlias') {
    return (
      <Div marginTop="reference.lg" display="grid" gap="reference.sm">
        <Small color="reference.muted">Definition</Small>
        <Code
          display="block"
          fontFamily="reference.mono"
          padding="reference.sm"
          background="reference.subtleBackground"
        >
          {data.definition ?? 'unknown'}
        </Code>
      </Div>
    )
  }

  return (
    <Div marginTop="reference.lg" display="grid" gap="reference.sm">
      <Small color="reference.muted">Members</Small>
      <Div overflow="auto">
        <Table
          width="100%"
          borderCollapse="collapse"
          css={{ tableLayout: 'fixed', minWidth: '42rem' }}
        >
          <Thead background="reference.subtleBackground">
            <Tr>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding="reference.sm"
                borderWidth="1px"
                borderStyle="solid"
                borderColor="reference.border"
              >
                <Span>Name</Span>
              </Th>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding="reference.sm"
                borderWidth="1px"
                borderStyle="solid"
                borderColor="reference.border"
              >
                <Span>Type</Span>
              </Th>
              <Th
                textAlign="left"
                verticalAlign="top"
                padding="reference.sm"
                borderWidth="1px"
                borderStyle="solid"
                borderColor="reference.border"
              >
                <Span>Modifiers</Span>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.members.map(member => (
              <Tr key={member.name}>
                <Td
                  verticalAlign="top"
                  padding="reference.sm"
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor="reference.border"
                >
                  <Code fontFamily="reference.mono">{member.name}</Code>
                </Td>
                <Td
                  verticalAlign="top"
                  padding="reference.sm"
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor="reference.border"
                >
                  <Code fontFamily="reference.mono">{member.type}</Code>
                </Td>
                <Td
                  verticalAlign="top"
                  padding="reference.sm"
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor="reference.border"
                >
                  {member.modifiers}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Div>
    </Div>
  )
}

export function createReferenceComponent(runtime: TastyBrowserRuntime) {
  const referenceRuntime = createReferenceRuntime(runtime)

  function Reference({ name }: ReferenceProps) {
    const status = useReferenceStatus(referenceRuntime, name)

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
        <H2 margin="0 0 0.5rem 0" fontSize="1rem" color="reference.foreground">
          Reference
        </H2>
        {renderSummary(status, name)}
        {renderContent(status)}
      </Div>
    )
  }

  Reference.displayName = 'Reference'
  return Reference
}
