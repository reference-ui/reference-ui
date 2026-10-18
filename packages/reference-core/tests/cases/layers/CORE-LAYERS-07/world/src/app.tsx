// Entry for the CORE-LAYERS-07 world. It takes the unstyled sibling and one use of each
// upstream token name per authoring form: a JSX style prop on Div, and a css() call in
// render. Under layers each colour, spacing, radius and font-size use warns at its line
// here and paints no layer value, and a font family stays silent; the spec swaps the
// config to extends for the positive control.
import { createRoot } from 'react-dom/client'
import { Div, css } from '@reference-ui/react'

function App() {
  return (
    <main>
      <Div id="plain">plain sibling</Div>
      <Div id="jsx-color" color="upInk">jsx colour</Div>
      <Div id="jsx-gap" p="upGap">jsx spacing</Div>
      <Div id="jsx-radius" borderRadius="upRadius">jsx radius</Div>
      <Div id="jsx-font" fontFamily="upFont">jsx font</Div>
      <Div id="jsx-size" fontSize="upSize">jsx size</Div>
      <div id="css-color" className={css({ color: 'upInk' })}>css colour</div>
      <div id="css-gap" className={css({ padding: 'upGap' })}>css spacing</div>
      <div id="css-radius" className={css({ borderRadius: 'upRadius' })}>css radius</div>
      <div id="css-font" className={css({ fontFamily: 'upFont' })}>css font</div>
      <div id="css-size" className={css({ fontSize: 'upSize' })}>css size</div>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
