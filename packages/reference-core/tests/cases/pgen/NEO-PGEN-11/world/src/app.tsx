// Entry for the PGEN-11 world. It takes the bound special primitives and
// emits the specials no other render case owns: Obj, Var, and Map with
// native wiring, the void Br, Hr, and Wbr, plus a Caption in its table and
// a Menu. The caption and menu ref callbacks record which host interface
// they receive so the spec can prove the overrides land at runtime.
import { createRoot } from 'react-dom/client'
import { Br, Caption, Hr, Map as MapPrimitive, Menu, Obj, Table, Var, Wbr } from '@reference-ui/react'

export function PgenSpecial() {
  return (
    <>
      <div id="special-root">
        <Obj id="sp-obj" data="about:blank" type="text/html" color="brand">
          obj
        </Obj>
        <Var id="sp-var" color="brand">x</Var>
        <MapPrimitive id="sp-map" name="pgen11" color="brand">map</MapPrimitive>
        <Br id="sp-br" color="brand" />
        <Hr id="sp-hr" color="brand" />
        <Wbr id="sp-wbr" color="brand" />
      </div>
      <Table id="sp-table" color="brand">
        <Caption
          id="sp-caption"
          color="brand"
          ref={(node: unknown) => {
            if (node instanceof HTMLTableCaptionElement) node.dataset.override = 'caption'
            else if (node instanceof HTMLElement) node.dataset.override = 'miss'
          }}
        >
          cap
        </Caption>
      </Table>
      <Menu
        id="sp-menu"
        color="brand"
        ref={(node: unknown) => {
          if (node instanceof HTMLMenuElement) node.dataset.override = 'menu'
          else if (node instanceof HTMLElement) node.dataset.override = 'miss'
        }}
      >
        menu
      </Menu>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenSpecial />)
