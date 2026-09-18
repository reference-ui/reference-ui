// Entry for the NEO-SITE-17 world. It takes the page root and a theme query
// flag and emits a chrome divider whose borderBottomColor rides a
// component-body const ternary — the BookShell subtleBorder shape — so the
// extractor must compile both color arms while the runtime paints exactly
// one. With no query string the theme is dark and the ink arm paints.
import { Div, createRoot } from '@reference-ui/react'

const params = new URLSearchParams(window.location.search)
const isDark = params.get('theme') !== 'light'

function Divider() {
  const subtleBorder = isDark ? 'ink' : 'mist'
  return (
    <Div id="divider" p="md" borderBottom="1px solid" borderBottomColor={subtleBorder}>
      chrome divider
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Divider />)
