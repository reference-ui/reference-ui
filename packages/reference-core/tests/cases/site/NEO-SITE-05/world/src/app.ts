// Entry for the NEO-SITE-05 world. It takes a file-local function named css
// and emits the joined style keys as the node class, so the call looks like
// a site but binds to no Reference import. Nothing may extract, nothing may
// paint, and sync must still succeed without diagnostic noise.
function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

function css(styles: Record<string, string>): string {
  return Object.keys(styles).join(' ')
}

el('target').className = css({ color: 'cherry' })
