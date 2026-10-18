// Entry for the PGEN-06 world. It takes the bound interactive primitives
// and emits one probe per html-interactive family member with native
// wiring: a mapped area, a toggling details, a closed dialog, live plus
// twin hover forms, and a dark island repainting a _dark summary against
// its light control.
import { createRoot } from 'react-dom/client'
import { Area, Details, Dialog, Div, Form, Summary } from '@reference-ui/react'

export function PgenInteractive() {
  return (
    <div id="int-root">
      <map name="pgen6">
        <Area id="int-area" shape="rect" coords="0,0,10,10" href="#int-root" alt="zone" color="brand" />
      </map>
      <Details id="int-details" color="brand">
        <Summary id="int-summary" color="brand">more</Summary>
        <Div id="int-hidden" color="brand">hidden</Div>
      </Details>
      <Dialog id="int-dialog" color="brand">dialog</Dialog>
      <Form id="int-live" action="/live" color="ink" _hover={{ color: 'brand' }}>
        live
      </Form>
      <Form id="int-twin" action="/twin" data-hover _hover={{ color: 'brand' }}>
        twin
      </Form>
      <Details id="int-island" colorMode="dark" color="brand">
        <Summary id="int-brand-dark" color="brand" css={{ _dark: { color: 'paper' } }}>
          dark
        </Summary>
      </Details>
      <Summary id="int-brand-light" color="brand" css={{ _dark: { color: 'paper' } }}>
        light
      </Summary>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenInteractive />)
