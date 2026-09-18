// Entry for the NEO-SITE-15 world. It takes the page root and the page URL
// and emits two Divs whose _hover rides a literal object ternary over a
// runtime-only flag, so the extractor must compile both arms while the
// browser hovers exactly one. With no query string the flag is true and the
// brand arm paints, on the twin without hovering and on the probe on hover.
import { Div, createRoot } from '@reference-ui/react'

const params = new URLSearchParams(window.location.search)
const loud = params.get('arm') !== 'quiet'

function Target() {
  return (
    <Div id="target" _hover={loud ? { backgroundColor: 'brand' } : { backgroundColor: 'paper' }}>
      conditional ternary
    </Div>
  )
}

function Twin() {
  return (
    <Div
      id="twin"
      data-hover
      _hover={loud ? { backgroundColor: 'brand' } : { backgroundColor: 'paper' }}
    >
      conditional twin
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(
  <>
    <Target />
    <Twin />
  </>,
)
