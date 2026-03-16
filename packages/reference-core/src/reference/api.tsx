import type { ReactNode } from 'react'
import {
  A,
  Code,
  Div,
  H2,
  H3,
  P,
  Small,
  Span,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '../system/primitives'
import { referenceTokens } from './tokens'
import type { ReferenceCellValue, ReferenceTable } from './types'

export interface ReferenceApiProps {
  name?: string
  tables?: readonly ReferenceTable[]
}

/**
 * Main reference entry component.
 * The first pass stays intentionally simple while the worker/Tasty pipeline lands.
 */
function renderCellValue(value: ReferenceCellValue): ReactNode {
  if (value == null) {
    return <Span color={referenceTokens.color.muted}>-</Span>
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value.toString()
  }

  const content = value.code ? (
    <Code fontFamily={referenceTokens.font.mono}>{value.text}</Code>
  ) : (
    value.text
  )

  if (value.href) {
    return (
      <A href={value.href} title={value.title}>
        {content}
      </A>
    )
  }

  if (value.title) {
    return <Span title={value.title}>{content}</Span>
  }

  return content
}

export function API({ name, tables = [] }: ReferenceApiProps) {
  const hasTables = tables.length > 0

  return (
    <Div
      css={{
        color: referenceTokens.color.foreground,
        background: referenceTokens.color.background,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: referenceTokens.color.border,
        padding: referenceTokens.space.lg,
      }}
    >
      <H2 margin="0 0 0.5rem 0" fontSize="1rem">
        API
      </H2>
      <P margin="0" color={referenceTokens.color.muted}>
        {hasTables ? (
          <>
            Reference docs for{' '}
            {name ? <Code fontFamily={referenceTokens.font.mono}>{name}</Code> : 'this module'}.
          </>
        ) : (
          <>
            Reference docs for{' '}
            {name ? <Code fontFamily={referenceTokens.font.mono}>{name}</Code> : 'this module'} will
            render here.
          </>
        )}
      </P>
      {hasTables ? (
        <Div marginTop={referenceTokens.space.lg} display="grid" gap={referenceTokens.space.lg}>
          {tables.map(table => (
            <Div key={table.id} display="grid" gap={referenceTokens.space.sm}>
              <Div display="grid" gap={referenceTokens.space.xs}>
                <H3 margin="0" fontSize="0.95rem">
                  <Code fontFamily={referenceTokens.font.mono}>{table.title}</Code>
                </H3>
                {table.description ? (
                  <P margin="0" color={referenceTokens.color.muted}>
                    {table.description}
                  </P>
                ) : null}
              </Div>
              <Div overflow="auto">
                <Table
                  width="100%"
                  borderCollapse="collapse"
                  css={{ tableLayout: 'fixed', minWidth: '42rem' }}
                >
                  <Thead background={referenceTokens.color.subtleBackground}>
                    <Tr>
                      {table.columns.map(column => (
                        <Th
                          key={column.key}
                          textAlign="left"
                          verticalAlign="top"
                          padding={referenceTokens.space.sm}
                          borderWidth="1px"
                          borderStyle="solid"
                          borderColor={referenceTokens.color.border}
                        >
                          <Div display="grid" gap={referenceTokens.space.xxs}>
                            <Span>{column.label}</Span>
                            {column.description ? (
                              <Small color={referenceTokens.color.muted}>
                                {column.description}
                              </Small>
                            ) : null}
                          </Div>
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {table.rows.map((row, rowIndex) => (
                      <Tr key={`${table.id}-${rowIndex}`}>
                        {table.columns.map(column => (
                          <Td
                            key={column.key}
                            verticalAlign="top"
                            padding={referenceTokens.space.sm}
                            borderWidth="1px"
                            borderStyle="solid"
                            borderColor={referenceTokens.color.border}
                          >
                            {renderCellValue(row[column.key] ?? null)}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Div>
            </Div>
          ))}
        </Div>
      ) : null}
    </Div>
  )
}
