import { css, Div } from '@reference-ui/react'

export const dividerTrigger = {
  color: 'blue.700',
  borderBottomColor: 'gray.700',
  _hover: { backgroundColor: 'gray.100' },
  css: { paddingInline: '0.5rem', backgroundColor: 'transparent' },
  style: { borderRadius: 0, display: 'flex' },
}

export function App() {
  return <Div {...dividerTrigger} margin="2r" />
}

export function Inline() {
  return (
    <Div
      {...{
        css: { color: 'red' },
        r: { md: { padding: '1r' } },
        mt: '2r',
        style: { margin: 0 },
        'data-testid': 'trigger',
        'aria-label': 'trigger',
        onClick: () => {},
        className: 'trigger',
      }}
    />
  )
}

const responsive = {
  r: { md: { marginTop: '4px' } },
  color: 'green.600',
}

export function Recorded() {
  return <Div {...responsive} />
}

// Control: `css()` keeps style-object semantics — `css: 1` is nonsense CSS.
export const control = css({ css: 1, padding: '4px' })
