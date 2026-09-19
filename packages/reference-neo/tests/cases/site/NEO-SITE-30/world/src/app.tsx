// Entry for the NEO-SITE-30 world. It takes the page root and emits two
// tabs whose indicator rides the verbatim Tabs guard — `const isSelected =
// context ? context.value === value : false` gating `borderBottom` and
// `borderBottomColor` ternaries — so the extractor must compile both arms
// while the runtime paints the ring arm on the selected tab and the
// transparent arm on the plain tab. Context is a module const, so the
// comparison arm is dynamic and the binding is partially static.
import { Div, createRoot } from '@reference-ui/react'

const context = { value: 'tab1' }

function Tab({ value, id }: { value: string; id: string }) {
  const isSelected = context ? context.value === value : false
  return (
    <Div
      id={id}
      borderBottom={isSelected ? '3px solid' : '3px solid transparent'}
      borderBottomColor={isSelected ? 'ring' : 'transparent'}
    >
      {value}
    </Div>
  )
}

function App() {
  return (
    <Div>
      <Tab id="tab-selected" value="tab1" />
      <Tab id="tab-plain" value="tab2" />
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
