// Entry for the COND-14 world. It takes the generated css runtime and
// emits the placeholder, file-button, and checked classes onto the input
// probes, sharing the checked class with the data-state twin beside them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('name').className = css({ _placeholder: { color: 'hint' } })
el('upload').className = css({ _file: { color: 'file' } })
const checked = css({ _checked: { color: 'tick' } })
el('agree').className = checked
el('agree-twin').className = checked
