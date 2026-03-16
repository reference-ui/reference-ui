import type { ReactNode } from 'react'
import {
  A,
  Code,
  Div,
  H2,
  H3,
  P,
  Span,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@reference-ui/react'
import type { ReferenceCellValue } from '../../../reference-core/src/reference/types'
import { colorsApiTables } from '../reference/colors.api'

function renderCellValue(value: ReferenceCellValue): ReactNode {
  if (value == null) {
    return <Span color="gray.500">-</Span>
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value.toString()
  }

  const content = value.code ? <Code>{value.text}</Code> : value.text

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

export function ColorsApi() {
  return (
    <Div
      borderWidth="1px"
      borderStyle="solid"
      borderColor="black"
      padding="4r"
      display="grid"
      gap="4r"
    >
      <Div display="grid" gap="2r">
        <H2 margin="0" fontSize="lg">
          API
        </H2>
        <P margin="0" color="gray.600">
          Reference docs for <Code>Colors</Code>.
        </P>
      </Div>
      {colorsApiTables.map(table => (
        <Div key={table.id} display="grid" gap="2r">
          <Div display="grid" gap="1r">
            <H3 margin="0" fontSize="md">
              <Code>{table.title}</Code>
            </H3>
            {table.description ? (
              <P margin="0" color="gray.600">
                {table.description}
              </P>
            ) : null}
          </Div>
          <Div overflow="auto">
            <Table width="100%" borderCollapse="collapse" css={{ minWidth: '42rem' }}>
              <Thead backgroundColor="gray.100">
                <Tr>
                  {table.columns.map(column => (
                    <Th
                      key={column.key}
                      textAlign="left"
                      verticalAlign="top"
                      padding="2r"
                      borderWidth="1px"
                      borderStyle="solid"
                      borderColor="black"
                    >
                      {column.label}
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
                        padding="2r"
                        borderWidth="1px"
                        borderStyle="solid"
                        borderColor="black"
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
  )
}
