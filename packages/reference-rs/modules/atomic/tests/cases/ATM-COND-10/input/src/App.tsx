import { Div } from '@reference-ui/react'

export function App() {
  return (
    <Div
      _active={{ color: 'red.500' }}
      _focus={{ bg: 'blue.500' }}
      _focusVisible={{ outlineColor: 'yellow.500' }}
      _disabled={{ opacity: '0.5' }}
      _checked={{ borderColor: 'green.500' }}
    />
  )
}
