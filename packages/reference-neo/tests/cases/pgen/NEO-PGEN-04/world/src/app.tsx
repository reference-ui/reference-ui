// Entry for the PGEN-04 world. It takes the bound table primitives and emits
// one probe per html-table family member nested as a real table, with the
// special-family Caption completing the structure. Every probe paints brand
// through a sibling style prop.
import { createRoot } from 'react-dom/client'
import { Caption, Col, Colgroup, Table, Tbody, Td, Tfoot, Th, Thead, Tr } from '@reference-ui/react'

export function PgenTable() {
  return (
    <Table id="tbl-table" color="brand">
      <Caption id="tbl-caption" color="brand">caption</Caption>
      <Colgroup id="tbl-colgroup" color="brand">
        <Col id="tbl-col" color="brand" />
      </Colgroup>
      <Thead id="tbl-thead" color="brand">
        <Tr id="tbl-tr-head" color="brand">
          <Th id="tbl-th" color="brand">head</Th>
        </Tr>
      </Thead>
      <Tbody id="tbl-tbody" color="brand">
        <Tr id="tbl-tr-body" color="brand">
          <Td id="tbl-td" color="brand">body</Td>
        </Tr>
      </Tbody>
      <Tfoot id="tbl-tfoot" color="brand">
        <Tr id="tbl-tr-foot" color="brand">
          <Td id="tbl-td-foot" color="brand">foot</Td>
        </Tr>
      </Tfoot>
    </Table>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenTable />)
