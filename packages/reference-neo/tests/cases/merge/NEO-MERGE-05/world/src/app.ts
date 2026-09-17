// Entry for the NEO-MERGE-05 world. It takes the args and list nodes from
// the page and emits one css() class string per node, so the multi-arg form
// and the merge-list form resolve the same base plus hover classes while
// the array itself never reads as a responsive value.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('args').className = css({ color: 'ember' }, { _hover: { color: 'ocean' } })

el('list').className = css([{ color: 'ember' }, { _hover: { color: 'ocean' } }])
