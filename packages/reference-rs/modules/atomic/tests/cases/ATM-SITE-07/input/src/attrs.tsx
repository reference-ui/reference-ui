import { Div } from '@reference-ui/react'

function Foo() {
  return <div />
}

export function App() {
  return (
    <>
      <Div id="root" onClick={() => {}} tabIndex={0} aria-label="hello" mt="2r" />
      <Foo color="red" />
    </>
  )
}
